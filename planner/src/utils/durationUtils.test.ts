import { describe, expect, it } from "vitest";
import {
    formatBlockDuration,
    formatBlockDurationLabel,
    getDurationSuffix,
    parseBlockDurationInput,
} from "./durationUtils";

describe("durationUtils", () => {
    it("formats short blocks in the preferred unit", () => {
        expect(formatBlockDuration(45, "minutes")).toBe("45");
        expect(formatBlockDurationLabel(30, "minutes")).toBe("30m");
        expect(formatBlockDuration(30, "hours")).toBe("0.5");
        expect(formatBlockDurationLabel(30, "hours")).toBe("0.5h");
    });

    it("auto-formats blocks over 60 minutes as hours", () => {
        expect(formatBlockDuration(90, "minutes")).toBe("1.5");
        expect(formatBlockDuration(120, "minutes")).toBe("2");
        expect(formatBlockDurationLabel(90, "minutes")).toBe("1.5h");
        expect(getDurationSuffix(90, "minutes")).toBe("h");
        expect(getDurationSuffix(60, "minutes")).toBe("m");
    });

    it("parses minutes input for short blocks", () => {
        expect(parseBlockDurationInput("45", "minutes")).toBe(45);
        expect(parseBlockDurationInput("1.5", "minutes", 30)).toBeNull();
    });

    it("parses hours input for long blocks and hours mode", () => {
        expect(parseBlockDurationInput("1.5", "hours")).toBe(90);
        expect(parseBlockDurationInput("1", "hours")).toBe(60);
        expect(parseBlockDurationInput("1.5", "minutes", 90)).toBe(90);
        expect(parseBlockDurationInput("2", "minutes", 120)).toBe(120);
    });
});
