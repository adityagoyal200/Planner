import { describe, expect, it } from "vitest";
import { resolvePreviousNightContext } from "./weekContext";
import type { DayData } from "../types/schedule";

function emptyDay(): DayData {
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
    };
}

describe("resolvePreviousNightContext", () => {
    it("uses previous week Sunday when viewing Monday", () => {
        const currentWeek = {
            mon: emptyDay(),
            tue: emptyDay(),
            wed: emptyDay(),
            thu: emptyDay(),
            fri: emptyDay(),
            sat: emptyDay(),
            sun: { ...emptyDay(), actualSleepTime: 1380 },
        };
        const prevWeek = {
            mon: emptyDay(),
            tue: emptyDay(),
            wed: emptyDay(),
            thu: emptyDay(),
            fri: emptyDay(),
            sat: emptyDay(),
            sun: { ...emptyDay(), actualSleepTime: 1410 },
        };

        const ctx = resolvePreviousNightContext(
            "mon",
            "2026-06-16",
            currentWeek,
            { "2026-06-09": prevWeek },
            []
        );

        expect(ctx.dayKey).toBe("sun");
        expect(ctx.weekKey).toBe("2026-06-09");
        expect(ctx.dayData?.actualSleepTime).toBe(1410);
    });
});
