import type { Block } from "./block";

export interface DayData {
    wakeTime: number;       // Planned wake time (minutes from midnight)
    workStart: number;
    sleepTarget: number;    // Target sleep hours in minutes (e.g., 420 = 7h)
    commuteMins: number;
    blocks: Block[];

    // Actual tracking — what really happened
    actualWakeTime: number | null;   // null = not yet logged
    actualSleepTime: number | null;  // null = not yet logged (minutes from midnight, can exceed 1440 for next-day)
    actualWakeDate?: string | null;  // ISO date string e.g. "2026-06-09"
    actualSleepDate?: string | null; // ISO date string e.g. "2026-06-10"
}