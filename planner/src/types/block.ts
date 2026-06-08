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
}