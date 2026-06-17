import type { CalendarEvent } from "../services/googleCalendar";

export interface BlockCategory {
    id: string;
    name: string;
    emoji: string;
    bg: string;
}

export type BlockType = string;

export interface Block {
    id: string;
    type: BlockType; 
    label: string;
    dur: number;
    on: boolean;
    locked?: boolean;
    note?: string;
    actualStart?: number | null;
    actualStartDate?: string | null;  // ISO date string e.g. "2026-06-09"
    completed?: boolean;
}

export interface CalendarOverlap {
    id: string;
    title: string;
    startMins: number;
    endMins: number;
    color: string;
    originalEvent: CalendarEvent;
}

export type ScheduledBlock = Omit<Block, "on"> & {
    on?: boolean;
    start: number;
    end: number;
    virtual?: boolean;
    carryOver?: boolean;
    carryFromDay?: string;
    source?: "google";
    color?: string;
    originalEvent?: CalendarEvent;
    overlappingEvents?: CalendarOverlap[];
    allDay?: boolean;
};
