import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import type { Block } from "../types/block";
import type { DayData } from "../types/schedule";
import {
    createMonday,
    createTuesday,
    createWednesday,
    createThursday,
    createFriday,
    createSaturday,
    createSunday,
} from "../data/defaultWeek";

type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

interface ScheduleStore {
    selectedDay: DayKey;
    week: Record<DayKey, DayData>;
    setSelectedDay: (d: DayKey) => void;
    updateWakeTime: (day: DayKey, wakeTime: number) => void;
    updateCommute: (day: DayKey, mins: number) => void;
    updateBlock: (day: DayKey, blockId: string, updates: Partial<Block>) => void;
    reorderDayBlocks: (day: DayKey, newOrderIds: string[]) => void;
    addBlock: (day: DayKey) => void;
    removeBlock: (day: DayKey, blockId: string) => void;
}

export const useScheduleStore = create<ScheduleStore>()(
    persist(
        (set) => ({
            selectedDay: "mon",

    week: {
        mon: createMonday(),
        tue: createTuesday(),
        wed: createWednesday(),
        thu: createThursday(),
        fri: createFriday(),
        sat: createSaturday(),
        sun: createSunday(),
    },

    setSelectedDay: (d) => set({ selectedDay: d }),

    updateWakeTime: (day, wakeTime) =>
        set((state) => ({
            week: {
                ...state.week,
                [day]: { ...state.week[day], wakeTime },
            },
        })),

    updateCommute: (day, mins) =>
        set((state) => ({
            week: {
                ...state.week,
                [day]: { ...state.week[day], commuteMins: mins },
            },
        })),

    updateBlock: (day, blockId, updates) =>
        set((state) => ({
            week: {
                ...state.week,
                [day]: {
                    ...state.week[day],
                    blocks: state.week[day].blocks.map((b) =>
                        b.id === blockId ? { ...b, ...updates } : b
                    ),
                },
            },
        })),

    reorderDayBlocks: (day, newOrderIds) =>
        set((state) => {
            const currentBlocks = [...state.week[day].blocks];
            currentBlocks.sort((a, b) => {
                const indexA = newOrderIds.indexOf(a.id);
                const indexB = newOrderIds.indexOf(b.id);
                if (indexA === -1 || indexB === -1) return 0;
                return indexA - indexB;
            });
            return {
                week: {
                    ...state.week,
                    [day]: {
                        ...state.week[day],
                        blocks: currentBlocks,
                    },
                },
            };
        }),

    addBlock: (day) =>
        set((state) => ({
            week: {
                ...state.week,
                [day]: {
                    ...state.week[day],
                    blocks: [
                        ...state.week[day].blocks,
                        {
                            id: nanoid(),
                            type: "routine",
                            label: "New Block",
                            dur: 30,
                            on: true,
                        },
                    ],
                },
            },
        })),

    removeBlock: (day, blockId) =>
        set((state) => ({
            week: {
                ...state.week,
                [day]: {
                    ...state.week[day],
                    blocks: state.week[day].blocks.filter((b) => b.id !== blockId),
                },
            },
        })),
        }),
        {
            name: "planner-storage",
        }
    )
);