import type { DayData } from "../types/schedule";
import type { DayKey } from "../store/useScheduleStore";
import { computeSchedule } from "./computeSchedule";
import { getDateForDayKey } from "../utils/dateUtils";

export const XP_ACTIONS = {
    BLOCK_COMPLETE: 10,
    SLEEP_TARGET_HIT: 25,
    PERFECT_DAY: 50,
    STREAK_DAILY: 5,       // multiplied by streak length
    ARCHIVE_WEEK: 100,
    LOG_REALITY: 15,
} as const;

export const LEVELS = [
    { level: 1, title: "Beginner", minXP: 0 },
    { level: 2, title: "Beginner", minXP: 100 },
    { level: 3, title: "Beginner", minXP: 200 },
    { level: 4, title: "Beginner", minXP: 350 },
    { level: 5, title: "Beginner", minXP: 500 },
    { level: 6, title: "Builder", minXP: 700 },
    { level: 7, title: "Builder", minXP: 1000 },
    { level: 8, title: "Builder", minXP: 1300 },
    { level: 9, title: "Builder", minXP: 1600 },
    { level: 10, title: "Builder", minXP: 2000 },
    { level: 11, title: "Grind Master", minXP: 2500 },
    { level: 12, title: "Grind Master", minXP: 3000 },
    { level: 13, title: "Grind Master", minXP: 3600 },
    { level: 14, title: "Grind Master", minXP: 4200 },
    { level: 15, title: "Grind Master", minXP: 5000 },
    { level: 16, title: "Flow State", minXP: 6000 },
    { level: 17, title: "Flow State", minXP: 7000 },
    { level: 18, title: "Flow State", minXP: 8000 },
    { level: 19, title: "Flow State", minXP: 9000 },
    { level: 20, title: "Flow State", minXP: 10000 },
    { level: 21, title: "Time Lord", minXP: 12000 },
    { level: 22, title: "Time Lord", minXP: 14000 },
    { level: 23, title: "Time Lord", minXP: 16000 },
    { level: 24, title: "Time Lord", minXP: 18000 },
    { level: 25, title: "Time Lord", minXP: 20000 },
    { level: 26, title: "Legend", minXP: 25000 },
    { level: 27, title: "Legend", minXP: 30000 },
    { level: 28, title: "Legend", minXP: 40000 },
    { level: 29, title: "Legend", minXP: 50000 },
    { level: 30, title: "Legend", minXP: 75000 },
];

export function getLevelInfo(xp: number) {
    let current = LEVELS[0];
    let next = LEVELS[1];

    for (let i = LEVELS.length - 1; i >= 0; i--) {
        if (xp >= LEVELS[i].minXP) {
            current = LEVELS[i];
            next = LEVELS[i + 1] || { ...LEVELS[i], minXP: LEVELS[i].minXP + 10000 };
            break;
        }
    }

    const xpInLevel = xp - current.minXP;
    const xpForNextLevel = next.minXP - current.minXP;
    const progress = xpForNextLevel > 0 ? xpInLevel / xpForNextLevel : 1;

    return {
        level: current.level,
        title: current.title,
        xpInLevel,
        xpForNextLevel,
        progress: Math.min(1, progress),
        totalXP: xp,
    };
}

/** Compute how much XP a day earned */
export function computeDayXP(
    day: DayData,
    dayKey: DayKey,
    streak: number
): number {
    let xp = 0;
    const refDate = getDateForDayKey(dayKey);
    const { sleepTime, totalNapMins } = computeSchedule(day, [], { referenceDate: refDate });

    // XP for each enabled block
    const onBlocks = day.blocks.filter(b => b.on).length;
    xp += onBlocks * XP_ACTIONS.BLOCK_COMPLETE;

    // Perfect day bonus
    const totalBlocks = day.blocks.length;
    if (totalBlocks > 0 && onBlocks === totalBlocks) {
        xp += XP_ACTIONS.PERFECT_DAY;
    }

    // Sleep target hit
    const wakeMins = day.actualWakeTime ?? day.wakeTime;
    const effectiveSleep = day.actualSleepTime ?? sleepTime;
    let sleepDur = 0;
    if (day.actualSleepTime != null && day.actualSleepDate && day.actualWakeDate) {
        const sd = new Date(day.actualSleepDate).getTime() / 60000 + (day.actualSleepTime % 1440);
        const wd = new Date(day.actualWakeDate).getTime() / 60000 + (wakeMins % 1440);
        let diff = wd - sd;
        if (diff < 0) diff += 1440;
        if (diff > 1440) diff -= 1440;
        sleepDur = diff;
    } else if (effectiveSleep <= 1440) {
        sleepDur = (1440 - effectiveSleep) + wakeMins;
    } else {
        sleepDur = wakeMins - (effectiveSleep - 1440);
    }
    sleepDur += totalNapMins;

    if (sleepDur >= day.sleepTarget) {
        xp += XP_ACTIONS.SLEEP_TARGET_HIT;
    }

    // Reality logging bonus
    if (day.actualWakeTime !== null || day.actualSleepTime !== null) {
        xp += XP_ACTIONS.LOG_REALITY;
    }

    // Streak bonus
    if (streak > 0) {
        xp += Math.min(streak, 30) * XP_ACTIONS.STREAK_DAILY;
    }

    return xp;
}

export function computeWeekXP(
    week: Record<DayKey, DayData>,
    streak: number
): number {
    const days: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
    let total = 0;
    for (const dk of days) {
        total += computeDayXP(week[dk], dk, streak);
    }
    return total;
}
