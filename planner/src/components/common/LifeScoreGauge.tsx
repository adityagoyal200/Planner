import { useScheduleStore } from "../../store/useScheduleStore";
import { computeLifeScore, getLifeScoreColor, getLifeScoreLabel } from "../../engine/lifeScoreEngine";
import { useSubscriptionStore } from "../../store/useSubscriptionStore";
import { Sparkles, Activity } from "lucide-react";

export default function LifeScoreGauge() {
    const { 
        week, 
        journalsByWeek, 
        habits, 
        habitCompletionsByWeek, 
        streak, 
        currentWeekKey, 
        browsingWeekKey 
    } = useScheduleStore();
    const canAccess = useSubscriptionStore((s) => s.canAccess("life_score_detail"));
    const openUpgradeModal = useSubscriptionStore((s) => s.openUpgradeModal);

    const weekKey = browsingWeekKey || currentWeekKey;
    const journals = journalsByWeek[weekKey];
    const habitCompletions = habitCompletionsByWeek[weekKey];

    const breakdown = computeLifeScore(
        week, 
        journals, 
        habits, 
        habitCompletions, 
        streak, 
        weekKey
    );

    const score = breakdown.overall;
    const color = getLifeScoreColor(score);
    const label = getLifeScoreLabel(score);

    // SVG arc details
    const radius = 40;
    const strokeWidth = 8;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
        <div className="glass-card rounded-2xl p-4 border border-white/5 relative overflow-hidden group">
            <div className="flex justify-between items-center mb-4">
                <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-indigo-400" /> Life Score
                </span>
                <span 
                    className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${color}15`, color }}
                >
                    {label}
                </span>
            </div>

            <div className="flex items-center gap-5">
                {/* SVG Gauge */}
                <div className="relative flex items-center justify-center shrink-0 w-24 h-24">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle
                            cx="48"
                            cy="48"
                            r={radius}
                            fill="transparent"
                            stroke="rgba(255,255,255,0.03)"
                            strokeWidth={strokeWidth}
                        />
                        <circle
                            cx="48"
                            cy="48"
                            r={radius}
                            fill="transparent"
                            stroke={color}
                            strokeWidth={strokeWidth}
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            className="transition-all duration-1000 ease-out"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-black text-white tracking-tighter">{score}</span>
                        <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest -mt-1">Points</span>
                    </div>
                </div>

                {/* Score Breakdown List */}
                <div className="flex-1 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                        <span>Category</span>
                        <span>Score</span>
                    </div>
                    {canAccess ? (
                        <div className="space-y-1">
                            <div className="flex justify-between text-[11px]">
                                <span className="text-zinc-500">Sleep Schedule</span>
                                <span className="font-bold tabular-nums text-white">{breakdown.sleep}%</span>
                            </div>
                            <div className="flex justify-between text-[11px]">
                                <span className="text-zinc-500">Block Completion</span>
                                <span className="font-bold tabular-nums text-white">{breakdown.completion}%</span>
                            </div>
                            <div className="flex justify-between text-[11px]">
                                <span className="text-zinc-500">Adherence to times</span>
                                <span className="font-bold tabular-nums text-white">{breakdown.schedule}%</span>
                            </div>
                            <div className="flex justify-between text-[11px]">
                                <span className="text-zinc-500">Habit Streaks</span>
                                <span className="font-bold tabular-nums text-white">{breakdown.habits}%</span>
                            </div>
                        </div>
                    ) : (
                        <div 
                            onClick={() => openUpgradeModal("life_score_detail")}
                            className="py-3 px-3.5 rounded-xl bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/10 cursor-pointer flex flex-col items-center text-center transition-all group"
                        >
                            <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                                <Sparkles className="w-3 h-3 animate-pulse" /> Unlock Breakdown
                            </span>
                            <span className="text-[8px] text-zinc-500 mt-0.5">Learn what is holding you back</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
