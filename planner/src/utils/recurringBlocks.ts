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

    const sourceIdx = week[sourceDay].blocks.findIndex((b) => b.id === blockId);
    const groupId = source.recurrenceGroupId || source.id;
    const canonical: Block = {
        ...source,
        recurrence,
        recurrenceGroupId: groupId,
    };

    let draft = { ...week } as Record<DayKey, DayData>;
    
    for (const day of ALL_DAYS) {
        if (day === sourceDay) {
            // Keep in-place at the exact same index to prevent schedule disruptions
            const newBlocks = [...draft[day].blocks];
            newBlocks[sourceIdx] = canonical;
            draft[day] = {
                ...draft[day],
                blocks: newBlocks,
            };
        } else {
            // Filter out old copies of this recurrence group
            const filteredBlocks = draft[day].blocks.filter((b) => b.recurrenceGroupId !== groupId && b.id !== blockId);
            
            // Check if day is a target for this recurrence
            const targets = targetDaysForRecurrence(recurrence, sourceDay);
            if (targets.includes(day)) {
                const copy = cloneBlockForDay(canonical, groupId);
                
                // Insert copy at the same relative position (sourceIdx)
                const newBlocks = [...filteredBlocks];
                const insertPos = Math.min(sourceIdx, newBlocks.length);
                newBlocks.splice(insertPos, 0, copy);
                
                draft[day] = {
                    ...draft[day],
                    blocks: newBlocks,
                };
            } else {
                draft[day] = {
                    ...draft[day],
                    blocks: filteredBlocks,
                };
            }
        }
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
