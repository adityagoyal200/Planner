import type { DayData } from "../types/schedule";
import type { DayKey } from "../store/useScheduleStore";
import { addWeeksToMondayKey, getDateForDayKeyInWeek } from "./dateUtils";

const DAY_KEYS: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

export interface WeekDayContext {
    dayKey: DayKey;
    weekKey: string;
    refDate: string;
    dayData: DayData | undefined;
}

/** Resolve a day in a viewed week, including previous week's Sunday when on Monday. */
export function resolvePreviousNightContext(
    selectedDay: DayKey,
    viewedWeekKey: string,
    currentWeek: Record<DayKey, DayData>,
    weeks: Record<string, Record<DayKey, DayData>>,
    weekHistory: { weekKey: string; weekData: Record<DayKey, DayData> }[]
): WeekDayContext {
    const idx = DAY_KEYS.indexOf(selectedDay);
    let dayKey = DAY_KEYS[(idx - 1 + 7) % 7];
    let weekKey = viewedWeekKey;

    if (selectedDay === "mon") {
        weekKey = addWeeksToMondayKey(viewedWeekKey, -1);
        dayKey = "sun";
    }

    let dayData: DayData | undefined = weekKey === viewedWeekKey ? currentWeek[dayKey] : weeks[weekKey]?.[dayKey];
    if (!dayData) {
        const hist = weekHistory.find((s) => s.weekKey === weekKey);
        dayData = hist?.weekData[dayKey];
    }

    return {
        dayKey,
        weekKey,
        refDate: getDateForDayKeyInWeek(dayKey, weekKey),
        dayData,
    };
}
