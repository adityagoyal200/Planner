import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import type { Block } from "../types/block";
import type { DayData } from "../types/schedule";
import { type CalendarEvent, updateGoogleEvent } from "../services/googleCalendar";
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

    // Google Calendar
    googleToken: string | null;
    calendarEvents: CalendarEvent[];

    // Actions — Day
    setSelectedDay: (d: DayKey) => void;
    updateWakeTime: (day: DayKey, wakeTime: number) => void;
    updateCommute: (day: DayKey, mins: number) => void;
    updateActualWakeTime: (day: DayKey, time: number | null) => void;
    updateActualSleepTime: (day: DayKey, time: number | null) => void;

    // Actions — Blocks
    updateBlock: (day: DayKey, blockId: string, updates: Partial<Block>) => void;
    moveBlock: (day: DayKey, blockId: string, direction: "up" | "down") => void;
    reorderBlocks: (day: DayKey, startIndex: number, endIndex: number) => void;
    addBlock: (day: DayKey, type?: string, label?: string, dur?: number) => void;
    insertBlock: (day: DayKey, type: string, index: number) => void;
    removeBlock: (day: DayKey, blockId: string) => void;

    // Actions — Features
    updateQuickNotes: (notes: string) => void;
    updateStreak: (completed: boolean) => void;
    setFocusBlock: (id: string | null) => void;

    // Google Calendar actions
    setGoogleToken: (token: string | null) => void;
    setCalendarEvents: (events: CalendarEvent[]) => void;
    clearGoogle: () => void;
    updateCalendarEventLocal: (eventId: string, updates: Partial<CalendarEvent>) => void;
    syncCalendarEventUpdate: (eventId: string, updates: Partial<CalendarEvent>) => Promise<void>;

    resetStore: () => void;
}

export const useScheduleStore = create<ScheduleStore>()(
    persist(
        (set) => ({
            selectedDay: "mon",
            quickNotes: "",
            streak: 0,
            lastCompletedDate: null,
            focusBlockId: null,
            googleToken: null,
            calendarEvents: [],

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

            reorderBlocks: (day, startIndex, endIndex) =>
                set((state) => {
                    const blocks = Array.from(state.week[day].blocks);
                    const [removed] = blocks.splice(startIndex, 1);
                    blocks.splice(endIndex, 0, removed);
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

            insertBlock: (day, type, index) =>
                set((state) => {
                    const blocks = Array.from(state.week[day].blocks);
                    blocks.splice(index, 0, {
                        id: nanoid(),
                        type: type as Block["type"],
                        label: `New ${type}`,
                        dur: type === "nap" ? 60 : 30,
                        on: true,
                    });
                    return {
                        week: {
                            ...state.week,
                            [day]: { ...state.week[day], blocks },
                        },
                    };
                }),

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

            setGoogleToken: (token) => set({ googleToken: token }),
            setCalendarEvents: (events) => set({ calendarEvents: events }),
            clearGoogle: () => set({ googleToken: null, calendarEvents: [] }),

            updateCalendarEventLocal: (eventId, updates) =>
                set((state) => ({
                    calendarEvents: state.calendarEvents.map((ev) =>
                        ev.id === eventId ? { ...ev, ...updates } : ev
                    ),
                })),

            syncCalendarEventUpdate: async (eventId, updates) => {
                useScheduleStore.getState().updateCalendarEventLocal(eventId, updates);

                const token = useScheduleStore.getState().googleToken;
                if (!token) return;

                const ev = useScheduleStore.getState().calendarEvents.find(e => e.id === eventId);
                if (!ev || !ev.originalStart || !ev.originalEnd) return;

                try {
                    const apiUpdates: any = {};
                    if (updates.startMins !== undefined) {
                        const d = new Date(ev.originalStart);
                        d.setHours(Math.floor(updates.startMins / 60), updates.startMins % 60, 0, 0);
                        apiUpdates.start = d.toISOString();
                    }
                    if (updates.endMins !== undefined) {
                        const d = new Date(ev.originalEnd);
                        d.setHours(Math.floor(updates.endMins / 60), updates.endMins % 60, 0, 0);
                        apiUpdates.end = d.toISOString();
                    }
                    if (updates.title !== undefined) {
                        apiUpdates.summary = updates.title;
                    }

                    await updateGoogleEvent(token, eventId, apiUpdates);
                    
                    // We could refetch today's events here to be perfectly in sync,
                    // but the optimistic update is usually enough.
                } catch (err) {
                    console.error("Failed to sync event update", err);
                    // Could revert optimistic update here if desired
                }
            },

            resetStore: () => set({
                selectedDay: "mon",
                quickNotes: "",
                streak: 0,
                lastCompletedDate: null,
                focusBlockId: null,
                googleToken: null,
                calendarEvents: [],
                week: {
                    mon: createMonday(),
                    tue: createTuesday(),
                    wed: createWednesday(),
                    thu: createThursday(),
                    fri: createFriday(),
                    sat: createSaturday(),
                    sun: createSunday(),
                },
            }),
        }),
        {
            name: "planner-storage",
        }
    )
);

import { saveCloudState, fetchCloudState } from "../services/supabase";

let syncTimer: ReturnType<typeof setTimeout> | null = null;
let _currentUserId: string | null = null;

export function setCloudUserId(userId: string | null) {
    _currentUserId = userId;
}

function getCloudPayload() {
    const s = useScheduleStore.getState();
    return {
        week: s.week,
        quickNotes: s.quickNotes,
        streak: s.streak,
        lastCompletedDate: s.lastCompletedDate,
        selectedDay: s.selectedDay,
    };
}

useScheduleStore.subscribe(() => {
    if (!_currentUserId) return;
    if (syncTimer) clearTimeout(syncTimer);
    const uid = _currentUserId;
    syncTimer = setTimeout(() => {
        saveCloudState(uid, getCloudPayload());
    }, 2000);
});

export async function hydrateFromCloud(userId: string) {
    const cloud = await fetchCloudState(userId);
    if (!cloud || !cloud.week) {
        // If there's no cloud state, it's a new user!
        // We MUST wipe the in-memory state so they don't see the previous user's local data.
        useScheduleStore.getState().resetStore();
        return false;
    }

    useScheduleStore.setState({
        week: cloud.week,
        quickNotes: cloud.quickNotes ?? "",
        streak: cloud.streak ?? 0,
        lastCompletedDate: cloud.lastCompletedDate ?? null,
        selectedDay: cloud.selectedDay ?? "mon",
    });
    return true;
}

export async function forcePushToCloud() {
    if (!_currentUserId) return;
    await saveCloudState(_currentUserId, getCloudPayload());
}