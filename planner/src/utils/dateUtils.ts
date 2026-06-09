export function getDateForDayKey(dayKey: string): string {
    const days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
    const now = new Date();
    const currentDayIdx = (now.getDay() + 6) % 7; 
    const targetDayIdx = days.indexOf(dayKey);
    
    const diff = targetDayIdx - currentDayIdx;
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + diff);
    
    return targetDate.toISOString().split("T")[0];
}

export function getDaysDiff(date1: string, date2: string): number {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    // Reset times to midnight to avoid DST issues
    d1.setHours(0, 0, 0, 0);
    d2.setHours(0, 0, 0, 0);
    return Math.round((d1.getTime() - d2.getTime()) / 86400000);
}
