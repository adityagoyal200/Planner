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

    it("preserves exact index position on source day and copies to target days relatively", () => {
        const week = emptyWeek();
        week.mon.blocks = [
            { id: "b0", type: "routine", label: "Morning Routine", dur: 30, on: true },
            { id: "b1", type: "work", label: "Important Meeting", dur: 60, on: true },
            { id: "b2", type: "health", label: "Gym Session", dur: 60, on: true }
        ];
        week.tue.blocks = [
            { id: "t0", type: "routine", label: "Morning Routine", dur: 30, on: true },
            { id: "t1", type: "free", label: "Free Space", dur: 60, on: true }
        ];

        const next = applyRecurrenceToWeek(week, "mon", "b1", "daily");

        // Source day should preserve index 1
        expect(next.mon.blocks[1].id).toBe("b1");
        expect(next.mon.blocks[1].recurrence).toBe("daily");

        // Target day (tue) should insert copied block at index 1
        expect(next.tue.blocks[1].label).toBe("Important Meeting");
        expect(next.tue.blocks[1].recurrenceGroupId).toBe("b1");
        expect(next.tue.blocks[0].id).toBe("t0");
        expect(next.tue.blocks[2].id).toBe("t1");
    });
});
