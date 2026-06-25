import { useScheduleStore } from "../../store/useScheduleStore";
import { computePersonalRecords } from "../../engine/personalRecordsEngine";
import { Trophy } from "lucide-react";

export default function PersonalRecords() {
    const {
        week,
        currentWeekKey,
        weekHistory,
        streak,
        journalsByWeek,
        habits,
        habitCompletionsByWeek,
    } = useScheduleStore();

    const records = computePersonalRecords(
        week,
        currentWeekKey,
        weekHistory,
        streak,
        journalsByWeek,
        habits,
        habitCompletionsByWeek
    );

    return (
        <div className="glass-card rounded-2xl p-5 border border-white/5 relative overflow-hidden group">
            <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-amber-500/5 blur-3xl group-hover:bg-amber-500/10 transition-all duration-700" />

            <div className="flex items-center justify-between mb-6 relative z-10">
                <div>
                    <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                        🏆 Personal Records Wall
                    </h3>
                    <p className="text-xs text-zinc-500 mt-0.5">Celebrate your achievements and push your high scores higher</p>
                </div>
                <Trophy className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 relative z-10">
                {records.map((rec) => (
                    <div
                        key={rec.id}
                        className="p-3.5 rounded-xl bg-white/[0.01] hover:bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all flex flex-col justify-between items-center text-center relative overflow-hidden group/card"
                    >
                        {/* Interactive mini glow */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/0 via-amber-500/0 to-amber-500/[0.02] opacity-0 group-hover/card:opacity-100 transition-opacity duration-500" />
                        
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-white/5 flex items-center justify-center text-xl shadow-inner mb-2.5 relative">
                            <span className="relative z-10">{rec.emoji}</span>
                            <div className="absolute inset-0 bg-amber-500/10 rounded-xl opacity-0 group-hover/card:opacity-100 blur-md transition-opacity duration-500" />
                        </div>
                        <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-tight mb-1 truncate w-full">
                            {rec.label}
                        </h4>
                        <div className="text-xl font-black text-white tracking-tight flex items-baseline gap-0.5 mb-1.5">
                            <span>{rec.value}</span>
                            <span className="text-[10px] text-zinc-500 font-bold uppercase">{rec.unit}</span>
                        </div>
                        <div className="text-[8px] font-bold text-zinc-600 uppercase tracking-wider">
                            {new Date(rec.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
