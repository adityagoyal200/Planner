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
}