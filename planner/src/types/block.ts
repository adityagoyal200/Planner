export type BlockType =
    | "routine"
    | "travel"
    | "swim"
    | "gym"
    | "dsa"
    | "north"
    | "cook"
    | "family"
    | "aim"
    | "val"
    | "work"
    | "nap"
    | "free";

export interface Block {
    id: string;
    type: BlockType;
    label: string;
    dur: number;
    on: boolean;
    locked?: boolean;
    note?: string;
}