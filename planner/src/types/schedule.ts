import type { Block } from "./block";
export interface DayData {
    wakeTime: number;
    workStart: number;
    sleepTarget: number;
    commuteMins: number;
    blocks: Block[];
}