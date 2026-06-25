import type { DayData } from "../types/schedule";
import type { DayKey, WeekSnapshot, Habit, HabitCompletions, JournalEntry } from "../store/useScheduleStore";
import { computeSchedule } from "./computeSchedule";
import { getTotalSleepDurationMins } from "../utils/sleepUtils";
import { computeLifeScore } from "./lifeScoreEngine";

export interface PersonalRecord {
    id: string;
    label: string;
    emoji: string;
    value: number;
    unit: string;
    weekKey: string;
    date: string;       // ISO date of when the record was set
}

/**
 * Compute personal records from current week + history.
 */
export function computePersonalRecords(
    currentWeek: Record<DayKey, DayData>,
    currentWeekKey: string,
    weekHistory: WeekSnapshot[],
    streak: number,
    journals: Record<string, Record<DayKey, JournalEntry>> | undefined,
    habits: Habit[],
    habitCompletionsByWeek: Record<string, HabitCompletions> | undefined,
): PersonalRecord[] {
    const records: PersonalRecord[] = [];
    const dayKeys: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
    const now = new Date().toISOString();

    // ── Longest Streak ──
    records.push({
        id: "longest_streak",
        label: "Longest Streak",
        emoji: "🔥",
        value: streak,
        unit: "days",
        weekKey: currentWeekKey,
        date: now,
    });

    // ── Best Day (highest block completion in a single day) ──
    let bestDayBlocks = 0;
    const allWeeks = [
        { key: currentWeekKey, data: currentWeek },
        ...weekHistory.map((s) => ({ key: s.weekKey, data: s.weekData })),
    ];

    for (const { data: weekData } of allWeeks) {
        if (!weekData) continue;
        for (const dk of dayKeys) {
            const day = weekData[dk];
            if (!day) continue;
            const completed = day.blocks.filter((b) => b.on && b.completed).length;
            if (completed > bestDayBlocks) bestDayBlocks = completed;
        }
    }
    records.push({
        id: "best_day_blocks",
        label: "Most Blocks in a Day",
        emoji: "⚡",
        value: bestDayBlocks,
        unit: "blocks",
        weekKey: currentWeekKey,
        date: now,
    });

    // ── Best Week Completion ──
    let bestWeekCompletion = 0;
    for (const snapshot of weekHistory) {
        if (snapshot.totalBlocks > 0) {
            const rate = Math.round((snapshot.completedBlocks / snapshot.totalBlocks) * 100);
            if (rate > bestWeekCompletion) bestWeekCompletion = rate;
        }
    }
    // Also check current week
    let currentCompleted = 0;
    let currentTotal = 0;
    for (const dk of dayKeys) {
        for (const b of currentWeek[dk].blocks) {
            if (!b.on) continue;
            currentTotal++;
            if (b.completed) currentCompleted++;
        }
    }
    if (currentTotal > 0) {
        const currentRate = Math.round((currentCompleted / currentTotal) * 100);
        if (currentRate > bestWeekCompletion) bestWeekCompletion = currentRate;
    }
    records.push({
        id: "best_week_completion",
        label: "Best Week Completion",
        emoji: "🏆",
        value: bestWeekCompletion,
        unit: "%",
        weekKey: currentWeekKey,
        date: now,
    });

    // ── Best Sleep Average ──
    let bestSleepAvg = 0;
    for (const { data: weekData } of allWeeks) {
        if (!weekData) continue;
        let totalSleep = 0;
        let sleepDays = 0;
        for (const dk of dayKeys) {
            const day = weekData[dk];
            if (!day) continue;
            const { sleepTime, totalNapMins } = computeSchedule(day);
            const sleepMins = getTotalSleepDurationMins(day, sleepTime, totalNapMins);
            if (sleepMins > 0) {
                totalSleep += sleepMins;
                sleepDays++;
            }
        }
        if (sleepDays > 0) {
            const avg = Math.round(totalSleep / sleepDays / 60 * 10) / 10;
            if (avg > bestSleepAvg) bestSleepAvg = avg;
        }
    }
    records.push({
        id: "best_sleep_avg",
        label: "Best Sleep Average",
        emoji: "😴",
        value: bestSleepAvg,
        unit: "h/night",
        weekKey: currentWeekKey,
        date: now,
    });

    // ── Highest Life Score ──
    let bestLifeScore = 0;
    const currentJournal = journals?.[currentWeekKey];
    const currentHabitCompletions = habitCompletionsByWeek?.[currentWeekKey];
    const currentLifeScore = computeLifeScore(
        currentWeek, currentJournal, habits, currentHabitCompletions, streak, currentWeekKey
    );
    if (currentLifeScore.overall > bestLifeScore) bestLifeScore = currentLifeScore.overall;

    for (const snapshot of weekHistory) {
        if (!snapshot.weekData) continue;
        const weekJournal = journals?.[snapshot.weekKey];
        const weekHabits = habitCompletionsByWeek?.[snapshot.weekKey];
        const ls = computeLifeScore(
            snapshot.weekData, weekJournal, habits, weekHabits, streak, snapshot.weekKey
        );
        if (ls.overall > bestLifeScore) bestLifeScore = ls.overall;
    }
    records.push({
        id: "best_life_score",
        label: "Highest Life Score",
        emoji: "🎯",
        value: bestLifeScore,
        unit: "pts",
        weekKey: currentWeekKey,
        date: now,
    });

    // ── Total XP Earned (sum from history) ──
    let totalXP = 0;
    for (const snapshot of weekHistory) {
        totalXP += snapshot.xpEarned || 0;
    }
    records.push({
        id: "total_xp_earned",
        label: "Total XP Earned",
        emoji: "✨",
        value: totalXP,
        unit: "XP",
        weekKey: currentWeekKey,
        date: now,
    });

    return records;
}
