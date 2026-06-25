import { useScheduleStore } from "../store/useScheduleStore";
import { getMondayOfWeek } from "../utils/dateUtils";

let rolloverTimeout: ReturnType<typeof setTimeout> | null = null;

/** Archive past week and start fresh when the calendar week advances. */
export function checkWeekRollover(): void {
    const state = useScheduleStore.getState();
    if (state.browsingWeekKey) return;

    const todayMondayKey = getMondayOfWeek();
    if (state.currentWeekKey < todayMondayKey) {
        state.startNewWeek();
    }
}

function scheduleMidnightRolloverCheck() {
    if (rolloverTimeout) clearTimeout(rolloverTimeout);

    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 10);
    const msUntilMidnight = tomorrow.getTime() - now.getTime();

    rolloverTimeout = setTimeout(() => {
        checkWeekRollover();
        scheduleMidnightRolloverCheck();
    }, msUntilMidnight);
}

export function startWeekRolloverScheduler() {
    checkWeekRollover();
    scheduleMidnightRolloverCheck();

    const onVisible = () => {
        if (document.visibilityState === "visible") {
            checkWeekRollover();
        }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
        document.removeEventListener("visibilitychange", onVisible);
        if (rolloverTimeout) {
            clearTimeout(rolloverTimeout);
            rolloverTimeout = null;
        }
    };
}
