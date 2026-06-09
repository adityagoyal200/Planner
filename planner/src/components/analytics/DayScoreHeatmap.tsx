import { useScheduleStore, DAY_KEYS } from "../../store/useScheduleStore";
import { computeSchedule } from "../../engine/computeSchedule";

export default function DayScoreHeatmap() {
    const { week, selectedDay } = useScheduleStore();
    const labels = ["M", "T", "W", "T", "F", "S", "S"];

    const scores = DAY_KEYS.map(d => {
        const { dayScore } = computeSchedule(week[d]);
        return Math.round(dayScore);
    });

    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / 7);

    const getColor = (score: number) => {
        if (score >= 70) return { bg: "rgba(34,197,94,0.15)", border: "rgba(34,197,94,0.4)", text: "#22c55e", glow: "0 0 12px rgba(34,197,94,0.3)" };
        if (score >= 40) return { bg: "rgba(245,158,11,0.15)", border: "rgba(245,158,11,0.4)", text: "#f59e0b", glow: "0 0 12px rgba(245,158,11,0.3)" };
        return { bg: "rgba(239,68,68,0.15)", border: "rgba(239,68,68,0.4)", text: "#ef4444", glow: "0 0 12px rgba(239,68,68,0.3)" };
    };

    return (
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
            
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-zinc-300">Day Scores</h3>
                <div className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">
                    Week Avg: <span className="text-white">{avg}%</span>
                </div>
            </div>

            <div className="flex items-center justify-between gap-2">
                {DAY_KEYS.map((d, i) => {
                    const score = scores[i];
                    const colors = getColor(score);
                    const isSelected = selectedDay === d;

                    return (
                        <div key={d} className="flex flex-col items-center gap-2 flex-1">
                            <div 
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black transition-all duration-300 ${isSelected ? 'ring-2 ring-white/30 ring-offset-2 ring-offset-black scale-110' : 'hover:scale-105'}`}
                                style={{ 
                                    backgroundColor: colors.bg,
                                    border: `1.5px solid ${colors.border}`,
                                    color: colors.text,
                                    boxShadow: isSelected ? colors.glow : 'none',
                                }}
                            >
                                {score}
                            </div>
                            <span className={`text-[10px] font-bold ${isSelected ? 'text-white' : 'text-zinc-600'}`}>
                                {labels[i]}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
