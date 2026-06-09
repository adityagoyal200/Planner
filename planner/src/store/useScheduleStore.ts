import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import type { Block, BlockCategory } from "../types/block";
import type { DayData } from "../types/schedule";
import { type CalendarEvent, updateGoogleEvent } from "../services/googleCalendar";
import { computeSchedule } from "../engine/computeSchedule";
import {
    createMonday,
    createTuesday,
    createWednesday,
    createThursday,
    createFriday,
    createSaturday,
    createSunday,
} from "../data/defaultWeek";

// Generic SaaS defaults
const DEFAULT_CATEGORIES: BlockCategory[] = [
    { id: "routine", name: "Routine", emoji: "⬜", bg: "#0f0f0f" },
    { id: "travel", name: "Travel", emoji: "🛵", bg: "#0b0818" },
    { id: "work", name: "Deep Work", emoji: "💼", bg: "#0d0d0d" },
    { id: "study", name: "Learning", emoji: "💻", bg: "#09061c" },
    { id: "gaming", name: "Gaming", emoji: "🎮", bg: "#0c0200" },
    { id: "health", name: "Exercise", emoji: "🏋", bg: "#070e07" },
    { id: "family", name: "Family", emoji: "📞", bg: "#100800" },
    { id: "hobby", name: "Hobby", emoji: "🎯", bg: "#110004" },
    { id: "sleep", name: "Sleep", emoji: "🛌", bg: "#060611" },
    { id: "free", name: "Free Time", emoji: "☁️", bg: "#080808" }
];

export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export const DAY_KEYS: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

export interface WeekSnapshot {
    id: string;
    weekLabel: string;     
    dateArchived: string;          
    totalSleepHours: number;
    avgSleepHours: number;
    sleepDebtHours: number;
    dayScore: number;         
    categoryBreakdown: Record<string, number>; 
    weekData: Record<DayKey, DayData>;
}

export type AppTab = 'schedule' | 'analytics' | 'journal' | 'settings';

export interface JournalEntry {
    mood: number | null;        // 1-5
    energy: number | null;      // 1-5
    intention: string;
    reflection: string;
    gratitude: string[];
}

const DEFAULT_JOURNAL: JournalEntry = {
    mood: null,
    energy: null,
    intention: "",
    reflection: "",
    gratitude: [],
};

interface ScheduleStore {
    selectedDay: DayKey;
    week: Record<DayKey, DayData>;

    // Navigation
    currentTab: AppTab;

    // Custom block categories
    categories: BlockCategory[];

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

    // Weekly history
    weekHistory: WeekSnapshot[];

    // Gamification
    xp: number;
    earnedBadges: { id: string; unlockedAt: string }[];
    streakFreezes: number;
    streakFreezeUsedThisWeek: boolean;
    gamificationEnabled: boolean;

    // Journal
    journal: Record<DayKey, JournalEntry>;

    // Settings
    pomodoroWork: number;
    pomodoroBreak: number;
    pomodoroLongBreak: number;
    pomodoroSessions: number;
    accentColor: string;
    compactMode: boolean;

    // Actions — Navigation
    setCurrentTab: (tab: AppTab) => void;

    // Actions — Day
    setSelectedDay: (d: DayKey) => void;
    updateWakeTime: (day: DayKey, wakeTime: number) => void;
    updateCommute: (day: DayKey, mins: number) => void;
    updateActualWakeTime: (day: DayKey, time: number | null) => void;
    updateActualSleepTime: (day: DayKey, time: number | null) => void;
    updateActualWakeDate: (day: DayKey, date: string | null) => void;
    updateActualSleepDate: (day: DayKey, date: string | null) => void;

    // Actions — Blocks
    updateBlock: (day: DayKey, blockId: string, updates: Partial<Block>) => void;
    moveBlock: (day: DayKey, blockId: string, direction: "up" | "down") => void;
    reorderBlocks: (day: DayKey, orderedIds: string[]) => void;
    addBlock: (day: DayKey, type?: string, label?: string, dur?: number) => void;
    insertBlock: (day: DayKey, type: string, id: string, orderedIds: string[]) => void;
    removeBlock: (day: DayKey, blockId: string) => void;

