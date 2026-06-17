import { useEffect } from "react";
import { useScheduleStore } from "../store/useScheduleStore";
import {
    initGoogleAuth,
    registerGoogleTokenListener,
    ensureGoogleAccessToken,
    fetchEventsForDateAuthenticated,
} from "../services/googleCalendar";
import { getDateForDayKeyInWeek } from "../utils/dateUtils";

const REFRESH_INTERVAL_MS = 45 * 60 * 1000;

async function syncCalendarEventsForSelectedDay() {
    const state = useScheduleStore.getState();
    if (!state.googleCalendarLinked) return;

    const date = getDateForDayKeyInWeek(
        state.selectedDay,
        state.browsingWeekKey || state.currentWeekKey
    );

    try {
        const events = await fetchEventsForDateAuthenticated(date);
        useScheduleStore.getState().setCalendarEvents(events);
    } catch (err) {
        console.error("Calendar auto-sync failed:", err);
    }
}

/**
 * Keeps Google Calendar connected across sessions via silent token refresh.
 */
export function useGoogleCalendarSession() {
    const googleCalendarLinked = useScheduleStore((s) => s.googleCalendarLinked);
    const selectedDay = useScheduleStore((s) => s.selectedDay);
    const currentWeekKey = useScheduleStore((s) => s.currentWeekKey);
    const browsingWeekKey = useScheduleStore((s) => s.browsingWeekKey);

    useEffect(() => {
        let cancelled = false;
        let refreshTimer: ReturnType<typeof setInterval> | null = null;

        const unsubscribe = registerGoogleTokenListener((token) => {
            if (!cancelled) {
                useScheduleStore.getState().setGoogleToken(token);
            }
        });

        initGoogleAuth().then(async () => {
            if (cancelled) return;

            if (useScheduleStore.getState().googleCalendarLinked) {
                const token = await ensureGoogleAccessToken({ interactive: false });
                if (token && !cancelled) {
                    await syncCalendarEventsForSelectedDay();
                }
            }

            refreshTimer = setInterval(() => {
                if (useScheduleStore.getState().googleCalendarLinked) {
                    void ensureGoogleAccessToken({ interactive: false });
                }
            }, REFRESH_INTERVAL_MS);
        });

        return () => {
            cancelled = true;
            unsubscribe();
            if (refreshTimer) clearInterval(refreshTimer);
        };
    }, []);

    useEffect(() => {
        if (!googleCalendarLinked) return;
        void syncCalendarEventsForSelectedDay();
    }, [googleCalendarLinked, selectedDay, currentWeekKey, browsingWeekKey]);
}
