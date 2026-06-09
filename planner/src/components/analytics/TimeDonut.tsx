import { useScheduleStore } from "../../store/useScheduleStore";
import { computeSchedule } from "../../engine/computeSchedule";
import { getDateForDayKey } from "../../utils/dateUtils";

const CATEGORY_COLORS: Record<string, string> = {
    work: "#6366f1",
    routine: "#71717a",
    health: "#22c55e",
    gym: "#22c55e",
    gaming: "#ef4444",
    val: "#ef4444",
    study: "#8b5cf6",
    aim: "#8b5cf6",
    sleep: "#3b82f6",
    nap: "#3b82f6",
    free: "#a1a1aa",
    travel: "#f59e0b",
    swim: "#06b6d4",
    family: "#f97316",
    hobby: "#ec4899",
};

const CATEGORY_LABELS: Record<string, string> = {
    work: "Deep Work",
    routine: "Routine",
    health: "Exercise",
    gym: "Exercise",
    gaming: "Gaming",
    val: "Gaming",
    study: "Learning",
    aim: "Learning",
    free: "Free",
    travel: "Travel",
    swim: "Swimming",
    family: "Family",
    hobby: "Hobby",
    nap: "Nap",
    sleep: "Sleep",
};

export default function TimeDonut() {
    const { selectedDay, week } = useScheduleStore();
    const day = week[selectedDay];
    const refDate = getDateForDayKey(selectedDay);
    const { scheduled } = computeSchedule(day, [], { referenceDate: refDate });

    // Aggregate durations by category
    const cats: Record<string, number> = {};
    let totalMins = 0;
    for (const block of scheduled) {
        if (block.type === "free" && block.virtual) continue; // skip gap blocks
        const key = block.type;
        cats[key] = (cats[key] || 0) + block.dur;
        totalMins += block.dur;
    }

    if (totalMins === 0) {
        return (
            <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />
                <h3 className="text-sm font-bold text-zinc-300 mb-4">Time Distribution</h3>
                <div className="text-zinc-600 text-sm text-center py-8">No blocks scheduled</div>
            </div>
        );
    }

    // Sort by duration descending
    const sorted = Object.entries(cats).sort((a, b) => b[1] - a[1]);

    // SVG donut
    const cx = 80, cy = 80, r = 60, strokeWidth = 18;
    const circumference = 2 * Math.PI * r;
    let offset = 0;

    // Productive hours (work, study, aim)
    const productiveMins = (cats["work"] || 0) + (cats["study"] || 0) + (cats["aim"] || 0);
    const productiveHours = (productiveMins / 60).toFixed(1);

    return (
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />
            
            <h3 className="text-sm font-bold text-zinc-300 mb-4">Time Distribution</h3>

            <div className="flex items-center gap-6">
                {/* Donut */}
                <div className="relative shrink-0">
                    <svg width="160" height="160" viewBox="0 0 160 160">
                        {/* Background circle */}
                        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1c1c1e" strokeWidth={strokeWidth} />
                        
                        {/* Segments */}
                        {sorted.map(([cat, mins]) => {
                            const pct = mins / totalMins;
                            const dashLength = pct * circumference;
                            const gap = circumference - dashLength;
                            const currentOffset = offset;
                            offset += dashLength;
                            
                            return (
                                <circle
                                    key={cat}
                                    cx={cx}
                                    cy={cy}
                                    r={r}
                                    fill="none"
                                    stroke={CATEGORY_COLORS[cat] || "#52525b"}
                                    strokeWidth={strokeWidth}
                                    strokeDasharray={`${dashLength} ${gap}`}
                                    strokeDashoffset={-currentOffset}
                                    transform={`rotate(-90 ${cx} ${cy})`}
                                    className="transition-all duration-700"
                                    strokeLinecap="butt"
                                />
                            );
                        })}
                    </svg>
                    
                    {/* Center text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="text-xl font-black text-white">{productiveHours}h</div>
                        <div className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider">Productive</div>
                    </div>
                </div>

                {/* Legend */}
                <div className="flex-1 space-y-1.5 min-w-0">
                    {sorted.slice(0, 6).map(([cat, mins]) => {
                        const pct = Math.round((mins / totalMins) * 100);
                        return (
                            <div key={cat} className="flex items-center gap-2 text-xs group/legend">
                                <div 
                                    className="w-2.5 h-2.5 rounded-full shrink-0 group-hover/legend:scale-125 transition-transform" 
                                    style={{ backgroundColor: CATEGORY_COLORS[cat] || "#52525b" }} 
                                />
                                <span className="text-zinc-400 truncate flex-1">{CATEGORY_LABELS[cat] || cat}</span>
                                <span className="text-zinc-500 font-bold tabular-nums shrink-0">{(mins / 60).toFixed(1)}h</span>
                                <span className="text-zinc-600 font-bold tabular-nums shrink-0 w-8 text-right">{pct}%</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
