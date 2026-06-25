import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import type { Block, BlockCategory } from "../types/block";
import type { DayData } from "../types/schedule";
import { type CalendarEvent, type GoogleEventUpdate, updateGoogleEventAuthenticated } from "../services/googleCalendar";
import { getLevelInfo } from "../engine/xpEngine";
import { toLocalISODate, getMondayOfWeek, addWeeksToMondayKey, getWeekLabel } from "../utils/dateUtils";
import { computeWeekAggregate } from "../services/weekLifecycleService";
import type { DurationDisplayUnit } from "../utils/durationUtils";
import { toast } from "react-hot-toast";
import type { TimeBudget } from "../engine/budgetEngine";
import { useSubscriptionStore } from "./useSubscriptionStore";
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
import { isStreakConsecutive } from "../utils/streakUtils";
import { applyRecurrenceToWeek, cloneBlocksForTemplate } from "../utils/recurringBlocks";
import type { BlockRecurrence } from "../types/block";
import { XP_ACTIONS } from "../engine/xpEngine";

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

export type AppTab = 'schedule' | 'analytics' | 'journal' | 'habits' | 'settings';

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

// ── Habit Tracker Types ──

export interface Habit {
    id: string;
    name: string;
    emoji: string;
    frequency: 'daily' | 'weekdays' | 'custom';
    customDays?: DayKey[];   // only used when frequency === 'custom'
    targetCount: number;     // how many times per day (usually 1)
    createdAt: string;
}

export type HabitCompletions = Record<string, Record<DayKey, boolean>>;  // habitId → dayKey → done

// ── Notification Preferences ──

export interface NotificationPreferences {
    enabled: boolean;
    blockReminders: boolean;
    sleepReminder: boolean;
    streakAlert: boolean;
    focusTimerDone: boolean;
    reminderMinsBefore: number;   // minutes before block start
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
    streakFrozenDates: string[];

    // Onboarding
    onboardingComplete: boolean;

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

    // Habits
    habits: Habit[];
    habitCompletionsByWeek: Record<string, HabitCompletions>;  // weekKey → completions

    // Notifications
    notificationPrefs: NotificationPreferences;

    // Settings
    pomodoroWork: number;
    pomodoroBreak: number;
    pomodoroLongBreak: number;
    pomodoroSessions: number;
    accentColor: string;
    compactMode: boolean;
    durationDisplayUnit: DurationDisplayUnit;
    timeBudgets: TimeBudget[];

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
    setBlockRecurrence: (day: DayKey, blockId: string, recurrence: BlockRecurrence) => void;
    copyDayScheduleToDays: (sourceDay: DayKey, targetDays: DayKey[]) => void;
    copyDayScheduleToWeek: (sourceDay: DayKey, includeWeekends?: boolean) => void;
    completeOnboarding: (payload: { wakeTime: number; workStart: number; commuteMins: number; withWork: boolean }) => void;

    // Actions — Subtasks
    addSubtask: (day: DayKey, blockId: string, text: string) => void;
    toggleSubtask: (day: DayKey, blockId: string, subtaskId: string) => void;
    removeSubtask: (day: DayKey, blockId: string, subtaskId: string) => void;
    updateSubtask: (day: DayKey, blockId: string, subtaskId: string, text: string) => void;

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

    // Actions — Habits
    addHabit: (habit: Habit) => void;
    updateHabit: (habitId: string, updates: Partial<Habit>) => void;
    removeHabit: (habitId: string) => void;
    toggleHabitCompletion: (habitId: string, day: DayKey) => void;

    // Actions — Notifications
    updateNotificationPrefs: (prefs: Partial<NotificationPreferences>) => void;

    // Actions — Settings
    updateSettings: (settings: Partial<Pick<ScheduleStore, 'pomodoroWork' | 'pomodoroBreak' | 'pomodoroLongBreak' | 'pomodoroSessions' | 'accentColor' | 'compactMode' | 'gamificationEnabled' | 'durationDisplayUnit'>>) => void;

    // Actions — Budgets
    updateTimeBudget: (categoryId: string, updates: Partial<Omit<TimeBudget, 'categoryId'>>) => void;

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
            streakFrozenDates: [],
            onboardingComplete: false,
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

            // Habit defaults
            habits: [],
            habitCompletionsByWeek: {},

            // Notification defaults
            notificationPrefs: {
                enabled: false,
                blockReminders: true,
                sleepReminder: true,
                streakAlert: true,
                focusTimerDone: true,
                reminderMinsBefore: 5,
            },

