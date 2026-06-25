import type { DayData } from "../types/schedule";
import type { DayKey, JournalEntry, HabitCompletions, Habit } from "../store/useScheduleStore";
import { computeSchedule } from "./computeSchedule";
import { getTotalSleepDurationMins } from "../utils/sleepUtils";

export interface LifeScoreBreakdown {
    sleep: number;         // 0-100
    completion: number;    // 0-100
    schedule: number;      // 0-100
    habits: number;        // 0-100
    mood: number;          // 0-100
    streak: number;        // 0-100
    overall: number;       // 0-100  (weighted composite)
}

const WEIGHTS = {
    sleep: 0.20,
    completion: 0.25,
    schedule: 0.15,
    habits: 0.15,
    mood: 0.15,
    streak: 0.10,
};

/**
 * Compute the "Life Score" — a single 0-100 composite metric.
 */
export function computeLifeScore(
    week: Record<DayKey, DayData>,
    journals: Record<DayKey, JournalEntry> | undefined,
    habits: Habit[],
    habitCompletions: HabitCompletions | undefined,
    streak: number,
    _weekKey: string
): LifeScoreBreakdown {
    const dayKeys: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

    // ── Sleep Score ──
    let sleepHits = 0;
    for (const dk of dayKeys) {
        const day = week[dk];
        const { sleepTime, totalNapMins } = computeSchedule(day);
        const totalSleep = getTotalSleepDurationMins(day, sleepTime, totalNapMins);
        const target = day.sleepTarget || 420;
        const ratio = Math.min(totalSleep / target, 1.3); // cap at 130%
        if (ratio >= 0.85) sleepHits++;
    }
    const sleepScore = Math.round((sleepHits / 7) * 100);

    // ── Block Completion Score ──
    let completedBlocks = 0;
    let totalBlocks = 0;
    for (const dk of dayKeys) {
        for (const block of week[dk].blocks) {
            if (!block.on) continue;
            totalBlocks++;
            if (block.completed) completedBlocks++;
        }
    }
    const completionScore = totalBlocks > 0
        ? Math.round((completedBlocks / totalBlocks) * 100)
        : 50; // neutral if no blocks

    // ── Schedule Adherence Score ──
    let adherenceCount = 0;
    let adherenceTotal = 0;
    for (const dk of dayKeys) {
        const result = computeSchedule(week[dk]);
        for (const sb of result.scheduled) {
            if (sb.virtual || !sb.on) continue;
            adherenceTotal++;
            if (sb.actualStart != null) {
                const diff = Math.abs(sb.start - sb.actualStart);
                if (diff <= 15) adherenceCount++; // within 15 min
                else if (diff <= 30) adherenceCount += 0.5;
            } else if (sb.completed) {
                adherenceCount += 0.7; // completed but no time data
            }
        }
    }
    const scheduleScore = adherenceTotal > 0
        ? Math.round((adherenceCount / adherenceTotal) * 100)
        : 50;

    // ── Habit Score ──
    let habitDone = 0;
    let habitTotal = 0;
    if (habits.length > 0 && habitCompletions) {
        for (const habit of habits) {
            for (const dk of dayKeys) {
                const isScheduled =
                    habit.frequency === "daily" ||
                    (habit.frequency === "weekdays" && !["sat", "sun"].includes(dk)) ||
                    (habit.frequency === "custom" && habit.customDays?.includes(dk));
                if (isScheduled) {
                    habitTotal++;
                    if (habitCompletions[habit.id]?.[dk]) habitDone++;
                }
            }
        }
    }
    const habitsScore = habitTotal > 0
        ? Math.round((habitDone / habitTotal) * 100)
        : 50;

    // ── Mood Score ──
    let moodSum = 0;
    let moodCount = 0;
    if (journals) {
        for (const dk of dayKeys) {
            const entry = journals[dk];
            if (entry?.mood != null) {
                moodSum += entry.mood;
                moodCount++;
            }
        }
    }
    const moodScore = moodCount > 0
        ? Math.round(((moodSum / moodCount) / 5) * 100)
        : 50;

    // ── Streak Score ──
    const streakScore = Math.min(100, Math.round((streak / 30) * 100)); // 30-day streak = 100%

    // ── Weighted Overall ──
    const overall = Math.round(
        WEIGHTS.sleep * sleepScore +
        WEIGHTS.completion * completionScore +
        WEIGHTS.schedule * scheduleScore +
        WEIGHTS.habits * habitsScore +
        WEIGHTS.mood * moodScore +
        WEIGHTS.streak * streakScore
    );

    return {
        sleep: sleepScore,
        completion: completionScore,
        schedule: scheduleScore,
        habits: habitsScore,
        mood: moodScore,
        streak: streakScore,
        overall: Math.max(0, Math.min(100, overall)),
    };
}

export function getLifeScoreColor(score: number): string {
    if (score >= 80) return "#10b981"; // emerald
    if (score >= 60) return "#6366f1"; // indigo
    if (score >= 40) return "#f59e0b"; // amber
    return "#ef4444"; // red
}

export function getLifeScoreLabel(score: number): string {
    if (score >= 90) return "Exceptional";
    if (score >= 80) return "Excellent";
    if (score >= 70) return "Great";
    if (score >= 60) return "Good";
    if (score >= 50) return "Okay";
    if (score >= 40) return "Needs Work";
    if (score >= 30) return "Struggling";
    return "Critical";
}
