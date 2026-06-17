import type { DayData } from "../types/schedule";

/**
 * Generic empty-day templates for new users.
 * New accounts start with no blocks — users build their own schedule.
 */

const baseWeekday = (): DayData => ({
    wakeTime: 420,      // 7:00 AM
    workStart: 540,     // 9:00 AM
    sleepTarget: 420,   // 7 hours
    commuteMins: 30,
    blocks: [],
    actualWakeTime: null,
    actualSleepTime: null,
});

const baseWeekend = (): DayData => ({
    wakeTime: 480,      // 8:00 AM
    workStart: 0,       // No work
    sleepTarget: 480,   // 8 hours
    commuteMins: 0,
    blocks: [],
    actualWakeTime: null,
    actualSleepTime: null,
});

export const createMonday    = (): DayData => baseWeekday();
export const createTuesday   = (): DayData => baseWeekday();
export const createWednesday = (): DayData => baseWeekday();
export const createThursday  = (): DayData => baseWeekday();
export const createFriday    = (): DayData => baseWeekday();
export const createSaturday  = (): DayData => baseWeekend();
export const createSunday    = (): DayData => baseWeekend();