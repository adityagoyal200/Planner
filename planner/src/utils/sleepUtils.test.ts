import { describe, expect, it } from "vitest";
import type { DayData } from "../types/schedule";
import { getNightSleepDurationMins, getTotalSleepDurationMins } from "./sleepUtils";

function day(overrides: Partial<DayData> = {}): DayData {
    return {
        wakeTime: 420,
        workStart: 0,
        sleepTarget: 420,
        commuteMins: 0,
        blocks: [],
        actualWakeTime: null,
        actualSleepTime: null,
        actualWakeDate: null,
        actualSleepDate: null,
        ...overrides,
    };
}

describe("sleepUtils", () => {
    it("computes planned night sleep from planned sleep time", () => {
        const mins = getNightSleepDurationMins(day(), 23 * 60);
        expect(mins).toBe(8 * 60);
    });

    it("computes actual night sleep using explicit dates", () => {
        const mins = getNightSleepDurationMins(day({
            actualWakeTime: 7 * 60,
            actualSleepTime: 23 * 60 + 30,
            actualWakeDate: "2026-06-17",
            actualSleepDate: "2026-06-16",
        }), 0);
        expect(mins).toBe(450);
    });

    it("falls back to inference when logged dates are inconsistent", () => {
        const mins = getNightSleepDurationMins(day({
            actualWakeTime: 7 * 60,
            actualSleepTime: 23 * 60 + 30,
            actualWakeDate: "2026-06-17",
            actualSleepDate: "2026-06-17",
        }), 0);
        expect(mins).toBe(450);
    });

    it("adds nap mins to total sleep", () => {
        const total = getTotalSleepDurationMins(day(), 23 * 60, 30);
        expect(total).toBe((8 * 60) + 30);
    });
});
