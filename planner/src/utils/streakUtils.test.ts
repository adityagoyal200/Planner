import { describe, expect, it } from "vitest";
import { effectiveLastStreakDate, isStreakAtRisk, isStreakConsecutive } from "./streakUtils";

describe("streakUtils", () => {
    it("treats frozen days as skipped for consecutive check", () => {
        expect(isStreakConsecutive("2026-06-16", ["2026-06-17"], "2026-06-17")).toBe(true);
    });

    it("flags streak at risk when not completed today", () => {
        expect(isStreakAtRisk(3, "2026-06-16", [], "2026-06-17")).toBe(true);
        expect(isStreakAtRisk(3, "2026-06-17", [], "2026-06-17")).toBe(false);
    });

    it("walks back frozen dates for effective last streak date", () => {
        expect(effectiveLastStreakDate("2026-06-16", ["2026-06-16", "2026-06-15"])).toBe("2026-06-14");
    });
});
