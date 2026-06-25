import { describe, expect, it } from "vitest";
import { applyRecurrenceToWeek, targetDaysForRecurrence } from "./recurringBlocks";
import type { DayData } from "../types/schedule";
import type { DayKey } from "../store/useScheduleStore";

function emptyDay(): DayData {
    return {
        wakeTime: 420,
        workStart: 0,
        sleepTarget: 480,
        commuteMins: 0,
        blocks: [],
        actualWakeTime: null,
        actualSleepTime: null,
        actualWakeDate: null,
        actualSleepDate: null,
    };
}

function emptyWeek(): Record<DayKey, DayData> {
    return {
        mon: emptyDay(),
        tue: emptyDay(),
        wed: emptyDay(),
        thu: emptyDay(),
        fri: emptyDay(),
        sat: emptyDay(),
        sun: emptyDay(),
    };
}

describe("recurringBlocks", () => {
    it("maps recurrence to target days", () => {
        expect(targetDaysForRecurrence("weekdays", "mon")).toHaveLength(5);
        expect(targetDaysForRecurrence("daily", "mon")).toHaveLength(7);
    });

    it("copies block to weekdays", () => {
        const week = emptyWeek();
        week.mon.blocks = [{ id: "b1", type: "focus", label: "Deep work", dur: 60, on: true }];
        const next = applyRecurrenceToWeek(week, "mon", "b1", "weekdays");
        expect(next.tue.blocks.some((b) => b.label === "Deep work")).toBe(true);
        expect(next.sat.blocks.some((b) => b.label === "Deep work")).toBe(false);
    });
});
