import type { DayData } from "../types/schedule";
import type { CalendarEvent } from "../services/googleCalendar";

export interface ScheduleOptions {
    referenceDate?: string;       // ISO date for this day, e.g. "2026-06-09"
    prevDayCarryOver?: any[];     // blocks from prev day that extend past midnight
}

export function computeSchedule(
    day: DayData,
    calendarEvents: CalendarEvent[] = [],
    options: ScheduleOptions = {}
) {
    let t = day.actualWakeTime !== null ? day.actualWakeTime : day.wakeTime;
    const scheduled: any[] = [];
    const warnings: string[] = [];

    const isWorkday = day.workStart > 0;
    const commuteStart = isWorkday ? day.workStart - day.commuteMins : 0;

    let aimInMorning = false;
    let swimActive = false;
    let totalNapMins = 0;

    let onBlocksCount = 0;
    let totalRealBlocks = 0;

    for (const block of day.blocks) {
        totalRealBlocks++;
        if (block.on) onBlocksCount++;
        
        if (!block.on) continue;
        if (block.type === "swim") swimActive = true;
        if (block.type === "nap" || block.type === "sleep") totalNapMins += block.dur;
    }

    const dayScore = totalRealBlocks > 0 ? (onBlocksCount / totalRealBlocks) * 100 : 100;

    // --- Carry-over blocks from previous day ---
    const carryOverBlocks: any[] = [];
    if (options.prevDayCarryOver && options.prevDayCarryOver.length > 0) {
        for (const cb of options.prevDayCarryOver) {
            // Convert: if prev day block ended at e.g. 1560 mins (2 AM next day),
            // that means it occupies 0..120 on *this* day
            const overlapStart = Math.max(0, cb.start - 1440);
            const overlapEnd = cb.end - 1440;
            if (overlapEnd <= 0) continue;
            carryOverBlocks.push({
                id: `carryover-${cb.id}`,
                type: cb.type,
                label: cb.label,
                start: overlapStart,
                end: overlapEnd,
                dur: overlapEnd - overlapStart,
                virtual: true,
                carryOver: true,
                carryFromDay: cb.carryFromDay || "prev",
            });
        }
    }

    const sortedEvents = [...calendarEvents].filter(e => !e.allDay).sort((a, b) => a.startMins - b.startMins);
    const processedEvents = new Set<string>();

    // Helper to process overlapping google events before placing a block
    const pushPastGoogleEvents = (blockDur: number) => {
        while (true) {
            const overlapping = sortedEvents.find(ev => 
                !processedEvents.has(ev.id) &&
                ((t >= ev.startMins && t < ev.endMins) || 
                 (t + blockDur > ev.startMins && t <= ev.startMins))
            );

            if (!overlapping) break;

            scheduled.push({
                id: `google-${overlapping.id}`,
                type: "google-calendar",
                label: overlapping.title,
                start: overlapping.startMins,
                end: overlapping.endMins,
                dur: overlapping.endMins - overlapping.startMins,
                virtual: true,
                source: "google",
                color: overlapping.color,
                originalEvent: overlapping
            });
            processedEvents.add(overlapping.id);

            t = Math.max(t, overlapping.endMins);
        }
    };

    for (const block of day.blocks) {
        if (!block.on) {
            scheduled.push({
                ...block,
                start: t,
                end: t + block.dur,
            });
            continue;
        }

        // If block has actualStart with a date, compute absolute offset
        let blockActualStart = block.actualStart;
        if (blockActualStart != null && block.actualStartDate && options.referenceDate) {
            const refDate = new Date(options.referenceDate);
            const blockDate = new Date(block.actualStartDate);
            const dayDiff = Math.round((blockDate.getTime() - refDate.getTime()) / 86400000);
            blockActualStart = dayDiff * 1440 + blockActualStart;
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

            if (blockActualStart != null) t = blockActualStart;
            pushPastGoogleEvents(block.dur);

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
            if (blockActualStart != null) t = blockActualStart;
            pushPastGoogleEvents(block.dur);

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

    // Push any remaining Google events that happen after all planner blocks
    for (const ev of sortedEvents) {
        if (!processedEvents.has(ev.id)) {
            scheduled.push({
                id: `google-${ev.id}`,
                type: "google-calendar",
                label: ev.title,
                start: ev.startMins,
                end: ev.endMins,
                dur: ev.endMins - ev.startMins,
                virtual: true,
                source: "google",
                color: ev.color,
                originalEvent: ev
            });
            processedEvents.add(ev.id);
        }
    }

    // Sort scheduled array by start time to ensure perfect chronological order
    scheduled.sort((a, b) => a.start - b.start);

    // Identify gaps between scheduled items
    const scheduledWithGaps: any[] = [];

    // First, add carry-over blocks
    if (carryOverBlocks.length > 0) {
        carryOverBlocks.sort((a, b) => a.start - b.start);
        for (const cb of carryOverBlocks) {
            scheduledWithGaps.push(cb);
        }
        // Add a gap between carry-over end and wake time if needed
        const lastCarryOver = carryOverBlocks[carryOverBlocks.length - 1];
        const wakeTime = day.actualWakeTime ?? day.wakeTime;
        if (lastCarryOver.end < wakeTime) {
            scheduledWithGaps.push({
                id: `carryover-sleep`,
                label: "Sleep",
                type: "sleep",
                start: lastCarryOver.end,
                end: wakeTime,
                dur: wakeTime - lastCarryOver.end,
                virtual: true,
                carryOver: true,
            });
        }
    }

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
        } else if (scheduledWithGaps.length > 0) {
            // Check gap between carry-over blocks and first scheduled block
            const lastPrev = scheduledWithGaps[scheduledWithGaps.length - 1];
            if (curr.start > lastPrev.end) {
                const gapDur = curr.start - lastPrev.end;
                scheduledWithGaps.push({
                    id: `gap-${lastPrev.end}`,
                    label: `Gap (${gapDur}m)`,
                    type: "free",
                    start: lastPrev.end,
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
    
    let sleepDurationMins = 0;
    if (day.actualSleepTime != null && day.actualSleepDate && day.actualWakeDate) {
        const sleepDate = new Date(day.actualSleepDate);
        const wakeDate = new Date(day.actualWakeDate || day.actualSleepDate);
        let sleepAbsolute = sleepDate.getTime() / 60000 + (day.actualSleepTime % 1440);
        let wakeAbsolute = wakeDate.getTime() / 60000 + ((day.actualWakeTime ?? day.wakeTime) % 1440);
        
        let diff = wakeAbsolute - sleepAbsolute;
        
        if (diff < 0) diff += 24 * 60;
        
        if (diff > 24 * 60) diff -= 24 * 60;
        
        sleepDurationMins = diff;
    } else if (sleepTime <= 24 * 60) {
        sleepDurationMins = (24 * 60 - sleepTime) + day.wakeTime;
    } else {
        const sleepNextDayMins = sleepTime - 24 * 60;
        sleepDurationMins = day.wakeTime - sleepNextDayMins;
    }

    const nightSleepMins = sleepDurationMins;
    sleepDurationMins += totalNapMins;

    if (sleepDurationMins < day.sleepTarget) {
        warnings.push(`Sleep deficit! You are getting ${(sleepDurationMins / 60).toFixed(1)}h of total sleep, which is under your ${(day.sleepTarget / 60).toFixed(1)}h target.`);
    }

    // Add a virtual sleep block at the end of the day
    if (nightSleepMins > 0) {
        scheduledWithGaps.push({
            id: `virtual-sleep-end`,
            label: "Sleep",
            type: "sleep",
            start: sleepTime,
            end: sleepTime + nightSleepMins,
            dur: nightSleepMins,
            virtual: true,
        });
    }

    // --- Export blocks that bleed past midnight for next day's carry-over ---
    const carryOverForNextDay: any[] = [];
    for (const block of scheduled) {
        if (block.end > 1440 && !block.virtual) {
            carryOverForNextDay.push({
                ...block,
                carryFromDay: "current",
            });
        }
    }

    // Determine "Now"
    const now = new Date();
    
    let currentMins = -1;
    if (options.referenceDate) {
        // Find exactly how many minutes `now` is from the reference day's midnight
        const refD = new Date(options.referenceDate + "T00:00:00");
        const diffMins = Math.floor((now.getTime() - refD.getTime()) / 60000);
        // We only care about Now if it falls within the 48-hour render window of the timeline
        if (diffMins >= 0 && diffMins < 2880) {
            currentMins = diffMins;
        }
    } else {
        currentMins = now.getHours() * 60 + now.getMinutes();
    }

    let nowBlockIndex = -1;
    let nowProgress = 0;

    if (currentMins >= 0) {
        for (let i = 0; i < scheduledWithGaps.length; i++) {
            const b = scheduledWithGaps[i];
            if (currentMins >= b.start && currentMins < b.end) {
                nowBlockIndex = i;
                nowProgress = (currentMins - b.start) / b.dur;
                break;
            }
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
        carryOverForNextDay,
    };
}