import { supabase } from "./supabase";
import type { DayData } from "../types/schedule";
import type { Block, BlockRecurrence } from "../types/block";
import { DAY_KEYS, type DayKey, type Habit, type JournalEntry, type NotificationPreferences } from "../store/useScheduleStore";
import { getDateForDayKeyInWeek, getMondayOfWeek } from "../utils/dateUtils";
import { migrateWeekCommuteBlocks } from "../utils/commuteBlocks";

interface SettingsRow {
    pomodoro_work: number;
    pomodoro_break: number;
    pomodoro_long_break: number;
    pomodoro_sessions: number;
    accent_color: string;
    compact_mode: boolean;
    gamification_enabled: boolean;
    quick_notes: string;
    categories_json: unknown;
    notification_prefs: NotificationPreferences;
    app_meta_json: Record<string, unknown>;
    onboarding_complete: boolean;
}

interface DayRow {
    date: string;
    wake_time: number;
    work_start: number;
    sleep_target: number;
    commute_mins: number;
    actual_wake_time: number | null;
    actual_wake_date: string | null;
    actual_sleep_time: number | null;
    actual_sleep_date: string | null;
}

interface BlockRow {
    date: string;
    block_id: string;
    sort_order: number;
    type: string;
    label: string;
    dur: number;
    enabled: boolean;
    completed: boolean;
    actual_start: number | null;
    actual_start_date: string | null;
    subtasks_json: { id: string; text: string; done: boolean }[];
    recurrence: string | null;
    recurrence_group_id: string | null;
    note: string | null;
}

function rowToBlock(row: BlockRow): Block {
    return {
        id: row.block_id,
        type: row.type,
        label: row.label,
        dur: row.dur,
        on: row.enabled,
        completed: row.completed,
        actualStart: row.actual_start,
        actualStartDate: row.actual_start_date,
        subtasks: row.subtasks_json || [],
        recurrence: (row.recurrence as BlockRecurrence) || "none",
        recurrenceGroupId: row.recurrence_group_id || undefined,
        note: row.note || undefined,
    };
}

function rowToDay(row: DayRow, blocks: Block[]): DayData {
    return {
        wakeTime: row.wake_time,
        workStart: row.work_start,
        sleepTarget: row.sleep_target,
        commuteMins: row.commute_mins,
        blocks,
        actualWakeTime: row.actual_wake_time,
        actualSleepTime: row.actual_sleep_time,
        actualWakeDate: row.actual_wake_date,
        actualSleepDate: row.actual_sleep_date,
    };
}

