import { describe, expect, it } from "vitest";
import type { DayData } from "../types/schedule";
import { computeSchedule } from "./computeSchedule";

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

describe("computeSchedule", () => {
    it("counts only nap blocks in totalNapMins", () => {
        const result = computeSchedule(day({
            blocks: [
                { id: "a", type: "nap", label: "Nap", dur: 30, on: true },
                { id: "b", type: "sleep", label: "Sleep block", dur: 120, on: true },
            ],
        }), [], { referenceDate: "2026-06-17" });

        expect(result.totalNapMins).toBe(30);
    });

    it("exports carry-over blocks that pass midnight", () => {
        const result = computeSchedule(day({
            wakeTime: 22 * 60,
            blocks: [{ id: "late", type: "study", label: "Late Study", dur: 180, on: true }],
        }), [], { referenceDate: "2026-06-17" });

        expect(result.carryOverForNextDay.length).toBe(1);
        expect(result.carryOverForNextDay[0].id).toBe("late");
        expect(result.carryOverForNextDay[0].end).toBeGreaterThan(1440);
    });

    it("schedules commute as regular blocks in timeline order", () => {
        const result = computeSchedule(day({
            workStart: 9 * 60,
            commuteMins: 15,
            blocks: [
                { id: "commute-to", type: "travel", label: "Commute To Work", dur: 15, on: true },
                { id: "work", type: "work", label: "Work", dur: 8 * 60, on: true, actualStart: 9 * 60 },
                { id: "commute-home", type: "travel", label: "Commute Home", dur: 15, on: true },
            ],
        }), [], { referenceDate: "2026-06-17" });

        const toWork = result.scheduled.find((b) => b.id === "commute-to");
        const home = result.scheduled.find((b) => b.id === "commute-home");

        expect(toWork?.dur).toBe(15);
        expect(home?.dur).toBe(15);
        expect(toWork?.virtual).toBeFalsy();
        expect(home?.virtual).toBeFalsy();
        expect(toWork?.start).toBe(420);
        expect(toWork?.end).toBe(435);
    });
});
