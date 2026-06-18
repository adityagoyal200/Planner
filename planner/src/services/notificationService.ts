import { useScheduleStore } from "../store/useScheduleStore";
import { computeSchedule } from "../engine/computeSchedule";
import { getDateForDayKeyInWeek } from "../utils/dateUtils";
import type { DayKey } from "../store/useScheduleStore";

const DAY_KEYS: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

let notificationInterval: ReturnType<typeof setInterval> | null = null;
let lastNotifiedBlockId: string | null = null;
let lastSleepNotified = false;
let lastStreakNotified = false;

export function isNotificationSupported(): boolean {
    return "Notification" in window;
}

export async function requestNotificationPermission(): Promise<boolean> {
    if (!isNotificationSupported()) return false;
    const result = await Notification.requestPermission();
    return result === "granted";
}

export function getNotificationPermission(): NotificationPermission | "unsupported" {
    if (!isNotificationSupported()) return "unsupported";
    return Notification.permission;
}

function showNotification(title: string, body: string, icon = "⏰") {
    if (Notification.permission !== "granted") return;
    try {
        new Notification(title, {
            body,
            icon: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">${icon}</text></svg>`,
            silent: false,
        });
    } catch {
        // Fallback: some browsers don't support Notification constructor in all contexts
    }
}

export function sendFocusTimerNotification() {
    const prefs = useScheduleStore.getState().notificationPrefs;
    if (!prefs.enabled || !prefs.focusTimerDone) return;
    showNotification("Focus Session Complete! 🎉", "Great work! Take a break or start your next task.", "✅");
}

function getTodayDayKey(): DayKey {
    const dayIndex = new Date().getDay(); // 0=Sun, 1=Mon, ...
    return DAY_KEYS[dayIndex === 0 ? 6 : dayIndex - 1];
}

function checkAndSendNotifications() {
    const state = useScheduleStore.getState();
    const prefs = state.notificationPrefs;

    if (!prefs.enabled || Notification.permission !== "granted") return;

    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const todayKey = getTodayDayKey();

    // Only send notifications for the current (non-browsing) week
    if (state.browsingWeekKey) return;

    const day = state.week[todayKey];
    if (!day) return;

    const weekKey = state.currentWeekKey;
    const refDate = getDateForDayKeyInWeek(todayKey, weekKey);
    const { scheduled, sleepTime } = computeSchedule(day, state.calendarEvents, { referenceDate: refDate });

    // 1. Block start reminders
    if (prefs.blockReminders) {
        const reminderWindow = prefs.reminderMinsBefore;
        for (const block of scheduled) {
            if (block.virtual || block.on === false) continue;
            const alertTime = block.start - reminderWindow;
            // Notify if we're within the 1-minute window of the alert time
            if (currentMins >= alertTime && currentMins < alertTime + 1 && lastNotifiedBlockId !== block.id) {
                const cat = state.categories.find(c => c.id === block.type);
                const emoji = cat?.emoji || "📋";
                showNotification(
                    `${emoji} ${block.label} starts in ${reminderWindow} min`,
                    `Duration: ${block.dur} minutes`,
                    emoji
                );
                lastNotifiedBlockId = block.id;
                break;
            }
        }
    }

    // 2. Sleep reminder (30 min before planned sleep)
    if (prefs.sleepReminder && !lastSleepNotified) {
        const sleepAlertTime = sleepTime - 30;
        if (currentMins >= sleepAlertTime && currentMins < sleepAlertTime + 1) {
            showNotification(
                "🛌 Time to wind down",
                "Bedtime is in 30 minutes. Start your wind-down routine.",
                "🌙"
            );
            lastSleepNotified = true;
        }
    }

    // 3. Streak at-risk alert (at 8 PM if no blocks completed today)
    if (prefs.streakAlert && !lastStreakNotified && state.streak > 0) {
        if (currentMins >= 1200 && currentMins < 1201) { // 8:00 PM
            const completedToday = day.blocks.filter(b => b.completed && b.on).length;
            if (completedToday === 0) {
                showNotification(
                    `🔥 ${state.streak}-day streak at risk!`,
                    "Complete at least one block today to keep your streak alive.",
                    "🔥"
                );
                lastStreakNotified = true;
            }
        }
    }
}

export function startNotificationScheduler() {
    stopNotificationScheduler();
    // Reset daily flags
    lastNotifiedBlockId = null;
    lastSleepNotified = false;
    lastStreakNotified = false;
    // Check every 30 seconds
    notificationInterval = setInterval(checkAndSendNotifications, 30_000);
    // Also check immediately
    checkAndSendNotifications();
}

export function stopNotificationScheduler() {
    if (notificationInterval) {
        clearInterval(notificationInterval);
        notificationInterval = null;
    }
}

// Reset daily flags at midnight
function scheduleMidnightReset() {
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 5);
    const msUntilMidnight = tomorrow.getTime() - now.getTime();

    setTimeout(() => {
        lastNotifiedBlockId = null;
        lastSleepNotified = false;
        lastStreakNotified = false;
        scheduleMidnightReset(); // reschedule for next midnight
    }, msUntilMidnight);
}

// Auto-start on import if enabled
scheduleMidnightReset();
