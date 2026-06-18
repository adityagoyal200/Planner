import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import type { Block, BlockCategory } from "../types/block";
import type { DayData } from "../types/schedule";
import { type CalendarEvent, type GoogleEventUpdate, updateGoogleEventAuthenticated } from "../services/googleCalendar";
import { getLevelInfo } from "../engine/xpEngine";
import { addDaysToISODate, toLocalISODate, getMondayOfWeek, addWeeksToMondayKey, getWeekLabel } from "../utils/dateUtils";
import { computeWeekAggregate } from "../services/weekLifecycleService";
import type { DurationDisplayUnit } from "../utils/durationUtils";
import { toast } from "react-hot-toast";
import {
    createMonday,
    createTuesday,
    createWednesday,
    createThursday,
    createFriday,
    createSaturday,
    createSunday,
} from "../data/defaultWeek";
import {
    applyCommuteMinsToDay,
    applyWorkStartToDay,
    isCommuteBlockId,
    migrateWeekCommuteBlocks,
    mirrorCommuteDuration,
    syncDayMetaFromBlocks,
} from "../utils/commuteBlocks";

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
    weekKey: string;               // Monday ISO date key
    weekLabel: string;     
    dateArchived: string;          
    totalSleepHours: number;
    avgSleepHours: number;
    sleepDebtHours: number;
    dayScore: number;         
    categoryBreakdown: Record<string, number>; 
    weekData: Record<DayKey, DayData>;
    completedBlocks: number;
    totalBlocks: number;
    xpEarned: number;
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

function createEmptyJournalWeek(): Record<DayKey, JournalEntry> {
    return {
        mon: { ...DEFAULT_JOURNAL },
        tue: { ...DEFAULT_JOURNAL },
        wed: { ...DEFAULT_JOURNAL },
        thu: { ...DEFAULT_JOURNAL },
        fri: { ...DEFAULT_JOURNAL },
        sat: { ...DEFAULT_JOURNAL },
        sun: { ...DEFAULT_JOURNAL },
    };
}

interface ScheduleStore {
    selectedDay: DayKey;
    week: Record<DayKey, DayData>;

    // Multi-week storage
    weeks: Record<string, Record<DayKey, DayData>>;  // key = Monday ISO date
    currentWeekKey: string;        // The real calendar Monday
    browsingWeekKey: string | null; // null = viewing live current week
    newWeekArchived: WeekSnapshot | null; // Auto-archive result shown as banner

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
    googleCalendarLinked: boolean;
    calendarEvents: CalendarEvent[];

    // Weekly history
    weekHistory: WeekSnapshot[];

    // Gamification
    xp: number;
    earnedBadges: { id: string; unlockedAt: string }[];
    streakFreezes: number;
    streakFreezeUsedThisWeek: boolean;
    gamificationEnabled: boolean;
    levelUpModal: { level: number; title: string } | null;

    // Journal
    journalsByWeek: Record<string, Record<DayKey, JournalEntry>>;

    // Settings
    pomodoroWork: number;
    pomodoroBreak: number;
    pomodoroLongBreak: number;
    pomodoroSessions: number;
    accentColor: string;
    compactMode: boolean;
    durationDisplayUnit: DurationDisplayUnit;

    // Actions — Navigation
    setCurrentTab: (tab: AppTab) => void;

    // Actions — Day
    setSelectedDay: (d: DayKey) => void;
    updateWakeTime: (day: DayKey, wakeTime: number) => void;
    updateCommute: (day: DayKey, mins: number) => void;
    updateWorkStart: (day: DayKey, workStart: number) => void;
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
    setLevelUpModal: (modal: { level: number; title: string } | null) => void;

    // Actions — Journal
    updateJournal: (day: DayKey, entry: Partial<JournalEntry>) => void;

    // Actions — Settings
    updateSettings: (settings: Partial<Pick<ScheduleStore, 'pomodoroWork' | 'pomodoroBreak' | 'pomodoroLongBreak' | 'pomodoroSessions' | 'accentColor' | 'compactMode' | 'gamificationEnabled' | 'durationDisplayUnit'>>) => void;

