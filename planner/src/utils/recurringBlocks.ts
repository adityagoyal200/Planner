import { nanoid } from "nanoid";
import type { Block, BlockRecurrence } from "../types/block";
import type { DayKey } from "../store/useScheduleStore";
import type { DayData } from "../types/schedule";

export const WEEKDAYS: DayKey[] = ["mon", "tue", "wed", "thu", "fri"];
export const ALL_DAYS: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

export function targetDaysForRecurrence(recurrence: BlockRecurrence, sourceDay: DayKey): DayKey[] {
    if (recurrence === "none") return [sourceDay];
    if (recurrence === "daily") return ALL_DAYS;
    if (recurrence === "weekdays") return WEEKDAYS;
    return [sourceDay];
}

export function cloneBlockForDay(block: Block, groupId: string): Block {
    return {
        ...block,
        id: nanoid(),
        recurrenceGroupId: groupId,
        completed: false,
        actualStart: null,
        actualStartDate: null,
        subtasks: block.subtasks?.map((s) => ({ ...s, id: nanoid(), done: false })),
    };
}

export function stripRecurrenceCopies(week: Record<DayKey, { blocks: Block[] }>, groupId: string): Record<DayKey, { blocks: Block[] }> {
    const next = {} as Record<DayKey, { blocks: Block[] }>;
    for (const day of ALL_DAYS) {
        next[day] = {
            blocks: week[day].blocks.filter((b) => b.recurrenceGroupId !== groupId),
        };
    }
    return next;
}

export function applyRecurrenceToWeek(
    week: Record<DayKey, DayData>,
    sourceDay: DayKey,
    blockId: string,
    recurrence: BlockRecurrence
): Record<DayKey, DayData> {
    const source = week[sourceDay].blocks.find((b) => b.id === blockId);
    if (!source) return week;

    const groupId = source.recurrenceGroupId || source.id;
    const canonical: Block = {
        ...source,
        recurrence,
        recurrenceGroupId: groupId,
    };

    let draft = { ...week } as Record<DayKey, DayData>;
    for (const day of ALL_DAYS) {
        draft[day] = {
            ...draft[day],
            blocks: draft[day].blocks.filter((b) => b.recurrenceGroupId !== groupId && b.id !== blockId),
        };
    }

    const targets = targetDaysForRecurrence(recurrence, sourceDay);
    for (const day of targets) {
        const copy = day === sourceDay ? canonical : cloneBlockForDay(canonical, groupId);
        draft[day] = {
            ...draft[day],
            blocks: [...draft[day].blocks, copy],
        };
    }

    return draft;
}

export function cloneBlocksForTemplate(blocks: Block[]): Block[] {
    return blocks.map((b) => ({
        ...b,
        id: nanoid(),
        completed: false,
        actualStart: null,
        actualStartDate: null,
        recurrenceGroupId: b.recurrenceGroupId,
        subtasks: b.subtasks?.map((s) => ({ ...s, id: nanoid(), done: false })),
    }));
}
