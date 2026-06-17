function padDatePart(value: number): string {
    return value.toString().padStart(2, "0");
}

export function toLocalISODate(date: Date = new Date()): string {
    return [
        date.getFullYear(),
        padDatePart(date.getMonth() + 1),
        padDatePart(date.getDate()),
    ].join("-");
}

export function parseISODate(date: string): Date {
    const [year, month, day] = date.split("-").map(Number);
    return new Date(year, month - 1, day);
}

export function addDaysToISODate(date: string, days: number): string {
    const result = parseISODate(date);
    result.setDate(result.getDate() + days);
    return toLocalISODate(result);
}

export function getDateForDayKey(dayKey: string): string {
    const days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
    const targetDayIdx = days.indexOf(dayKey);
    const monday = parseISODate(getMondayOfWeek());
    monday.setDate(monday.getDate() + targetDayIdx);
    return toLocalISODate(monday);
}

export function getDateForDayKeyInWeek(dayKey: string, mondayKey: string): string {
    const days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
    const targetDayIdx = days.indexOf(dayKey);
    const monday = parseISODate(mondayKey);
    monday.setDate(monday.getDate() + targetDayIdx);
    return toLocalISODate(monday);
}

export function getDaysDiff(date1: string, date2: string): number {
    const d1 = parseISODate(date1);
    const d2 = parseISODate(date2);
    return Math.round((d1.getTime() - d2.getTime()) / 86400000);
}

/** Returns the Monday ISO date string for the week containing the given date. */
export function getMondayOfWeek(date: Date = new Date()): string {
    const d = new Date(date);
    const dayOfWeek = d.getDay(); // 0=Sun, 1=Mon...6=Sat
    const diff = (dayOfWeek + 6) % 7; // days since Monday
    d.setDate(d.getDate() - diff);
    return toLocalISODate(d);
}

/** Returns a formatted label for a week key, e.g. "Jun 9 – Jun 15, 2026". */
export function getWeekLabel(mondayKey: string): string {
    const mon = parseISODate(mondayKey);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return `${fmt(mon)} – ${fmt(sun)}, ${sun.getFullYear()}`;
}

/** Shifts a Monday week key by N weeks (positive = forward, negative = back). */
export function addWeeksToMondayKey(mondayKey: string, weeks: number): string {
    const d = parseISODate(mondayKey);
    d.setDate(d.getDate() + weeks * 7);
    return toLocalISODate(d);
}