    // Google Calendar actions
    setGoogleToken: (token: string | null) => void;
    setGoogleCalendarLinked: (linked: boolean) => void;
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

    // Week navigation
    navigateWeek: (direction: 'prev' | 'next') => void;
    jumpToCurrentWeek: () => void;
    viewWeekByKey: (weekKey: string) => void;
    startNewWeek: () => void;
    dismissNewWeekBanner: () => void;

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
            googleCalendarLinked: false,
            calendarEvents: [],
            weekHistory: [],

            // Multi-week defaults
            weeks: {},
            currentWeekKey: getMondayOfWeek(),
            browsingWeekKey: null,
            newWeekArchived: null,

            // Gamification defaults
            xp: 0,
            earnedBadges: [],
            streakFreezes: 1,
            streakFreezeUsedThisWeek: false,
            gamificationEnabled: true,
            levelUpModal: null,

            // Journal defaults
            journalsByWeek: {
                [getMondayOfWeek()]: createEmptyJournalWeek(),
            },

            // Settings defaults
            pomodoroWork: 25,
            pomodoroBreak: 5,
            pomodoroLongBreak: 15,
            pomodoroSessions: 4,
            accentColor: "indigo",
            compactMode: false,
            durationDisplayUnit: "minutes",

            week: migrateWeekCommuteBlocks({
                mon: createMonday(),
                tue: createTuesday(),
                wed: createWednesday(),
                thu: createThursday(),
                fri: createFriday(),
                sat: createSaturday(),
                sun: createSunday(),
            }),

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
                        [day]: applyCommuteMinsToDay(state.week[day], mins),
                    },
                })),

            updateWorkStart: (day, workStart) =>
                set((state) => ({
                    week: {
                        ...state.week,
                        [day]: applyWorkStartToDay(state.week[day], workStart),
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
                set((state) => {
                    let blocks = state.week[day].blocks.map((b) =>
                        b.id === blockId ? { ...b, ...updates } : b
                    );
                    if (updates.dur != null && isCommuteBlockId(blockId)) {
                        blocks = mirrorCommuteDuration(blocks, blockId, updates.dur);
                    }
                    const dayData = syncDayMetaFromBlocks({
                        ...state.week[day],
                        blocks,
                    });
                    return {
                        week: {
                            ...state.week,
                            [day]: dayData,
                        },
                    };
                }),

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
                set((state) => {
                    const dayData = syncDayMetaFromBlocks({
                        ...state.week[day],
                        blocks: state.week[day].blocks.filter((b) => b.id !== blockId),
                    });
                    return {
                        week: {
                            ...state.week,
                            [day]: dayData,
                        },
                    };
                }),

            updateQuickNotes: (notes) => set({ quickNotes: notes }),

            updateStreak: (completed) =>
                set((state) => {
                    const today = toLocalISODate();
                    if (!completed) return state;

                    const yesterday = addDaysToISODate(today, -1);
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
            addXP: (amount) => set((state) => {
                if (!state.gamificationEnabled) return { xp: Math.max(0, state.xp + amount) };

                const oldLevelInfo = getLevelInfo(state.xp);
                const newXp = Math.max(0, state.xp + amount);
                const newLevelInfo = getLevelInfo(newXp);
                
                const leveledUp = newLevelInfo.level > oldLevelInfo.level;
                
                if (amount > 0) {
                    toast.success(`+${amount} XP!`, {
                        icon: "✨",
                        style: {
                            background: "#0f0f15",
                            color: "#fff",
                            border: "1px solid rgba(255, 255, 255, 0.05)",
                            borderRadius: "16px",
                            fontFamily: "inherit",
                        }
                    });
                }
                
                return {
                    xp: newXp,
                    levelUpModal: leveledUp ? { level: newLevelInfo.level, title: newLevelInfo.title } : state.levelUpModal
                };
            }),
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
            setLevelUpModal: (modal) => set({ levelUpModal: modal }),

            // Journal actions
            updateJournal: (day, entry) => set((state) => {
                const viewedWeekKey = state.browsingWeekKey || state.currentWeekKey;
                const currentJournalWeek = state.journalsByWeek[viewedWeekKey] || createEmptyJournalWeek();
                return {
                    journalsByWeek: {
                        ...state.journalsByWeek,
                        [viewedWeekKey]: {
                            ...currentJournalWeek,
                            [day]: { ...(currentJournalWeek[day] || DEFAULT_JOURNAL), ...entry },
                        },
                    },
                };
            }),

            // Settings actions
            updateSettings: (settings) => set(settings),

            setGoogleToken: (token) => set({ googleToken: token }),
            setGoogleCalendarLinked: (linked) => set({ googleCalendarLinked: linked }),
            setCalendarEvents: (events) => set({ calendarEvents: events }),
            clearGoogle: () => set({ googleCalendarLinked: false, googleToken: null, calendarEvents: [] }),

            updateCalendarEventLocal: (eventId, updates) =>
                set((state) => ({
                    calendarEvents: state.calendarEvents.map((ev) =>
                        ev.id === eventId ? { ...ev, ...updates } : ev
                    ),
                })),

            syncCalendarEventUpdate: async (eventId, updates) => {
                useScheduleStore.getState().updateCalendarEventLocal(eventId, updates);

                if (!useScheduleStore.getState().googleCalendarLinked) return;

                const ev = useScheduleStore.getState().calendarEvents.find(e => e.id === eventId);
                if (!ev || !ev.originalStart || !ev.originalEnd) return;

                try {
                    const apiUpdates: GoogleEventUpdate = {};
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

                    await updateGoogleEventAuthenticated(eventId, apiUpdates);
                } catch (err) {
                    console.error("Failed to sync event update", err);
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
                    const currentWeekData = state.weeks[state.currentWeekKey] || state.week;
                    const { totalSleepMins, totalDayScore, completedBlocks, totalBlocks, categoryBreakdown } = computeWeekAggregate(currentWeekData);

                    const weekKey = state.currentWeekKey;
                    const weekLabel = getWeekLabel(weekKey);

                    const snapshot: WeekSnapshot = {
                        id: nanoid(),
                        weekKey,
                        weekLabel,
                        dateArchived: new Date().toISOString(),
                        totalSleepHours: parseFloat((totalSleepMins / 60).toFixed(1)),
                        avgSleepHours: parseFloat((totalSleepMins / 60 / 7).toFixed(1)),
                        sleepDebtHours: parseFloat((Math.max(0, 7 * 7 - totalSleepMins / 60)).toFixed(1)),
                        dayScore: parseFloat((totalDayScore / 7).toFixed(1)),
                        categoryBreakdown,
                        weekData: JSON.parse(JSON.stringify(currentWeekData)),
                        completedBlocks,
                        totalBlocks,
                        xpEarned: completedBlocks * 10,
                    };

                    // Also save into the weeks map
                    const updatedWeeks = {
                        ...state.weeks,
                        [weekKey]: JSON.parse(JSON.stringify(currentWeekData)),
                    };

                    // Check for duplicate archive
                    const alreadyArchived = state.weekHistory.some(s => s.weekKey === weekKey);
                    if (alreadyArchived) {
                        return { weeks: updatedWeeks };
                    }

                    return { weekHistory: [...state.weekHistory, snapshot], weeks: updatedWeeks };
                }),

            // Week Navigation
            navigateWeek: (direction) =>
                set((state) => {
                    const currentBrowsing = state.browsingWeekKey || state.currentWeekKey;
                    const newKey = addWeeksToMondayKey(currentBrowsing, direction === 'next' ? 1 : -1);
                    
                    // Don't go into the future beyond current week
                    if (newKey > state.currentWeekKey) {
                        return { browsingWeekKey: null, week: state.weeks[state.currentWeekKey] || state.week };
                    }

                    // Save current view before switching
                    const saveKey = state.browsingWeekKey || state.currentWeekKey;
                    const updatedWeeks = {
                        ...state.weeks,
                        [saveKey]: JSON.parse(JSON.stringify(state.week)),
                    };

                    // Also persist the journal for the viewed week key (so week switches never lose journal edits)
                    const viewedJournalKey = saveKey;
                    const updatedJournalsByWeek = {
                        ...state.journalsByWeek,
                        [viewedJournalKey]: state.journalsByWeek[viewedJournalKey] || createEmptyJournalWeek(),
                    };

                    // If navigating back to current week
                    if (newKey === state.currentWeekKey) {
                        const weekData = updatedWeeks[state.currentWeekKey] || state.week;
                        return { browsingWeekKey: null, week: weekData, weeks: updatedWeeks, journalsByWeek: updatedJournalsByWeek };
                    }

                    // Load target week from weeks map, or from weekHistory, or create empty
                    let targetWeek = updatedWeeks[newKey];
                    if (!targetWeek) {
                        const historyEntry = state.weekHistory.find(s => s.weekKey === newKey);
                        if (historyEntry) {
                            targetWeek = JSON.parse(JSON.stringify(historyEntry.weekData));
                        }
                    }
                    if (!targetWeek) {
                        // Empty week — no data for this period
                        targetWeek = {
                            mon: createMonday(), tue: createTuesday(), wed: createWednesday(),
                            thu: createThursday(), fri: createFriday(), sat: createSaturday(), sun: createSunday(),
                        };
                    }

                    return { browsingWeekKey: newKey, week: targetWeek, weeks: updatedWeeks, journalsByWeek: updatedJournalsByWeek };
                }),

            jumpToCurrentWeek: () =>
                set((state) => {
                    if (!state.browsingWeekKey) return state;
                    // Save browsed week
                    const updatedWeeks = {
                        ...state.weeks,
                        [state.browsingWeekKey]: JSON.parse(JSON.stringify(state.week)),
                    };
                    const currentWeekData = updatedWeeks[state.currentWeekKey] || state.week;
                    const updatedJournalsByWeek = {
                        ...state.journalsByWeek,
                        [state.browsingWeekKey]: state.journalsByWeek[state.browsingWeekKey] || createEmptyJournalWeek(),
                    };
                    return { browsingWeekKey: null, week: currentWeekData, weeks: updatedWeeks, journalsByWeek: updatedJournalsByWeek };
                }),

            viewWeekByKey: (weekKey) =>
                set((state) => {
                    if (weekKey === state.currentWeekKey) {
                        return { browsingWeekKey: null, currentTab: 'schedule' as AppTab };
                    }
                    // Save current view
                    const saveKey = state.browsingWeekKey || state.currentWeekKey;
                    const updatedWeeks = {
                        ...state.weeks,
                        [saveKey]: JSON.parse(JSON.stringify(state.week)),
                    };
                    const updatedJournalsByWeek = {
                        ...state.journalsByWeek,
                        [saveKey]: state.journalsByWeek[saveKey] || createEmptyJournalWeek(),
                    };
                    // Load target
                    let targetWeek = updatedWeeks[weekKey];
                    if (!targetWeek) {
                        const historyEntry = state.weekHistory.find(s => s.weekKey === weekKey);
                        if (historyEntry) {
                            targetWeek = JSON.parse(JSON.stringify(historyEntry.weekData));
                        }
                    }
                    if (!targetWeek) {
                        targetWeek = {
                            mon: createMonday(), tue: createTuesday(), wed: createWednesday(),
                            thu: createThursday(), fri: createFriday(), sat: createSaturday(), sun: createSunday(),
                        };
                    }
                    return { browsingWeekKey: weekKey, week: targetWeek, weeks: updatedWeeks, journalsByWeek: updatedJournalsByWeek, currentTab: 'schedule' as AppTab };
                }),

            startNewWeek: () =>
                set((state) => {
                    const newMondayKey = getMondayOfWeek();
                    if (newMondayKey === state.currentWeekKey) return state; // same week
                    const currentWeekData = state.weeks[state.currentWeekKey] || state.week;

                    // Archive current week first
                    const { totalSleepMins, totalDayScore, completedBlocks, totalBlocks, categoryBreakdown } = computeWeekAggregate(currentWeekData);

                    const oldWeekKey = state.currentWeekKey;
                    const snapshot: WeekSnapshot = {
                        id: nanoid(),
                        weekKey: oldWeekKey,
                        weekLabel: getWeekLabel(oldWeekKey),
                        dateArchived: new Date().toISOString(),
                        totalSleepHours: parseFloat((totalSleepMins / 60).toFixed(1)),
                        avgSleepHours: parseFloat((totalSleepMins / 60 / 7).toFixed(1)),
                        sleepDebtHours: parseFloat((Math.max(0, 7 * 7 - totalSleepMins / 60)).toFixed(1)),
                        dayScore: parseFloat((totalDayScore / 7).toFixed(1)),
                        categoryBreakdown,
                        weekData: JSON.parse(JSON.stringify(currentWeekData)),
                        completedBlocks,
                        totalBlocks,
                        xpEarned: completedBlocks * 10,
                    };

                    const alreadyArchived = state.weekHistory.some(s => s.weekKey === oldWeekKey);

                    // Create fresh week by copying block templates (reset completed/actuals)
                    const freshWeek: Record<DayKey, DayData> = {} as Record<DayKey, DayData>;
                    DAY_KEYS.forEach((dk) => {
                        const oldDay = currentWeekData[dk];
                        freshWeek[dk] = {
                            wakeTime: oldDay.wakeTime,
                            workStart: oldDay.workStart,
                            sleepTarget: oldDay.sleepTarget,
                            commuteMins: oldDay.commuteMins,
                            blocks: oldDay.blocks.map(b => ({
                                ...b,
                                completed: false,
                                actualStart: null,
                                actualStartDate: null,
                            })),
                            actualWakeTime: null,
                            actualSleepTime: null,
                        };
                    });

                    return {
                        week: freshWeek,
                        currentWeekKey: newMondayKey,
                        browsingWeekKey: null,
                        weekHistory: alreadyArchived ? state.weekHistory : [...state.weekHistory, snapshot],
                        weeks: {
                            ...state.weeks,
                            [oldWeekKey]: JSON.parse(JSON.stringify(currentWeekData)),
                            [newMondayKey]: freshWeek,
                        },
                        newWeekArchived: alreadyArchived ? null : snapshot,
                        journalsByWeek: {
                            ...state.journalsByWeek,
                            [newMondayKey]: state.journalsByWeek[newMondayKey] || createEmptyJournalWeek(),
                        },
                    };
                }),

            dismissNewWeekBanner: () => set({ newWeekArchived: null }),

            resetStore: () => set({
                selectedDay: "mon",
                currentTab: "schedule" as AppTab,
                categories: DEFAULT_CATEGORIES,
                quickNotes: "",
                streak: 0,
                lastCompletedDate: null,
                focusBlockId: null,
                googleToken: null,
                googleCalendarLinked: false,
                calendarEvents: [],
                weekHistory: [],
                weeks: {},
                currentWeekKey: getMondayOfWeek(),
                browsingWeekKey: null,
                newWeekArchived: null,
                xp: 0,
                earnedBadges: [],
                streakFreezes: 1,
                streakFreezeUsedThisWeek: false,
                gamificationEnabled: true,
                levelUpModal: null,
                journalsByWeek: {
                    [getMondayOfWeek()]: createEmptyJournalWeek(),
                },
                pomodoroWork: 25,
                pomodoroBreak: 5,
                pomodoroLongBreak: 15,
                pomodoroSessions: 4,
                accentColor: "indigo",
                compactMode: false,
            durationDisplayUnit: "minutes",
                week: migrateWeekCommuteBlocks({
                    mon: createMonday(),
                    tue: createTuesday(),
                    wed: createWednesday(),
                    thu: createThursday(),
                    fri: createFriday(),
                    sat: createSaturday(),
                    sun: createSunday(),
                }),
            }),
        }),
        {
            name: "planner-storage",
            partialize: (state) => {
                const { googleToken, calendarEvents, ...persisted } = state;
                void googleToken;
                void calendarEvents;
                return persisted;
            },
            onRehydrateStorage: () => (state) => {
                if (!state) return;
                if (state.googleToken && !state.googleCalendarLinked) {
                    state.googleCalendarLinked = true;
                }
                state.googleToken = null;
                state.calendarEvents = [];
                state.week = migrateWeekCommuteBlocks(state.week);
                const migratedWeeks: Record<string, Record<DayKey, DayData>> = {};
                for (const [key, weekData] of Object.entries(state.weeks || {})) {
                    migratedWeeks[key] = migrateWeekCommuteBlocks(weekData);
                }
                state.weeks = migratedWeeks;
            },
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
    // Before syncing, save current week into weeks map
    const saveKey = s.browsingWeekKey || s.currentWeekKey;
    const weeks = { ...s.weeks, [saveKey]: JSON.parse(JSON.stringify(s.week)) };
    const canonicalCurrentWeek = weeks[s.currentWeekKey] || s.week;
    const journalsByWeek = {
        ...s.journalsByWeek,
        [s.currentWeekKey]: s.journalsByWeek[s.currentWeekKey] || createEmptyJournalWeek(),
    };
    return {
        week: canonicalCurrentWeek,
        weeks,
        currentWeekKey: s.currentWeekKey,
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
        journalsByWeek,
        pomodoroWork: s.pomodoroWork,
        pomodoroBreak: s.pomodoroBreak,
        pomodoroLongBreak: s.pomodoroLongBreak,
        pomodoroSessions: s.pomodoroSessions,
        accentColor: s.accentColor,
        compactMode: s.compactMode,
        durationDisplayUnit: s.durationDisplayUnit,
        googleCalendarLinked: s.googleCalendarLinked,
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

    const todayMondayKey = getMondayOfWeek();
    const storedWeekKey = cloud.currentWeekKey || todayMondayKey;
    const cloudWeeks = cloud.weeks || {};
    const hydratedWeek = cloudWeeks[storedWeekKey] || cloud.week;
    const journalsByWeek =
        cloud.journalsByWeek ||
        (cloud.journal ? { [storedWeekKey]: cloud.journal } : {});
    const hydratedJournals = {
        ...journalsByWeek,
        [storedWeekKey]: journalsByWeek[storedWeekKey] || createEmptyJournalWeek(),
    };

    useScheduleStore.setState({
        week: migrateWeekCommuteBlocks(hydratedWeek),
        weeks: Object.fromEntries(
            Object.entries(cloudWeeks).map(([k, w]) => [k, migrateWeekCommuteBlocks(w as Record<DayKey, DayData>)])
        ),
        currentWeekKey: storedWeekKey,
        browsingWeekKey: null,
        newWeekArchived: null,
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
        journalsByWeek: hydratedJournals,
        pomodoroWork: cloud.pomodoroWork ?? 25,
        pomodoroBreak: cloud.pomodoroBreak ?? 5,
        pomodoroLongBreak: cloud.pomodoroLongBreak ?? 15,
        pomodoroSessions: cloud.pomodoroSessions ?? 4,
        accentColor: cloud.accentColor ?? "indigo",
        compactMode: cloud.compactMode ?? false,
        durationDisplayUnit: cloud.durationDisplayUnit === "hours" ? "hours" : "minutes",
        googleCalendarLinked: !!cloud.googleCalendarLinked,
        levelUpModal: null,
    });

    // Auto-archive: if the stored week belongs to a past calendar week, start a new one
    if (storedWeekKey < todayMondayKey) {
        useScheduleStore.getState().startNewWeek();
    }

    return true;
}

export async function forcePushToCloud() {
    if (!_currentUserId) return;
    await saveCloudState(_currentUserId, getCloudPayload());
}
