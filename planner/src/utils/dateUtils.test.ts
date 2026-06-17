import { describe, expect, it } from "vitest";
import { addDaysToISODate, getDateForDayKeyInWeek, getDaysDiff, getMondayOfWeek } from "./dateUtils";

describe("dateUtils", () => {
    it("returns monday for a given date", () => {
        const monday = getMondayOfWeek(new Date("2026-06-17T10:00:00"));
        expect(monday).toBe("2026-06-15");
    });

    it("maps day key inside a specific week key", () => {
        expect(getDateForDayKeyInWeek("mon", "2026-06-15")).toBe("2026-06-15");
        expect(getDateForDayKeyInWeek("sun", "2026-06-15")).toBe("2026-06-21");
    });

    it("adds days and computes date diffs", () => {
        expect(addDaysToISODate("2026-06-15", 2)).toBe("2026-06-17");
        expect(getDaysDiff("2026-06-21", "2026-06-15")).toBe(6);
    });
});
