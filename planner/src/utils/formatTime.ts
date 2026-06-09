export function formatTime(mins: number) {
    const positiveMins = ((mins % 1440) + 1440) % 1440;
    const h = Math.floor(positiveMins / 60);
    const m = positiveMins % 60;

    const suffix = h >= 12 ? "pm" : "am";

    const hour12 =
        h % 12 === 0 ? 12 : h % 12;

    return `${hour12}:${m
        .toString()
        .padStart(2, "0")} ${suffix}`;
}