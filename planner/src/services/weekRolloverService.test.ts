import { describe, expect, it, vi, beforeEach } from "vitest";
import { useScheduleStore } from "../store/useScheduleStore";
import { checkWeekRollover } from "./weekRolloverService";

describe("weekRolloverService", () => {
    beforeEach(() => {
        useScheduleStore.setState({
            currentWeekKey: "2026-06-09",
            browsingWeekKey: null,
        });
    });

    it("starts a new week when calendar week has advanced", () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-06-17T08:00:00"));

        const before = useScheduleStore.getState().currentWeekKey;
        checkWeekRollover();
        const after = useScheduleStore.getState().currentWeekKey;

        expect(before).toBe("2026-06-09");
        expect(after).toBe("2026-06-15");

        vi.useRealTimers();
    });

    it("does not roll over while browsing history", () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-06-17T08:00:00"));
        useScheduleStore.setState({ browsingWeekKey: "2026-06-09" });

        const before = useScheduleStore.getState().currentWeekKey;
        checkWeekRollover();
        expect(useScheduleStore.getState().currentWeekKey).toBe(before);

        vi.useRealTimers();
    });
});
