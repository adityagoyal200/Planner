import { supabase } from "./supabase";
import type { DayData } from "../types/schedule";
import type { DayKey } from "../store/useScheduleStore";
import type { Block } from "../types/block";
import type { Habit } from "../store/useScheduleStore";

export interface NormalizedDayRow {
    date: string; // YYYY-MM-DD
    wake_time: number;
    work_start: number;
    sleep_target: number;
    commute_mins: number;
    actual_wake_time: number | null;
    actual_wake_date: string | null;
    actual_sleep_time: number | null;
    actual_sleep_date: string | null;
}

export async function getAuthedUserId(): Promise<string | null> {
    const { data } = await supabase.auth.getSession();
    return data.session?.user?.id ?? null;
}

export async function upsertSettings(settings: Record<string, unknown>) {
    const uid = await getAuthedUserId();
    if (!uid) return;
    await supabase.from("user_settings").upsert({ user_id: uid, ...settings }, { onConflict: "user_id" });
}

export async function upsertDay(date: string, day: DayData) {
    const uid = await getAuthedUserId();
    if (!uid) return;
    const row: NormalizedDayRow & { user_id: string } = {
        user_id: uid,
        date,
        wake_time: day.wakeTime,
        work_start: day.workStart,
        sleep_target: day.sleepTarget,
        commute_mins: day.commuteMins,
        actual_wake_time: day.actualWakeTime ?? null,
        actual_wake_date: day.actualWakeDate ?? null,
        actual_sleep_time: day.actualSleepTime ?? null,
        actual_sleep_date: day.actualSleepDate ?? null,
    };
    await supabase.from("days").upsert(row, { onConflict: "user_id,date" });
}

export async function replaceBlocksForDay(date: string, blocks: Block[]) {
    const uid = await getAuthedUserId();
    if (!uid) return;
    // delete + insert is simplest for order correctness
    await supabase.from("blocks").delete().eq("user_id", uid).eq("date", date);
    const rows = blocks.map((b, idx) => ({
        user_id: uid,
        date,
        block_id: b.id,
        sort_order: idx,
        type: b.type,
        label: b.label,
        dur: b.dur,
        enabled: !!b.on,
        completed: !!b.completed,
        actual_start: b.actualStart ?? null,
        actual_start_date: b.actualStartDate ?? null,
        subtasks_json: b.subtasks ?? [],
    }));
    if (rows.length > 0) {
        await supabase.from("blocks").insert(rows);
    }
}

export async function upsertJournalEntry(date: string, entry: { mood: number | null; energy: number | null; intention: string; reflection: string; gratitude: string[]; }) {
    const uid = await getAuthedUserId();
    if (!uid) return;
    await supabase.from("journal_entries").upsert({
        user_id: uid,
        date,
        mood: entry.mood,
        energy: entry.energy,
        intention: entry.intention,
        reflection: entry.reflection,
        gratitude_json: entry.gratitude,
    }, { onConflict: "user_id,date" });
}

export async function markMigrated() {
    const uid = await getAuthedUserId();
    if (!uid) return;
    await supabase.from("user_settings").upsert({ user_id: uid, migrated_at: new Date().toISOString() }, { onConflict: "user_id" });
}

export async function getMigrationStatus(): Promise<boolean> {
    const uid = await getAuthedUserId();
    if (!uid) return false;
    const { data } = await supabase.from("user_settings").select("migrated_at").eq("user_id", uid).maybeSingle();
    return !!data?.migrated_at;
}

export async function replaceHabits(habits: Habit[]) {
    const uid = await getAuthedUserId();
    if (!uid) return;
    await supabase.from("habits").delete().eq("user_id", uid);
    if (habits.length === 0) return;
    const rows = habits.map((h, idx) => ({
        user_id: uid,
        habit_id: h.id,
        name: h.name,
        emoji: h.emoji,
        frequency: h.frequency,
        custom_days: h.customDays ?? null,
        target_count: h.targetCount ?? 1,
        sort_order: idx,
        created_at: h.createdAt,
    }));
    await supabase.from("habits").insert(rows);
}

export async function replaceHabitCompletions(
    habitCompletionsByWeek: Record<string, Record<string, Record<DayKey, boolean>>>
) {
    const uid = await getAuthedUserId();
    if (!uid) return;
    await supabase.from("habit_completions").delete().eq("user_id", uid);
    const rows: {
        user_id: string;
        week_key: string;
        habit_id: string;
        day_key: string;
        completed: boolean;
    }[] = [];

    for (const [weekKey, byHabit] of Object.entries(habitCompletionsByWeek)) {
        for (const [habitId, byDay] of Object.entries(byHabit)) {
            for (const [dayKey, completed] of Object.entries(byDay)) {
                if (completed) {
                    rows.push({
                        user_id: uid,
                        week_key: weekKey,
                        habit_id: habitId,
                        day_key: dayKey,
                        completed: true,
                    });
                }
            }
        }
    }

    if (rows.length > 0) {
        await supabase.from("habit_completions").insert(rows);
    }
}

export const DAY_KEYS: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

