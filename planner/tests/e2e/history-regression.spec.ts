import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
        const authPayload = {
            state: {
                user: {
                    id: "e2e-user",
                    email: "e2e@example.com",
                    name: "E2E User",
                    picture: "https://example.com/avatar.png",
                },
                session: { user: { id: "e2e-user", email: "e2e@example.com", user_metadata: { full_name: "E2E User", avatar_url: "https://example.com/avatar.png" } } },
            },
            version: 0,
        };

        const currentWeekKey = "2026-06-15";
        const prevWeekKey = "2026-06-08";
        const week = {
            mon: { wakeTime: 420, workStart: 0, sleepTarget: 420, commuteMins: 0, blocks: [], actualWakeTime: null, actualSleepTime: null, actualWakeDate: null, actualSleepDate: null },
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
                currentTab: "journal",
                week,
                weeks: {
                    [currentWeekKey]: week,
                    [prevWeekKey]: week,
                },
                currentWeekKey,
                browsingWeekKey: null,
                journalsByWeek: {
                    [currentWeekKey]: {
                        mon: { mood: 5, energy: 4, intention: "Current week intention", reflection: "", gratitude: [] },
                        tue: { mood: null, energy: null, intention: "", reflection: "", gratitude: [] },
                        wed: { mood: null, energy: null, intention: "", reflection: "", gratitude: [] },
                        thu: { mood: null, energy: null, intention: "", reflection: "", gratitude: [] },
                        fri: { mood: null, energy: null, intention: "", reflection: "", gratitude: [] },
                        sat: { mood: null, energy: null, intention: "", reflection: "", gratitude: [] },
                        sun: { mood: null, energy: null, intention: "", reflection: "", gratitude: [] },
                    },
                    [prevWeekKey]: {
                        mon: { mood: 2, energy: 2, intention: "Previous week intention", reflection: "", gratitude: [] },
                        tue: { mood: null, energy: null, intention: "", reflection: "", gratitude: [] },
                        wed: { mood: null, energy: null, intention: "", reflection: "", gratitude: [] },
                        thu: { mood: null, energy: null, intention: "", reflection: "", gratitude: [] },
                        fri: { mood: null, energy: null, intention: "", reflection: "", gratitude: [] },
                        sat: { mood: null, energy: null, intention: "", reflection: "", gratitude: [] },
                        sun: { mood: null, energy: null, intention: "", reflection: "", gratitude: [] },
                    },
                },
            },
            version: 0,
        };

        localStorage.setItem("planner-auth", JSON.stringify(authPayload));
        localStorage.setItem("planner-storage", JSON.stringify(plannerPayload));
    });
});

test("shows previous-week journal entries after week navigation", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Journal" })).toBeVisible();
    await expect(page.getByDisplayValue("Current week intention")).toBeVisible();

    await page.getByTitle("Previous week").click();
    await expect(page.getByDisplayValue("Previous week intention")).toBeVisible();
});

test("week navigator is visible on analytics tab", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /analytics/i }).click();
    await expect(page.getByRole("heading", { name: "Analytics" })).toBeVisible();
    await expect(page.getByTitle("Previous week")).toBeVisible();
    await expect(page.getByTitle("Next week")).toBeVisible();
});
