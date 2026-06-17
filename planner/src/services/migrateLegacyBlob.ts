import type { DayKey } from "../store/useScheduleStore";
import type { DayData } from "../types/schedule";
import type { JournalEntry } from "../store/useScheduleStore";
import { getDateForDayKeyInWeek } from "../utils/dateUtils";
import { fetchLegacyBlobForCurrentUser } from "./supabase";
import { getMigrationStatus, markMigrated, replaceBlocksForDay, upsertDay, upsertJournalEntry, upsertSettings } from "./normalizedRepo";

type LegacyWeek = Record<DayKey, DayData>;

export async function migrateLegacyBlobIfNeeded(): Promise<boolean> {
    const already = await getMigrationStatus();
    if (already) return true;

    const legacy = await fetchLegacyBlobForCurrentUser();
    if (!legacy) return false;

    // Settings
    await upsertSettings({
        pomodoro_work: legacy.pomodoroWork ?? 25,
        pomodoro_break: legacy.pomodoroBreak ?? 5,
        pomodoro_long_break: legacy.pomodoroLongBreak ?? 15,
        pomodoro_sessions: legacy.pomodoroSessions ?? 4,
        accent_color: legacy.accentColor ?? "indigo",
        compact_mode: legacy.compactMode ?? false,
        gamification_enabled: legacy.gamificationEnabled ?? true,
    });

    const weeks = (legacy.weeks as Record<string, LegacyWeek>) || {};
    const journalsByWeek = (legacy.journalsByWeek as Record<string, Record<DayKey, JournalEntry>>) || {};

    for (const [weekKey, week] of Object.entries(weeks)) {
        for (const dayKey of Object.keys(week) as DayKey[]) {
            const date = getDateForDayKeyInWeek(dayKey, weekKey);
            const day = week[dayKey];
            await upsertDay(date, day);
            await replaceBlocksForDay(date, day.blocks || []);
        }

        const journalWeek = journalsByWeek[weekKey];
        if (journalWeek) {
            for (const [dayKey, entry] of Object.entries(journalWeek) as [DayKey, JournalEntry][]) {
                const date = getDateForDayKeyInWeek(dayKey, weekKey);
                await upsertJournalEntry(date, entry);
            }
        }
    }

    await markMigrated();
    return true;
}

