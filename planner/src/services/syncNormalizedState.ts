import type { DayKey, Habit, JournalEntry } from "../store/useScheduleStore";
import type { DayData } from "../types/schedule";
import { getDateForDayKeyInWeek } from "../utils/dateUtils";
import {
    DAY_KEYS,
    replaceHabitCompletions,
    replaceHabits,
    upsertJournalEntry,
    upsertSettings,
    upsertDay,
    replaceBlocksForDay,
} from "./normalizedRepo";

export interface CloudSyncPayload {
    week: Record<DayKey, DayData>;
    weeks: Record<string, Record<DayKey, DayData>>;
    currentWeekKey: string;
    journalsByWeek: Record<string, Record<DayKey, JournalEntry>>;
    categories: unknown;
    quickNotes: string;
    streak: number;
    lastCompletedDate: string | null;
    streakFrozenDates: string[];
    onboardingComplete: boolean;
    selectedDay: string;
    weekHistory: unknown;
    xp: number;
    earnedBadges: unknown;
    streakFreezes: number;
    streakFreezeUsedThisWeek: boolean;
    gamificationEnabled: boolean;
    habits: Habit[];
    habitCompletionsByWeek: Record<string, Record<string, Record<DayKey, boolean>>>;
    notificationPrefs: unknown;
    pomodoroWork: number;
    pomodoroBreak: number;
    pomodoroLongBreak: number;
    pomodoroSessions: number;
    accentColor: string;
    compactMode: boolean;
    durationDisplayUnit: string;
    googleCalendarLinked: boolean;
}

/** Mirror blob payload into normalized tables (best-effort, non-blocking). */
export async function syncNormalizedFromPayload(payload: CloudSyncPayload): Promise<void> {
    try {
        await upsertSettings({
            pomodoro_work: payload.pomodoroWork,
            pomodoro_break: payload.pomodoroBreak,
            pomodoro_long_break: payload.pomodoroLongBreak,
            pomodoro_sessions: payload.pomodoroSessions,
            accent_color: payload.accentColor,
            compact_mode: payload.compactMode,
            gamification_enabled: payload.gamificationEnabled,
            quick_notes: payload.quickNotes,
            categories_json: payload.categories,
            notification_prefs: payload.notificationPrefs,
            app_meta_json: {
                streak: payload.streak,
                lastCompletedDate: payload.lastCompletedDate,
                streakFrozenDates: payload.streakFrozenDates,
                selectedDay: payload.selectedDay,
                currentWeekKey: payload.currentWeekKey,
                xp: payload.xp,
                earnedBadges: payload.earnedBadges,
                streakFreezes: payload.streakFreezes,
                streakFreezeUsedThisWeek: payload.streakFreezeUsedThisWeek,
                weekHistory: payload.weekHistory,
                durationDisplayUnit: payload.durationDisplayUnit,
                googleCalendarLinked: payload.googleCalendarLinked,
            },
            onboarding_complete: payload.onboardingComplete,
        });

        await replaceHabits(payload.habits);
        await replaceHabitCompletions(payload.habitCompletionsByWeek);

        const weeks = payload.weeks || {};
        const weekKeys = new Set(Object.keys(weeks));
        weekKeys.add(payload.currentWeekKey);

        for (const weekKey of weekKeys) {
            const week = weeks[weekKey] || (weekKey === payload.currentWeekKey ? payload.week : null);
            if (!week) continue;

            for (const dayKey of DAY_KEYS) {
                const day = week[dayKey];
                if (!day) continue;
                const date = getDateForDayKeyInWeek(dayKey, weekKey);
                await upsertDay(date, day);
                await replaceBlocksForDay(date, day.blocks || []);

                const journal = payload.journalsByWeek?.[weekKey]?.[dayKey];
                if (journal) {
                    await upsertJournalEntry(date, journal);
                }
            }
        }
    } catch (err) {
        console.error("Normalized sync failed:", err);
    }
}
