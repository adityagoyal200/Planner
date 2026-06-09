import { useScheduleStore } from "../../store/useScheduleStore";
import { generateInsights } from "../../engine/insightsEngine";

export default function InsightsPanel() {
    const { week, streak } = useScheduleStore();
    const insights = generateInsights(week, streak);

    if (insights.length === 0) return null;

    const accentColors = {
        positive: { border: "border-emerald-500/30", bg: "bg-emerald-500/5", bar: "bg-emerald-500", text: "text-emerald-400" },
        neutral: { border: "border-zinc-700/50", bg: "bg-zinc-900/30", bar: "bg-zinc-500", text: "text-zinc-300" },
        warning: { border: "border-amber-500/30", bg: "bg-amber-500/5", bar: "bg-amber-500", text: "text-amber-400" },
    };

    return (
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
            
            <div className="flex items-center gap-2 mb-4">
                <span className="text-sm">💡</span>
                <h3 className="text-sm font-bold text-zinc-300">Smart Insights</h3>
            </div>

            <div className="space-y-2.5">
                {insights.map((insight, i) => {
                    const colors = accentColors[insight.type];
                    return (
                        <div 
                            key={i} 
                            className={`flex items-start gap-3 p-3 rounded-xl border ${colors.border} ${colors.bg} transition-all hover:scale-[1.01]`}
                        >
                            <div className={`w-1 self-stretch rounded-full ${colors.bar} shrink-0`} />
                            <p className={`text-xs leading-relaxed font-medium ${colors.text}`}>
                                {insight.text}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
