import type { DayData } from "../types/schedule";

export function computeSchedule(day: DayData) {
    let t = day.actualWakeTime !== null ? day.actualWakeTime : day.wakeTime;
    const scheduled = [];
    const warnings: string[] = [];

    const isWorkday = day.workStart > 0;
    const commuteStart = isWorkday ? day.workStart - day.commuteMins : 0;

    let aimInMorning = false;
    let swimActive = false;
    let totalNapMins = 0;

    let onBlocksCount = 0;
    let totalRealBlocks = 0;

    // First pass to find specific blocks for validation & scoring
    for (const block of day.blocks) {
        totalRealBlocks++;
        if (block.on) onBlocksCount++;
        
        if (!block.on) continue;
        if (block.type === "swim") swimActive = true;
        if (block.type === "nap") totalNapMins += block.dur;
    }

    const dayScore = totalRealBlocks > 0 ? (onBlocksCount / totalRealBlocks) * 100 : 100;

    for (const block of day.blocks) {
        if (!block.on) {
            scheduled.push({
                ...block,
                start: t,
                end: t + block.dur,
            });
            continue;
        }

        if (block.type === "work" && isWorkday) {
            if (t < commuteStart) {
                scheduled.push({
                    id: `gap-${t}`,
                    label: `Free Buffer (${commuteStart - t}m)`,
                    type: "free",
                    start: t,
                    end: commuteStart,
                    dur: commuteStart - t,
                    virtual: true,
                });
                t = commuteStart;
            } else if (t > commuteStart) {
                warnings.push("You are running late for work based on your commute and morning blocks!");
            }

            scheduled.push({
                id: `commute-to`,
                label: "Commute To Work",
                type: "travel",
                start: t,
                end: t + day.commuteMins,
                dur: day.commuteMins,
                virtual: true,
            });
            t += day.commuteMins;

            if (block.actualStart != null) t = Math.max(t, block.actualStart);

            scheduled.push({
                ...block,
                start: t,
                end: t + block.dur,
            });
            t += block.dur;

            scheduled.push({
                id: `commute-home`,
                label: "Commute Home",
                type: "travel",
                start: t,
                end: t + day.commuteMins + 15,
                dur: day.commuteMins + 15,
                virtual: true,
            });
            t += day.commuteMins + 15;
        } else {
            if (block.actualStart != null) t = Math.max(t, block.actualStart);

            // Check if 10 DM aim routine is placed before work
            if (block.type === "aim" && t < day.workStart && isWorkday) {
                aimInMorning = true;
            }

            scheduled.push({
                ...block,
                start: t,
                end: t + block.dur,
            });
            t += block.dur;
        }
    }

    // Identify gaps between scheduled items if any logic leaves a gap (not likely with sequential, but let's be robust)
    const scheduledWithGaps = [];
    for (let i = 0; i < scheduled.length; i++) {
        const curr = scheduled[i];
        if (i > 0) {
            const prev = scheduled[i - 1];
            if (curr.start > prev.end) {
                const gapDur = curr.start - prev.end;
                scheduledWithGaps.push({
                    id: `gap-${prev.end}`,
                    label: `Gap (${gapDur}m)`,
                    type: "free",
                    start: prev.end,
                    end: curr.start,
                    dur: gapDur,
                    virtual: true,
                });
            }
        }
        scheduledWithGaps.push(curr);
    }

    // Constraints & Warnings Validation
    if (swimActive && aimInMorning && isWorkday) {
        warnings.push("Not enough morning buffer for 10 DM Aim routine because Swimming is active! 10 DM needs 80 mins but swim leaves only ~60.");
    }

    const sleepTime = t;
    
    // Calculate sleep duration
    let sleepDurationMins = 0;
    if (sleepTime <= 24 * 60) {
        sleepDurationMins = (24 * 60 - sleepTime) + day.wakeTime;
    } else {
        const sleepNextDayMins = sleepTime - 24 * 60;
        sleepDurationMins = day.wakeTime - sleepNextDayMins;
    }

    // Add nap to sleep duration
    sleepDurationMins += totalNapMins;

    if (sleepDurationMins < day.sleepTarget) {
        warnings.push(`Sleep deficit! You are getting ${(sleepDurationMins / 60).toFixed(1)}h of total sleep, which is under your ${(day.sleepTarget / 60).toFixed(1)}h target.`);
    }

    // Determine "Now"
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();

    let nowBlockIndex = -1;
    let nowProgress = 0;

    for (let i = 0; i < scheduledWithGaps.length; i++) {
        const b = scheduledWithGaps[i];
        if (currentMins >= b.start && currentMins < b.end) {
            nowBlockIndex = i;
            nowProgress = (currentMins - b.start) / b.dur;
            break;
        } else if (currentMins < b.start && nowBlockIndex === -1) {
            // we haven't reached this block yet, and we are before it
            // wait, if we are here, we are technically in a gap before the first block
        }
    }

    return {
        scheduled: scheduledWithGaps,
        sleepTime,
        totalNapMins,
        warnings,
        nowBlockIndex,
        nowProgress,
        currentMins,
        dayScore,
    };
}