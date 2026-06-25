import type { DayData } from "../types/schedule";
import type { DayKey } from "../store/useScheduleStore";

export interface TimeBudget {
    categoryId: string;
    minMins?: number;   // minimum minutes per week
    maxMins?: number;   // maximum minutes per week
    targetMins?: number; // ideal minutes per week
}

export interface BudgetStatus {
    categoryId: string;
    categoryName: string;
    emoji: string;
    spentMins: number;
    budget: TimeBudget;
    percentage: number;      // 0-1+ (can exceed 1 if over budget)
    status: "under" | "on_track" | "warning" | "over";
    debtMins: number;        // how many mins behind minimum (0 if met)
    surplusMins: number;     // how many mins ahead of target
}

/**
 * Compute how much time has been allocated (completed blocks) per category this week.
 */
export function computeCategorySpend(
    week: Record<DayKey, DayData>
): Record<string, number> {
    const spend: Record<string, number> = {};
    const dayKeys: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

    for (const dk of dayKeys) {
        for (const block of week[dk].blocks) {
            if (!block.on) continue;
            spend[block.type] = (spend[block.type] || 0) + block.dur;
        }
    }
    return spend;
}

/**
 * Compute budget status for each tracked category.
 */
export function computeBudgetStatuses(
    week: Record<DayKey, DayData>,
    budgets: TimeBudget[],
    categories: { id: string; name: string; emoji: string }[]
): BudgetStatus[] {
    const spend = computeCategorySpend(week);

    return budgets.map((budget) => {
        const cat = categories.find((c) => c.id === budget.categoryId);
        const spentMins = spend[budget.categoryId] || 0;
        const reference = budget.targetMins || budget.maxMins || budget.minMins || 60;
        const percentage = reference > 0 ? spentMins / reference : 0;

        let status: BudgetStatus["status"] = "on_track";
        if (budget.maxMins && spentMins > budget.maxMins) {
            status = "over";
        } else if (budget.maxMins && spentMins > budget.maxMins * 0.8) {
            status = "warning";
        } else if (budget.minMins && spentMins < budget.minMins * 0.5) {
            status = "under";
        }

        const debtMins = budget.minMins ? Math.max(0, budget.minMins - spentMins) : 0;
        const surplusMins = budget.targetMins
            ? Math.max(0, spentMins - budget.targetMins)
            : 0;

        return {
            categoryId: budget.categoryId,
            categoryName: cat?.name || budget.categoryId,
            emoji: cat?.emoji || "📦",
            spentMins,
            budget,
            percentage,
            status,
            debtMins,
            surplusMins,
        };
    });
}
