import type { Block } from "../types/block";
import type { DayData } from "../types/schedule";

type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export const COMMUTE_TO_ID = "commute-to";
export const COMMUTE_HOME_ID = "commute-home";

export function isCommuteBlockId(id: string): boolean {
    return id === COMMUTE_TO_ID || id === COMMUTE_HOME_ID;
}

export function createCommuteBlock(id: string, label: string, dur: number): Block {
    return { id, type: "travel", label, dur, on: true };
}

export function getCommuteMinsFromBlocks(blocks: Block[]): number {
    const to = blocks.find((b) => b.id === COMMUTE_TO_ID);
    const home = blocks.find((b) => b.id === COMMUTE_HOME_ID);
    return to?.dur ?? home?.dur ?? 0;
}

/** Insert or update commute blocks; remove them when mins is 0. */
export function applyCommuteMinsToDay(day: DayData, mins: number): DayData {
    if (mins <= 0) {
        return {
            ...day,
            commuteMins: 0,
            blocks: day.blocks.filter((b) => !isCommuteBlockId(b.id)),
        };
    }

    let blocks = [...day.blocks];
    let toIdx = blocks.findIndex((b) => b.id === COMMUTE_TO_ID);
    const workIdx = blocks.findIndex((b) => b.type === "work");

    if (toIdx < 0) {
        const insertAt = workIdx >= 0 ? workIdx : blocks.length;
        blocks.splice(insertAt, 0, createCommuteBlock(COMMUTE_TO_ID, "Commute To Work", mins));
        toIdx = insertAt;
    }

    let homeIdx = blocks.findIndex((b) => b.id === COMMUTE_HOME_ID);
    const workIdxAfter = blocks.findIndex((b) => b.type === "work");

    if (homeIdx < 0) {
        const insertAt = workIdxAfter >= 0 ? workIdxAfter + 1 : blocks.length;
        blocks.splice(insertAt, 0, createCommuteBlock(COMMUTE_HOME_ID, "Commute Home", mins));
    }

    blocks = blocks.map((b) =>
        isCommuteBlockId(b.id) ? { ...b, dur: mins, on: true } : b
    );

    return { ...day, commuteMins: mins, blocks };
}

/** Materialize legacy virtual-commute days into real blocks. */
export function ensureDayCommuteBlocks(day: DayData): DayData {
    const hasCommute = day.blocks.some((b) => isCommuteBlockId(b.id));

    if (hasCommute) {
        const mins = getCommuteMinsFromBlocks(day.blocks);
        return { ...day, commuteMins: mins || day.commuteMins };
    }

    if (day.commuteMins > 0) {
        let updated = applyCommuteMinsToDay(day, day.commuteMins);
        const hasWork = updated.blocks.some((b) => b.type === "work");
        if (!hasWork && updated.workStart > 0) {
            const toIdx = updated.blocks.findIndex((b) => b.id === COMMUTE_TO_ID);
            const insertAt = toIdx >= 0 ? toIdx + 1 : updated.blocks.length;
            const blocks = [...updated.blocks];
            blocks.splice(insertAt, 0, {
                id: "work",
                type: "work",
                label: "Work",
                dur: 8 * 60,
                on: true,
                actualStart: updated.workStart,
                actualStartDate: null,
            });
            updated = { ...updated, blocks };
        }
        return updated;
    }

    return day;
}

export function migrateWeekCommuteBlocks(week: Record<DayKey, DayData>): Record<DayKey, DayData> {
    const keys: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
    const migrated = {} as Record<DayKey, DayData>;
    for (const key of keys) {
        migrated[key] = ensureDayCommuteBlocks(week[key]);
    }
    return migrated;
}

export function applyWorkStartToDay(day: DayData, workStart: number): DayData {
    const blocks = day.blocks.map((b) =>
        b.type === "work"
            ? {
                  ...b,
                  actualStart: workStart > 0 ? workStart : null,
                  actualStartDate: null,
              }
            : b
    );
    return { ...day, workStart, blocks };
}

/** Keep commuteMins / workStart in sync after block edits. */
export function syncDayMetaFromBlocks(day: DayData): DayData {
    let updated = { ...day };

    if (day.blocks.some((b) => isCommuteBlockId(b.id))) {
        updated.commuteMins = getCommuteMinsFromBlocks(day.blocks);
    } else {
        updated.commuteMins = 0;
    }

    const work = day.blocks.find((b) => b.type === "work");
    if (work?.actualStart != null) {
        updated.workStart = work.actualStart;
    }

    return updated;
}

/** When one commute leg's duration changes, mirror it on the other leg. */
export function mirrorCommuteDuration(blocks: Block[], blockId: string, dur: number): Block[] {
    if (!isCommuteBlockId(blockId)) return blocks;
    return blocks.map((b) => (isCommuteBlockId(b.id) ? { ...b, dur } : b));
}