            // Settings defaults
            pomodoroWork: 25,
            pomodoroBreak: 5,
            pomodoroLongBreak: 15,
            pomodoroSessions: 4,
            accentColor: "indigo",
            compactMode: false,
            durationDisplayUnit: "minutes",
            timeBudgets: [
                { categoryId: "work", targetMins: 2400 },
                { categoryId: "health", targetMins: 300, minMins: 180 },
                { categoryId: "study", targetMins: 300 },
                { categoryId: "gaming", maxMins: 480 },
            ],

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
                set((state) => {
                    const activeCount = state.week[day].blocks.filter((b) => b.on).length;
                    const limit = useSubscriptionStore.getState().getBlockLimit();
                    if (activeCount >= limit) {
                        useSubscriptionStore.getState().openUpgradeModal("unlimited_blocks");
                        toast.error("Free plan limit reached (max 3 blocks/day). Upgrade to Pro!");
                        return {};
                    }
                    return {
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
                    };
                }),

            insertBlock: (day, type, id, orderedIds) =>
                set((state) => {
                    const activeCount = state.week[day].blocks.filter((b) => b.on).length;
                    const limit = useSubscriptionStore.getState().getBlockLimit();
                    if (activeCount >= limit) {
                        useSubscriptionStore.getState().openUpgradeModal("unlimited_blocks");
                        toast.error("Free plan limit reached (max 3 blocks/day). Upgrade to Pro!");
                        return {};
                    }
                    const catName = state.categories.find(c => c.id === type)?.name || type;
                    const newBlock: Block = {
                        id,
                        type: type as Block["type"],
                        label: catName,
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
                    const block = state.week[day].blocks.find((b) => b.id === blockId);
                    const groupId = block?.recurrenceGroupId;
                    let week = { ...state.week };
                    if (groupId) {
                        for (const dk of DAY_KEYS) {
                            week[dk] = syncDayMetaFromBlocks({
                                ...week[dk],
                                blocks: week[dk].blocks.filter((b) => b.recurrenceGroupId !== groupId && b.id !== blockId),
                            });
                        }
                    } else {
                        week[day] = syncDayMetaFromBlocks({
                            ...week[day],
                            blocks: week[day].blocks.filter((b) => b.id !== blockId),
                        });
                    }
                    return { week };
                }),

            setBlockRecurrence: (day, blockId, recurrence) =>
                set((state) => {
                    if (recurrence !== "none") {
                        const canAccess = useSubscriptionStore.getState().canAccess("block_recurrence");
                        if (!canAccess) {
                            useSubscriptionStore.getState().openUpgradeModal("block_recurrence");
                            toast.error("Upgrade to Pro to enable recurring blocks!");
                            return {};
                        }
                    }
                    const week = applyRecurrenceToWeek(state.week, day, blockId, recurrence);
                    const synced = {} as Record<DayKey, DayData>;
                    for (const dk of DAY_KEYS) {
                        synced[dk] = syncDayMetaFromBlocks(week[dk]);
                    }
                    return { week: migrateWeekCommuteBlocks(synced) };
                }),

            copyDayScheduleToDays: (sourceDay, targetDays) =>
                set((state) => {
                    const canAccess = useSubscriptionStore.getState().canAccess("copy_schedule");
                    if (!canAccess) {
                        useSubscriptionStore.getState().openUpgradeModal("copy_schedule");
                        toast.error("Upgrade to Pro to copy schedules!");
                        return {};
                    }
                    const source = state.week[sourceDay];
                    const week = { ...state.week };
                    for (const target of targetDays) {
                        if (target === sourceDay) continue;
                        week[target] = {
                            ...week[target],
                            wakeTime: source.wakeTime,
                            workStart: source.workStart,
                            sleepTarget: source.sleepTarget,
                            commuteMins: source.commuteMins,
                            blocks: cloneBlocksForTemplate(source.blocks),
                        };
                    }
                    return { week: migrateWeekCommuteBlocks(week) };
                }),

            copyDayScheduleToWeek: (sourceDay, includeWeekends = false) => {
                const targets = includeWeekends
                    ? DAY_KEYS.filter((d) => d !== sourceDay)
                    : (["mon", "tue", "wed", "thu", "fri"] as DayKey[]).filter((d) => d !== sourceDay);
                useScheduleStore.getState().copyDayScheduleToDays(sourceDay, targets);
            },

            completeOnboarding: ({ wakeTime, workStart, commuteMins, withWork }) =>
                set((state) => {
                    const weekdays: DayKey[] = ["mon", "tue", "wed", "thu", "fri"];
                    const week = { ...state.week };
                    for (const day of DAY_KEYS) {
                        const isWeekday = weekdays.includes(day);
                        week[day] = applyCommuteMinsToDay({
                            ...week[day],
                            wakeTime,
                            workStart: withWork && isWeekday ? workStart : 0,
                            commuteMins: withWork && isWeekday ? commuteMins : 0,
                        }, withWork && isWeekday ? commuteMins : 0);
                    }
                    return { week: migrateWeekCommuteBlocks(week), onboardingComplete: true };
                }),

            // Subtask actions
            addSubtask: (day, blockId, text) =>
                set((state) => ({
                    week: {
                        ...state.week,
                        [day]: {
                            ...state.week[day],
                            blocks: state.week[day].blocks.map((b) =>
                                b.id === blockId
                                    ? { ...b, subtasks: [...(b.subtasks || []), { id: nanoid(), text, done: false }] }
                                    : b
                            ),
                        },
                    },
                })),

            toggleSubtask: (day, blockId, subtaskId) =>
                set((state) => {
                    const blocks = state.week[day].blocks.map((b) => {
                        if (b.id !== blockId) return b;
                        const subtasks = (b.subtasks || []).map((s) =>
                            s.id === subtaskId ? { ...s, done: !s.done } : s
                        );
                        const allDone = subtasks.length > 0 && subtasks.every(s => s.done);
                        return { ...b, subtasks, completed: allDone ? true : b.completed };
                    });
                    return { week: { ...state.week, [day]: { ...state.week[day], blocks } } };
                }),

            removeSubtask: (day, blockId, subtaskId) =>
                set((state) => ({
                    week: {
                        ...state.week,
                        [day]: {
                            ...state.week[day],
                            blocks: state.week[day].blocks.map((b) =>
                                b.id === blockId
                                    ? { ...b, subtasks: (b.subtasks || []).filter((s) => s.id !== subtaskId) }
                                    : b
                            ),
                        },
                    },
                })),

            updateSubtask: (day, blockId, subtaskId, text) =>
                set((state) => ({
                    week: {
                        ...state.week,
                        [day]: {
                            ...state.week[day],
                            blocks: state.week[day].blocks.map((b) =>
                                b.id === blockId
                                    ? { ...b, subtasks: (b.subtasks || []).map((s) => s.id === subtaskId ? { ...s, text } : s) }
                                    : b
                            ),
                        },
                    },
                })),

            updateQuickNotes: (notes) => set(() => {
                const limit = useSubscriptionStore.getState().getNotesLimit();
                if (notes.length > limit) {
                    useSubscriptionStore.getState().openUpgradeModal("unlimited_notes");
                    toast.error(`Free plan limits notes to ${limit} characters. Upgrade to Pro!`);
                    return { quickNotes: notes.substring(0, limit) };
                }
                return { quickNotes: notes };
            }),

            updateStreak: (completed) =>
                set((state) => {
                    const today = toLocalISODate();
                    if (!completed) return state;

                    const consecutive = isStreakConsecutive(
                        state.lastCompletedDate,
                        state.streakFrozenDates,
                        today
                    );

                    return {
                        streak: state.lastCompletedDate === today
                            ? state.streak
                            : consecutive
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
            useStreakFreeze: () => set((state) => {
                const today = toLocalISODate();
                if (state.streakFreezes <= 0 || state.streakFreezeUsedThisWeek) return state;
                if (state.streakFrozenDates.includes(today)) return state;
                return {
                    streakFreezes: Math.max(0, state.streakFreezes - 1),
                    streakFreezeUsedThisWeek: true,
                    streakFrozenDates: [...state.streakFrozenDates, today],
                    lastCompletedDate: state.lastCompletedDate === today ? state.lastCompletedDate : today,
                };
            }),
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

            // Habit actions
            addHabit: (habit) => set((state) => ({ habits: [...state.habits, habit] })),
            updateHabit: (habitId, updates) => set((state) => ({
                habits: state.habits.map(h => h.id === habitId ? { ...h, ...updates } : h)
            })),
            removeHabit: (habitId) => set((state) => ({
                habits: state.habits.filter(h => h.id !== habitId)
            })),
            toggleHabitCompletion: (habitId, day) => {
                const state = useScheduleStore.getState();
                const weekKey = state.browsingWeekKey || state.currentWeekKey;
                const weekCompletions = state.habitCompletionsByWeek[weekKey] || {};
                const habitDays = weekCompletions[habitId] || ({} as Record<DayKey, boolean>);
                const newDone = !habitDays[day];
                set({
                    habitCompletionsByWeek: {
                        ...state.habitCompletionsByWeek,
                        [weekKey]: {
                            ...weekCompletions,
                            [habitId]: { ...habitDays, [day]: newDone },
                        },
                    },
                });
                if (newDone && state.gamificationEnabled) {
                    state.addXP(XP_ACTIONS.HABIT_COMPLETE);
                }
            },

            // Notification actions
            updateNotificationPrefs: (prefs) => set((state) => ({
                notificationPrefs: { ...state.notificationPrefs, ...prefs },
            })),

            // Settings actions
            updateSettings: (settings) => set(settings),

            updateTimeBudget: (categoryId, updates) =>
                set((state) => {
                    const exists = state.timeBudgets.some((b) => b.categoryId === categoryId);
                    let newBudgets;
                    if (exists) {
                        newBudgets = state.timeBudgets.map((b) =>
                            b.categoryId === categoryId ? { ...b, ...updates } : b
                        );
                    } else {
                        newBudgets = [...state.timeBudgets, { categoryId, ...updates }];
                    }
                    return { timeBudgets: newBudgets };
                }),

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
                        streakFreezeUsedThisWeek: false,
                        streakFrozenDates: [],
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
                streakFrozenDates: [],
                onboardingComplete: false,
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
                habits: [],
                habitCompletionsByWeek: {},
                notificationPrefs: {
                    enabled: false,
                    blockReminders: true,
                    sleepReminder: true,
                    streakAlert: true,
                    focusTimerDone: true,
                    reminderMinsBefore: 5,
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
import { syncNormalizedFromPayload } from "../services/syncNormalizedState";

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
        streakFrozenDates: s.streakFrozenDates,
        onboardingComplete: s.onboardingComplete,
        selectedDay: s.selectedDay,
        weekHistory: s.weekHistory,
        xp: s.xp,
        earnedBadges: s.earnedBadges,
        streakFreezes: s.streakFreezes,
        streakFreezeUsedThisWeek: s.streakFreezeUsedThisWeek,
        gamificationEnabled: s.gamificationEnabled,
        journalsByWeek,
        habits: s.habits,
        habitCompletionsByWeek: s.habitCompletionsByWeek,
        notificationPrefs: s.notificationPrefs,
        pomodoroWork: s.pomodoroWork,
        pomodoroBreak: s.pomodoroBreak,
        pomodoroLongBreak: s.pomodoroLongBreak,
        pomodoroSessions: s.pomodoroSessions,
        accentColor: s.accentColor,
        compactMode: s.compactMode,
        durationDisplayUnit: s.durationDisplayUnit,
        googleCalendarLinked: s.googleCalendarLinked,
        timeBudgets: s.timeBudgets,
    };
}

useScheduleStore.subscribe(() => {
    if (!_currentUserId) return;
    if (syncTimer) clearTimeout(syncTimer);
    const uid = _currentUserId;
    syncTimer = setTimeout(() => {
        const payload = getCloudPayload();
        saveCloudState(uid, payload);
        syncNormalizedFromPayload(payload);
    }, 2000);
});

export async function hydrateFromCloud(userId: string) {
    const { loadStateFromNormalized } = await import("../services/loadNormalizedState");
    const normalized = await loadStateFromNormalized(userId);
    const cloud = normalized || await fetchCloudState(userId);

    if (!cloud || !cloud.week) {
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
        streakFrozenDates: cloud.streakFrozenDates ?? [],
        onboardingComplete: cloud.onboardingComplete ?? false,
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
        habits: cloud.habits ?? [],
        habitCompletionsByWeek: cloud.habitCompletionsByWeek ?? {},
        timeBudgets: cloud.timeBudgets ?? [
            { categoryId: "work", targetMins: 2400 },
            { categoryId: "health", targetMins: 300, minMins: 180 },
            { categoryId: "study", targetMins: 300 },
            { categoryId: "gaming", maxMins: 480 },
        ],
        notificationPrefs: cloud.notificationPrefs ?? {
            enabled: false,
            blockReminders: true,
            sleepReminder: true,
            streakAlert: true,
            focusTimerDone: true,
            reminderMinsBefore: 5,
        },
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
    const payload = getCloudPayload();
    await saveCloudState(_currentUserId, payload);
    await syncNormalizedFromPayload(payload);
}
