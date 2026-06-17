export function minsToTimeStr(mins: number): string {
    const positiveMins = ((mins % 1440) + 1440) % 1440;
    const h = Math.floor(positiveMins / 60);
    const m = positiveMins % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

export function parseTimeInput(timeStr: string, maxHour = 47): number | null {
    const trimmed = timeStr.trim();
    if (!trimmed) return null;

    const match = /^(\d{1,2})(?::(\d{1,2}))?$/.exec(trimmed);
    if (!match) return null;

    const hours = Number(match[1]);
    const minutes = match[2] === undefined ? 0 : Number(match[2]);

    if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;
    if (hours < 0 || hours > maxHour || minutes < 0 || minutes > 59) return null;

    return hours * 60 + minutes;
}
