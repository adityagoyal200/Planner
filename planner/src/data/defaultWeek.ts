import { nanoid } from "nanoid";
import type { Block, BlockType } from "../types/block";
import type { DayData } from "../types/schedule";

const b = (type: BlockType, label: string, dur: number, locked = false): Block => ({
    id: nanoid(),
    type,
    label,
    dur,
    on: true,
    locked,
});

const baseDay = (): DayData => ({
    wakeTime: 420, // 7:00 AM
    workStart: 540, // 9:00 AM
    sleepTarget: 480, // 8 hours
    commuteMins: 30,
    blocks: [],
    actualWakeTime: null,
    actualSleepTime: null,
});

// Weekday template
const weekdayBlocks = (): Block[] => [
    b("routine", "Morning Routine", 30),
    b("health", "Exercise", 45),
    b("routine", "Breakfast", 20),
    b("travel", "Commute", 30),
    b("work", "Deep Work", 180, true),
    b("routine", "Lunch Break", 45),
    b("work", "Afternoon Work", 180, true),
    b("travel", "Commute Home", 30),
    b("study", "Learning / Side Projects", 60),
    b("routine", "Dinner", 30),
    b("free", "Wind Down", 60),
];

export const createMonday = (): DayData => {
    const day = baseDay();
    day.blocks = weekdayBlocks();
    return day;
};

export const createTuesday = (): DayData => {
    const day = baseDay();
    day.blocks = weekdayBlocks();
    return day;
};

export const createWednesday = (): DayData => {
    const day = baseDay();
    day.blocks = weekdayBlocks();
    return day;
};

export const createThursday = (): DayData => {
    const day = baseDay();
    day.blocks = weekdayBlocks();
    return day;
};

export const createFriday = (): DayData => {
    const day = baseDay();
    day.blocks = weekdayBlocks();
    return day;
};

export const createSaturday = (): DayData => {
    const day = baseDay();
    day.wakeTime = 480; // 8:00 AM
    day.workStart = 0;
    day.blocks = [
        b("routine", "Morning Routine", 30),
        b("health", "Exercise", 60),
        b("routine", "Breakfast", 20),
        b("hobby", "Hobby / Creative Time", 120),
        b("routine", "Lunch", 30),
        b("family", "Family & Friends", 120),
        b("gaming", "Gaming / Entertainment", 120),
        b("routine", "Dinner", 30),
        b("free", "Relax", 90),
    ];
    return day;
};

export const createSunday = (): DayData => {
    const day = baseDay();
    day.wakeTime = 480; // 8:00 AM
    day.workStart = 0;
    day.blocks = [
        b("routine", "Morning Routine", 40),
        b("routine", "Brunch", 30),
        b("study", "Learning / Reading", 90),
        b("routine", "Lunch", 30),
        b("free", "Free Time", 120),
        b("hobby", "Hobby / Creative Time", 90),
        b("routine", "Dinner", 30),
        b("free", "Wind Down & Plan Week", 60),
    ];
    return day;
};