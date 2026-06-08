import type { DayData } from "../types/schedule";

export function computeSchedule(day: DayData) {
    let t = day.wakeTime;
    const scheduled = [];
    const warnings: string[] = [];

    const isWorkday = day.workStart > 0;
    const commuteStart = isWorkday ? day.workStart - day.commuteMins : 0;

    let aimInMorning = false;
    let swimActive = false;

    // First pass to find specific blocks for validation
    for (const block of day.blocks) {
        if (!block.on) continue;
        if (block.type === "swim") swimActive = true;
    }

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
                    label: "Free Buffer",
                    type: "free",
                    start: t,
                    end: commuteStart,
                    virtual: true,
                });
                t = commuteStart;
            }

            scheduled.push({
                label: "Commute To Work",
                type: "travel",
                start: t,
                end: t + day.commuteMins,
                virtual: true,
            });
            t += day.commuteMins;

            scheduled.push({
                ...block,
                start: day.workStart,
                end: day.workStart + block.dur,
            });
            t = day.workStart + block.dur;

            scheduled.push({
                label: "Commute Home",
                type: "travel",
                start: t,
                end: t + day.commuteMins + 15,
                virtual: true,
            });
            t += day.commuteMins + 15;
        } else {
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

    if (sleepDurationMins < 7 * 60) {
        warnings.push(`Sleep deficit! You are getting ${(sleepDurationMins / 60).toFixed(1)}h of sleep, which is under your 7h minimum constraint.`);
    }

    return {
        scheduled,
        sleepTime: t,
        warnings
    };
}