/** Build app state from normalized tables; null if insufficient data. */
export async function loadStateFromNormalized(userId: string): Promise<Record<string, unknown> | null> {
    const { data: settings } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

    if (!settings?.migrated_at) return null;

    const s = settings as SettingsRow;
    const meta = (s.app_meta_json || {}) as Record<string, unknown>;
    const currentWeekKey = (meta.currentWeekKey as string) || getMondayOfWeek();

    const weekKeys = new Set<string>([currentWeekKey]);
    const { data: completionRows } = await supabase
        .from("habit_completions")
        .select("week_key")
        .eq("user_id", userId);
    completionRows?.forEach((r) => weekKeys.add(r.week_key));

    const weeks: Record<string, Record<DayKey, DayData>> = {};
    const journalsByWeek: Record<string, Record<DayKey, JournalEntry>> = {};

    for (const weekKey of weekKeys) {
        const week = {} as Record<DayKey, DayData>;
        const journalWeek = {} as Record<DayKey, JournalEntry>;

        for (const dayKey of DAY_KEYS) {
            const date = getDateForDayKeyInWeek(dayKey, weekKey);
            const { data: dayRow } = await supabase
                .from("days")
                .select("*")
                .eq("user_id", userId)
                .eq("date", date)
                .maybeSingle();

            const { data: blockRows } = await supabase
                .from("blocks")
                .select("*")
                .eq("user_id", userId)
                .eq("date", date)
                .order("sort_order");

            const blocks = (blockRows as BlockRow[] | null)?.map(rowToBlock) || [];
            week[dayKey] = dayRow
                ? rowToDay(dayRow as DayRow, blocks)
                : {
                    wakeTime: 420,
                    workStart: 0,
                    sleepTarget: 420,
                    commuteMins: 0,
                    blocks: [],
                    actualWakeTime: null,
                    actualSleepTime: null,
                    actualWakeDate: null,
                    actualSleepDate: null,
                };

            const { data: journalRow } = await supabase
                .from("journal_entries")
                .select("*")
                .eq("user_id", userId)
                .eq("date", date)
                .maybeSingle();

            journalWeek[dayKey] = journalRow
                ? {
                    mood: journalRow.mood,
                    energy: journalRow.energy,
                    intention: journalRow.intention || "",
                    reflection: journalRow.reflection || "",
                    gratitude: journalRow.gratitude_json || [],
                }
                : { mood: null, energy: null, intention: "", reflection: "", gratitude: [] };
        }

        weeks[weekKey] = migrateWeekCommuteBlocks(week);
        journalsByWeek[weekKey] = journalWeek;
    }

    const { data: habitRows } = await supabase.from("habits").select("*").eq("user_id", userId).order("sort_order");
    const habits: Habit[] = (habitRows || []).map((h) => ({
        id: h.habit_id,
        name: h.name,
        emoji: h.emoji,
        frequency: h.frequency,
        customDays: h.custom_days || undefined,
        targetCount: h.target_count ?? 1,
        createdAt: h.created_at,
    }));

    const { data: allCompletions } = await supabase
        .from("habit_completions")
        .select("*")
        .eq("user_id", userId);

    const habitCompletionsByWeek: Record<string, Record<string, Record<DayKey, boolean>>> = {};
    for (const row of allCompletions || []) {
        const wk = row.week_key as string;
        if (!habitCompletionsByWeek[wk]) habitCompletionsByWeek[wk] = {};
        if (!habitCompletionsByWeek[wk][row.habit_id]) {
            habitCompletionsByWeek[wk][row.habit_id] = {} as Record<DayKey, boolean>;
        }
        habitCompletionsByWeek[wk][row.habit_id][row.day_key as DayKey] = row.completed;
    }

    return {
        week: weeks[currentWeekKey],
        weeks,
        currentWeekKey,
        journalsByWeek,
        categories: (s.categories_json as unknown[])?.length ? s.categories_json : undefined,
        quickNotes: s.quick_notes || "",
        streak: (meta.streak as number) ?? 0,
        lastCompletedDate: (meta.lastCompletedDate as string) ?? null,
        streakFrozenDates: (meta.streakFrozenDates as string[]) ?? [],
        selectedDay: (meta.selectedDay as DayKey) ?? "mon",
        weekHistory: meta.weekHistory ?? [],
        xp: (meta.xp as number) ?? 0,
        earnedBadges: meta.earnedBadges ?? [],
        streakFreezes: (meta.streakFreezes as number) ?? 1,
        streakFreezeUsedThisWeek: (meta.streakFreezeUsedThisWeek as boolean) ?? false,
        gamificationEnabled: s.gamification_enabled ?? true,
        habits,
        habitCompletionsByWeek,
        notificationPrefs: s.notification_prefs || {},
        pomodoroWork: s.pomodoro_work,
        pomodoroBreak: s.pomodoro_break,
        pomodoroLongBreak: s.pomodoro_long_break,
        pomodoroSessions: s.pomodoro_sessions,
        accentColor: s.accent_color,
        compactMode: s.compact_mode,
        durationDisplayUnit: meta.durationDisplayUnit ?? "minutes",
        googleCalendarLinked: meta.googleCalendarLinked ?? false,
        onboardingComplete: s.onboarding_complete ?? false,
    };
}
