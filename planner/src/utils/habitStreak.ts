import type { DayKey, Habit, HabitCompletions } from "../store/useScheduleStore";
import { getMondayOfWeek } from "./dateUtils";

const DAY_KEYS: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

export function isHabitActiveOnDay(habit: Habit, day: DayKey): boolean {
    if (habit.frequency === "daily") return true;
    if (habit.frequency === "weekdays") return ["mon", "tue", "wed", "thu", "fri"].includes(day);
    if (habit.frequency === "custom") return habit.customDays?.includes(day) ?? false;
    return false;
}

function dayKeyForDate(date: Date): DayKey {
    const dayIndex = date.getDay();
    return DAY_KEYS[dayIndex === 0 ? 6 : dayIndex - 1];
}

/** Consecutive completed habit days walking backward from today (skips inactive days). */
export function computeHabitStreak(
    habit: Habit,
    habitCompletionsByWeek: Record<string, HabitCompletions>,
    maxDays = 366
): number {
    let streak = 0;
    const today = new Date();

    for (let daysAgo = 0; daysAgo < maxDays; daysAgo++) {
        const d = new Date(today);
        d.setDate(today.getDate() - daysAgo);

        const dayKey = dayKeyForDate(d);
        if (!isHabitActiveOnDay(habit, dayKey)) continue;

        const weekKey = getMondayOfWeek(d);
        const done = habitCompletionsByWeek[weekKey]?.[habit.id]?.[dayKey] ?? false;
        if (done) {
            streak++;
        } else {
            break;
        }
    }

    return streak;
}
