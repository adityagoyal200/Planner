export type DurationDisplayUnit = "minutes" | "hours";

/** Blocks longer than 60 minutes always display in hours. */
export function getEffectiveDurationUnit(mins: number, unit: DurationDisplayUnit): DurationDisplayUnit {
    return mins > 60 ? "hours" : unit;
}

function formatHours(mins: number): string {
    const hours = mins / 60;
    if (Number.isInteger(hours)) return String(hours);
    const fixed = hours.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
    return fixed;
}

export function formatBlockDuration(mins: number, unit: DurationDisplayUnit): string {
    const effective = getEffectiveDurationUnit(mins, unit);
    if (effective === "minutes") return String(mins);
    return formatHours(mins);
}

export function getDurationSuffix(mins: number, unit: DurationDisplayUnit): string {
    return getEffectiveDurationUnit(mins, unit) === "minutes" ? "m" : "h";
}

export function formatBlockDurationLabel(mins: number, unit: DurationDisplayUnit): string {
    return `${formatBlockDuration(mins, unit)}${getDurationSuffix(mins, unit)}`;
}

/** Parse user input in the active display unit; returns minutes or null if invalid. */
export function parseBlockDurationInput(
    raw: string,
    unit: DurationDisplayUnit,
    currentMins?: number
): number | null {
    const trimmed = raw.trim();
    if (!trimmed) return null;

    const num = Number(trimmed);
    if (!Number.isFinite(num) || num <= 0) return null;

    const effective = currentMins != null ? getEffectiveDurationUnit(currentMins, unit) : unit;

    if (effective === "hours") {
        return Math.max(1, Math.round(num * 60));
    }

    if (!Number.isInteger(num)) return null;

    return num;
}
