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

export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

interface ScheduleStore {
    selectedDay: DayKey;
    week: Record<DayKey, DayData>;

    // Quick notes (persisted)
    quickNotes: string;

    // Streak tracking
    streak: number;
    lastCompletedDate: string | null;

    // Focus timer
    focusBlockId: string | null;

    // Actions — Day
    setSelectedDay: (d: DayKey) => void;
    updateWakeTime: (day: DayKey, wakeTime: number) => void;
    updateCommute: (day: DayKey, mins: number) => void;
    updateActualWakeTime: (day: DayKey, time: number | null) => void;
    updateActualSleepTime: (day: DayKey, time: number | null) => void;

    // Actions — Blocks
    updateBlock: (day: DayKey, blockId: string, updates: Partial<Block>) => void;
    moveBlock: (day: DayKey, blockId: string, direction: "up" | "down") => void;
    addBlock: (day: DayKey, type?: string, label?: string, dur?: number) => void;
    removeBlock: (day: DayKey, blockId: string) => void;

    // Actions — Features
    updateQuickNotes: (notes: string) => void;
    updateStreak: (completed: boolean) => void;
    setFocusBlock: (id: string | null) => void;
}

export const useScheduleStore = create<ScheduleStore>()(
    persist(
        (set) => ({
            selectedDay: "mon",
            quickNotes: "",
            streak: 0,
            lastCompletedDate: null,
            focusBlockId: null,

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

            updateActualWakeTime: (day, time) =>
                set((state) => ({
                    week: {
                        ...state.week,
                        [day]: { ...state.week[day], actualWakeTime: time },
                    },
                })),

            updateActualSleepTime: (day, time) =>
                set((state) => ({
                    week: {
                        ...state.week,
                        [day]: { ...state.week[day], actualSleepTime: time },
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

            moveBlock: (day, blockId, direction) =>
                set((state) => {
                    const blocks = [...state.week[day].blocks];
                    const idx = blocks.findIndex((b) => b.id === blockId);
                    if (idx === -1) return state;

                    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
                    if (targetIdx < 0 || targetIdx >= blocks.length) return state;

                    // Swap
                    [blocks[idx], blocks[targetIdx]] = [blocks[targetIdx], blocks[idx]];

                    return {
                        week: {
                            ...state.week,
                            [day]: { ...state.week[day], blocks },
                        },
                    };
                }),

            addBlock: (day, type = "routine", label = "New Block", dur = 30) =>
                set((state) => ({
                    week: {
                        ...state.week,
                        [day]: {
                            ...state.week[day],
                            blocks: [
                                ...state.week[day].blocks,
                                {
                                    id: nanoid(),
                                    type: type as Block["type"],
                                    label,
                                    dur,
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

            updateQuickNotes: (notes) => set({ quickNotes: notes }),

            updateStreak: (completed) =>
                set((state) => {
                    const today = new Date().toISOString().split("T")[0];
                    if (!completed) return state;

                    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
                    const isConsecutive = state.lastCompletedDate === yesterday || state.lastCompletedDate === today;

                    return {
                        streak: state.lastCompletedDate === today
                            ? state.streak
                            : isConsecutive
                                ? state.streak + 1
                                : 1,
                        lastCompletedDate: today,
                    };
                }),

            setFocusBlock: (id) => set({ focusBlockId: id }),
        }),
        {
            name: "planner-storage",
        }
    )
);