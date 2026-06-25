import { describe, expect, it, vi } from "vitest";
import { computeHabitStreak, isHabitActiveOnDay } from "./habitStreak";
import { getMondayOfWeek } from "./dateUtils";
import type { Habit, HabitCompletions, DayKey } from "../store/useScheduleStore";

const ALL_DAYS_FALSE: Record<DayKey, boolean> = {
    mon: false, tue: false, wed: false, thu: false, fri: false, sat: false, sun: false,
};

function habit(overrides: Partial<Habit> = {}): Habit {
    return {
        id: "h1",
        name: "Water",
        emoji: "💧",
        frequency: "daily",
        targetCount: 1,
        createdAt: "2026-06-01T00:00:00Z",
        ...overrides,
    };
}

describe("habitStreak", () => {
    it("counts consecutive daily completions", () => {
        const wed = new Date(2026, 5, 17, 12, 0, 0);
        const thisWeek = getMondayOfWeek(wed);

        const completions: Record<string, HabitCompletions> = {
            [thisWeek]: { h1: { ...ALL_DAYS_FALSE, mon: true, tue: true, wed: true } },
        };

        vi.useFakeTimers();
        vi.setSystemTime(wed);

        expect(computeHabitStreak(habit(), completions)).toBe(3);

        vi.useRealTimers();
    });

    it("skips inactive custom days without breaking streak", () => {
        const completions: Record<string, HabitCompletions> = {
            [getMondayOfWeek(new Date(2026, 5, 18, 12, 0, 0))]: {
                h1: { ...ALL_DAYS_FALSE, mon: true, wed: true },
            },
        };

        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 5, 18, 12, 0, 0)); // Thu

        const streak = computeHabitStreak(
            habit({ frequency: "custom", customDays: ["mon", "wed"] }),
            completions
        );
        expect(streak).toBe(2);

        vi.useRealTimers();
    });

    it("detects weekday-only habits", () => {
        expect(isHabitActiveOnDay(habit({ frequency: "weekdays" }), "sat")).toBe(false);
        expect(isHabitActiveOnDay(habit({ frequency: "weekdays" }), "fri")).toBe(true);
    });
});
