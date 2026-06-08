export function formatTime(mins: number) {
    const h = Math.floor(mins / 60) % 24;
    const m = mins % 60;

    const suffix = h >= 12 ? "pm" : "am";

    const hour12 =
        h % 12 === 0 ? 12 : h % 12;

    return `${hour12}:${m
        .toString()
        .padStart(2, "0")} ${suffix}`;
}