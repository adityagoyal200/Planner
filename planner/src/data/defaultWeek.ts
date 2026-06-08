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

const cookBatch = () => b("routine", "Batch Cook (2 days)", 55);
const heatLeftovers = () => b("routine", "Heat Leftovers", 20);

// Pool is 6km away, 15-20 min by bike. Departure fixed w/ buffer.
const swimSequence = () => [
    b("routine", "Quick Change", 5),
    b("travel", "Bike to Pool", 20),
    b("health", "Swimming", 60),
    b("travel", "Bike Home", 20),
    b("routine", "Full Shower + Routine", 40),
];

const gymSequence = () => [
    b("health", "Gym Session", 60),
    b("routine", "Post-Gym Shower", 15),
];

const workBlock = () => b("work", "MTS Work", 450, true); // 10 AM to 5:30 PM
const dsaBlock = () => b("study", "DSA & System Design", 60);
const northBlock = () => b("work", "North Brand", 90);
const aimBlock = () => b("gaming", "10 DM Aim Routine", 80);
const valBlock = () => b("gaming", "Valorant (UK Servers)", 120);

const baseDay = (): DayData => ({
    wakeTime: 335, // 5:35 AM wake (5 mins before 5:40 AM departure)
    workStart: 600, // 10:00 AM
    sleepTarget: 420, // 7 hours
    commuteMins: 30,
    blocks: [],
    actualWakeTime: null,
    actualSleepTime: null,
});

export const createMonday = (): DayData => {
    const day = baseDay();
    day.blocks = [
        ...swimSequence(),
        dsaBlock(),
        workBlock(),
        ...gymSequence(),
        heatLeftovers(),
        northBlock(),
        aimBlock(),
        valBlock()
    ];
    return day;
};

export const createTuesday = (): DayData => {
    const day = baseDay();
    day.blocks = [
        ...swimSequence(),
        dsaBlock(),
        workBlock(),
        ...gymSequence(),
        heatLeftovers(),
        northBlock(),
        aimBlock(),
        valBlock()
    ];
    return day;
};

export const createWednesday = (): DayData => {
    const day = baseDay();
    day.blocks = [
        ...swimSequence(),
        dsaBlock(),
        workBlock(),
        ...gymSequence(),
        cookBatch(),
        northBlock(),
        aimBlock(),
        valBlock()
    ];
    return day;
};

export const createThursday = (): DayData => {
    const day = baseDay();
    day.blocks = [
        ...swimSequence(),
        dsaBlock(),
        workBlock(),
        ...gymSequence(),
        heatLeftovers(),
        northBlock(),
        aimBlock(),
        valBlock()
    ];
    return day;
};

export const createFriday = (): DayData => {
    const day = baseDay();
    day.blocks = [
        ...swimSequence(),
        dsaBlock(),
        workBlock(),
        ...gymSequence(),
        cookBatch(),
        northBlock(),
        aimBlock(),
        valBlock()
    ];
    return day;
};

export const createSaturday = (): DayData => {
    const day = baseDay();
    day.wakeTime = 420; // 7:00 AM wake
    day.workStart = 0; // Off work
    day.blocks = [
        ...swimSequence(),
        b("family", "Family Call", 60),
        dsaBlock(),
        ...gymSequence(),
        heatLeftovers(),
        northBlock(),
        aimBlock(),
        valBlock()
    ];
    return day;
};

export const createSunday = (): DayData => {
    const day = baseDay();
    day.wakeTime = 480; // 8:00 AM wake
    day.workStart = 0; // Off work
    day.blocks = [
        b("routine", "Morning Routine", 40),
        dsaBlock(),
        cookBatch(),
        northBlock(),
        aimBlock(),
        valBlock()
    ];
    return day;
};