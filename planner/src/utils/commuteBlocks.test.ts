import { describe, expect, it } from "vitest";
import {
    applyCommuteMinsToDay,
    COMMUTE_HOME_ID,
    COMMUTE_TO_ID,
    ensureDayCommuteBlocks,
    getCommuteMinsFromBlocks,
    mirrorCommuteDuration,
} from "./commuteBlocks";
import type { DayData } from "../types/schedule";

function day(overrides: Partial<DayData> = {}): DayData {
    return {
        wakeTime: 420,
        workStart: 540,
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

describe("commuteBlocks", () => {
    it("materializes commute blocks from commuteMins", () => {
        const result = ensureDayCommuteBlocks(day({ commuteMins: 30 }));
        expect(result.blocks.some((b) => b.id === COMMUTE_TO_ID)).toBe(true);
        expect(result.blocks.some((b) => b.id === COMMUTE_HOME_ID)).toBe(true);
        expect(result.blocks.some((b) => b.type === "work")).toBe(true);
    });

    it("removes commute blocks when mins set to 0", () => {
        const withCommute = applyCommuteMinsToDay(day(), 30);
        const cleared = applyCommuteMinsToDay(withCommute, 0);
        expect(cleared.blocks.find((b) => b.id === COMMUTE_TO_ID)).toBeUndefined();
        expect(cleared.commuteMins).toBe(0);
    });

    it("mirrors duration across both commute legs", () => {
        const blocks = mirrorCommuteDuration(
            [
                { id: COMMUTE_TO_ID, type: "travel", label: "To", dur: 30, on: true },
                { id: COMMUTE_HOME_ID, type: "travel", label: "Home", dur: 30, on: true },
            ],
            COMMUTE_TO_ID,
            45
        );
        expect(getCommuteMinsFromBlocks(blocks)).toBe(45);
    });
});