    // Actions — Features
    updateQuickNotes: (notes: string) => void;
    updateStreak: (completed: boolean) => void;
    setFocusBlock: (id: string | null) => void;

    // Actions — Gamification
    addXP: (amount: number) => void;
    unlockBadge: (badgeId: string) => void;
    useStreakFreeze: () => void;

    // Actions — Journal
    updateJournal: (day: DayKey, entry: Partial<JournalEntry>) => void;

    // Actions — Settings
    updateSettings: (settings: Partial<Pick<ScheduleStore, 'pomodoroWork' | 'pomodoroBreak' | 'pomodoroLongBreak' | 'pomodoroSessions' | 'accentColor' | 'compactMode' | 'gamificationEnabled'>>) => void;

    // Google Calendar actions
    setGoogleToken: (token: string | null) => void;
    setCalendarEvents: (events: CalendarEvent[]) => void;
    clearGoogle: () => void;
    updateCalendarEventLocal: (eventId: string, updates: Partial<CalendarEvent>) => void;
    syncCalendarEventUpdate: (eventId: string, updates: Partial<CalendarEvent>) => Promise<void>;

    // Category actions
    addCategory: (category: BlockCategory) => void;
    updateCategory: (id: string, updates: Partial<BlockCategory>) => void;
    removeCategory: (id: string) => void;

    // Weekly history
    archiveCurrentWeek: () => void;

    resetStore: () => void;
}

