import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
        const authPayload = {
            state: {
                user: { id: "e2e-user", email: "e2e@example.com", name: "E2E User", picture: "https://example.com/avatar.png" },
                session: { user: { id: "e2e-user", email: "e2e@example.com", user_metadata: { full_name: "E2E User", avatar_url: "https://example.com/avatar.png" } } },
            },
            version: 0,
        };

        const currentWeekKey = "2026-06-15";
        const week = {
            mon: { wakeTime: 420, workStart: 0, sleepTarget: 420, commuteMins: 0, blocks: [], actualWakeTime: 420, actualSleepTime: 1410, actualWakeDate: "2026-06-16", actualSleepDate: "2026-06-15" },
            tue: { wakeTime: 420, workStart: 0, sleepTarget: 420, commuteMins: 0, blocks: [], actualWakeTime: null, actualSleepTime: null, actualWakeDate: null, actualSleepDate: null },
            wed: { wakeTime: 420, workStart: 0, sleepTarget: 420, commuteMins: 0, blocks: [], actualWakeTime: null, actualSleepTime: null, actualWakeDate: null, actualSleepDate: null },
            thu: { wakeTime: 420, workStart: 0, sleepTarget: 420, commuteMins: 0, blocks: [], actualWakeTime: null, actualSleepTime: null, actualWakeDate: null, actualSleepDate: null },
            fri: { wakeTime: 420, workStart: 0, sleepTarget: 420, commuteMins: 0, blocks: [], actualWakeTime: null, actualSleepTime: null, actualWakeDate: null, actualSleepDate: null },
            sat: { wakeTime: 420, workStart: 0, sleepTarget: 420, commuteMins: 0, blocks: [], actualWakeTime: null, actualSleepTime: null, actualWakeDate: null, actualSleepDate: null },
            sun: { wakeTime: 420, workStart: 0, sleepTarget: 420, commuteMins: 0, blocks: [], actualWakeTime: null, actualSleepTime: null, actualWakeDate: null, actualSleepDate: null },
        };

        const plannerPayload = {
            state: {
                selectedDay: "mon",
                currentTab: "schedule",
                week,
                weeks: { [currentWeekKey]: week },
                currentWeekKey,
                browsingWeekKey: null,
                journalsByWeek: { [currentWeekKey]: { mon: { mood: null, energy: null, intention: "", reflection: "", gratitude: [] } } },
            },
            version: 0,
        };

        localStorage.setItem("planner-auth", JSON.stringify(authPayload));
        localStorage.setItem("planner-storage", JSON.stringify(plannerPayload));
    });
});

test("sleep card renders a sane number", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Last Night's Sleep")).toBeVisible();
    await expect(page.getByText(/h/)).toBeVisible();
});