export const useScheduleStore = create<ScheduleStore>()(
    persist(
        (set) => ({
            selectedDay: "mon",
            currentTab: "schedule" as AppTab,
            categories: DEFAULT_CATEGORIES,
            quickNotes: "",
            streak: 0,
            lastCompletedDate: null,
            focusBlockId: null,
            googleToken: null,
            calendarEvents: [],
            weekHistory: [],

            // Gamification defaults
            xp: 0,
            earnedBadges: [],
            streakFreezes: 1,
            streakFreezeUsedThisWeek: false,
            gamificationEnabled: true,

            // Journal defaults
            journal: {
                mon: { ...DEFAULT_JOURNAL },
                tue: { ...DEFAULT_JOURNAL },
                wed: { ...DEFAULT_JOURNAL },
                thu: { ...DEFAULT_JOURNAL },
                fri: { ...DEFAULT_JOURNAL },
                sat: { ...DEFAULT_JOURNAL },
                sun: { ...DEFAULT_JOURNAL },
            },

            // Settings defaults
            pomodoroWork: 25,
            pomodoroBreak: 5,
            pomodoroLongBreak: 15,
            pomodoroSessions: 4,
            accentColor: "indigo",
            compactMode: false,

            week: {
                mon: createMonday(),
                tue: createTuesday(),
                wed: createWednesday(),
                thu: createThursday(),
                fri: createFriday(),
                sat: createSaturday(),
                sun: createSunday(),
            },

            setCurrentTab: (tab) => set({ currentTab: tab }),
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

            updateActualWakeDate: (day, date) =>
                set((state) => ({
                    week: {
                        ...state.week,
                        [day]: { ...state.week[day], actualWakeDate: date },
                    },
                })),

            updateActualSleepDate: (day, date) =>
                set((state) => ({
                    week: {
                        ...state.week,
                        [day]: { ...state.week[day], actualSleepDate: date },
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

            reorderBlocks: (day, orderedIds: string[]) =>
                set((state) => {
                    const currentBlocks = state.week[day].blocks;
                    const blocks = [...currentBlocks].sort((a, b) => {
                        let idxA = orderedIds.indexOf(a.id);
                        let idxB = orderedIds.indexOf(b.id);
                        if (idxA === -1) idxA = Infinity;
                        if (idxB === -1) idxB = Infinity;
                        return idxA - idxB;
                    });
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

            insertBlock: (day, type, id, orderedIds) =>
                set((state) => {
                    const newBlock: Block = {
                        id,
                        type: type as Block["type"],
                        label: `New ${type}`,
                        dur: type === "nap" ? 60 : 30,
                        on: true,
                    };
                    const currentBlocks = [...state.week[day].blocks, newBlock];
                    
                    const blocks = currentBlocks.sort((a, b) => {
                        let idxA = orderedIds.indexOf(a.id);
                        let idxB = orderedIds.indexOf(b.id);
                        if (idxA === -1) idxA = Infinity;
                        if (idxB === -1) idxB = Infinity;
                        return idxA - idxB;
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

            // Gamification actions
            addXP: (amount) => set((state) => ({ xp: state.xp + amount })),
            unlockBadge: (badgeId) => set((state) => {
                if (state.earnedBadges.some(b => b.id === badgeId)) return state;
                return {
                    earnedBadges: [...state.earnedBadges, { id: badgeId, unlockedAt: new Date().toISOString() }]
                };
            }),
            useStreakFreeze: () => set((state) => ({
                streakFreezes: Math.max(0, state.streakFreezes - 1),
                streakFreezeUsedThisWeek: true,
            })),

            // Journal actions
            updateJournal: (day, entry) => set((state) => ({
                journal: {
                    ...state.journal,
                    [day]: { ...(state.journal?.[day] || DEFAULT_JOURNAL), ...entry }
                }
            })),

            // Settings actions
            updateSettings: (settings) => set(settings),

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

            addCategory: (category) =>
                set((state) => ({ categories: [...state.categories, category] })),
            
            updateCategory: (id, updates) =>
                set((state) => ({
                    categories: state.categories.map((c) =>
                        c.id === id ? { ...c, ...updates } : c
                    ),
                })),
                
            removeCategory: (id) =>
                set((state) => ({
                    categories: state.categories.filter((c) => c.id !== id),
                })),

            archiveCurrentWeek: () =>
                set((state) => {
                    let totalSleepMins = 0;
                    let totalDayScore = 0;
                    const categoryBreakdown: Record<string, number> = {};

                    DAY_KEYS.forEach((dk) => {
                        const dayData = state.week[dk];
                        if (!dayData) return;
                        const { sleepTime, totalNapMins, dayScore } = computeSchedule(dayData);
                        totalDayScore += dayScore;

                        const wakeMins = dayData.actualWakeTime ?? dayData.wakeTime;
                        const effSleep = dayData.actualSleepTime ?? sleepTime;
                        let sleepDur = 0;
                        
                        if (dayData.actualSleepTime != null && dayData.actualSleepDate && dayData.actualWakeDate) {
                            const sleepDate = new Date(dayData.actualSleepDate);
                            const wakeDate = new Date(dayData.actualWakeDate);
                            const sleepAbsolute = sleepDate.getTime() / 60000 + (dayData.actualSleepTime % 1440);
                            const wakeAbsolute = wakeDate.getTime() / 60000 + (wakeMins % 1440);
                            sleepDur = Math.abs(wakeAbsolute - sleepAbsolute);
                        } else if (effSleep <= 24 * 60) {
                            sleepDur = (24 * 60 - effSleep) + wakeMins;
                        } else {
                            sleepDur = wakeMins - (effSleep - 24 * 60);
                        }
                        sleepDur += totalNapMins;
                        totalSleepMins += Math.max(0, sleepDur);

                        dayData.blocks.forEach((b) => {
                            if (!b.on) return;
                            categoryBreakdown[b.type] = (categoryBreakdown[b.type] || 0) + b.dur;
                        });
                    });

                    const now = new Date();
                    const mondayOfThisWeek = new Date(now);
                    mondayOfThisWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7));
                    const sundayOfThisWeek = new Date(mondayOfThisWeek);
                    sundayOfThisWeek.setDate(mondayOfThisWeek.getDate() + 6);

                    const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                    const weekLabel = `${fmt(mondayOfThisWeek)} – ${fmt(sundayOfThisWeek)}, ${sundayOfThisWeek.getFullYear()}`;

                    const snapshot: WeekSnapshot = {
                        id: nanoid(),
                        weekLabel,
                        dateArchived: now.toISOString(),
                        totalSleepHours: parseFloat((totalSleepMins / 60).toFixed(1)),
                        avgSleepHours: parseFloat((totalSleepMins / 60 / 7).toFixed(1)),
                        sleepDebtHours: parseFloat((Math.max(0, 7 * 7 - totalSleepMins / 60)).toFixed(1)),
                        dayScore: parseFloat((totalDayScore / 7).toFixed(1)),
                        categoryBreakdown,
                        weekData: JSON.parse(JSON.stringify(state.week)),
                    };

                    return { weekHistory: [...state.weekHistory, snapshot] };
                }),

            resetStore: () => set({
                selectedDay: "mon",
                currentTab: "schedule" as AppTab,
                categories: DEFAULT_CATEGORIES,
                quickNotes: "",
                streak: 0,
                lastCompletedDate: null,
                focusBlockId: null,
                googleToken: null,
                calendarEvents: [],
                weekHistory: [],
                xp: 0,
                earnedBadges: [],
                streakFreezes: 1,
                streakFreezeUsedThisWeek: false,
                gamificationEnabled: true,
                journal: {
                    mon: { ...DEFAULT_JOURNAL },
                    tue: { ...DEFAULT_JOURNAL },
                    wed: { ...DEFAULT_JOURNAL },
                    thu: { ...DEFAULT_JOURNAL },
                    fri: { ...DEFAULT_JOURNAL },
                    sat: { ...DEFAULT_JOURNAL },
                    sun: { ...DEFAULT_JOURNAL },
                },
                pomodoroWork: 25,
                pomodoroBreak: 5,
                pomodoroLongBreak: 15,
                pomodoroSessions: 4,
                accentColor: "indigo",
                compactMode: false,
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
        categories: s.categories,
        quickNotes: s.quickNotes,
        streak: s.streak,
        lastCompletedDate: s.lastCompletedDate,
        selectedDay: s.selectedDay,
        weekHistory: s.weekHistory,
        xp: s.xp,
        earnedBadges: s.earnedBadges,
        streakFreezes: s.streakFreezes,
        streakFreezeUsedThisWeek: s.streakFreezeUsedThisWeek,
        gamificationEnabled: s.gamificationEnabled,
        journal: s.journal,
        pomodoroWork: s.pomodoroWork,
        pomodoroBreak: s.pomodoroBreak,
        pomodoroLongBreak: s.pomodoroLongBreak,
        pomodoroSessions: s.pomodoroSessions,
        accentColor: s.accentColor,
        compactMode: s.compactMode,
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
        categories: cloud.categories && cloud.categories.length > 0 ? cloud.categories : DEFAULT_CATEGORIES,
        quickNotes: cloud.quickNotes ?? "",
        streak: cloud.streak ?? 0,
        lastCompletedDate: cloud.lastCompletedDate ?? null,
        selectedDay: cloud.selectedDay ?? "mon",
        weekHistory: cloud.weekHistory ?? [],
        xp: cloud.xp ?? 0,
        earnedBadges: cloud.earnedBadges ?? [],
        streakFreezes: cloud.streakFreezes ?? 1,
        streakFreezeUsedThisWeek: cloud.streakFreezeUsedThisWeek ?? false,
        gamificationEnabled: cloud.gamificationEnabled ?? true,
        journal: cloud.journal ?? useScheduleStore.getState().journal,
        pomodoroWork: cloud.pomodoroWork ?? 25,
        pomodoroBreak: cloud.pomodoroBreak ?? 5,
        pomodoroLongBreak: cloud.pomodoroLongBreak ?? 15,
        pomodoroSessions: cloud.pomodoroSessions ?? 4,
        accentColor: cloud.accentColor ?? "indigo",
        compactMode: cloud.compactMode ?? false,
    });
    return true;
}

export async function forcePushToCloud() {
    if (!_currentUserId) return;
    await saveCloudState(_currentUserId, getCloudPayload());
}