import { useScheduleStore } from "../../store/useScheduleStore";

export default function WeeklyHistory() {
    const { weekHistory, viewWeekByKey, categories } = useScheduleStore();

    if (!weekHistory || weekHistory.length === 0) {
        return null;
    }

    // Sort history from newest to oldest
    const sortedHistory = [...weekHistory].sort((a, b) => new Date(b.dateArchived).getTime() - new Date(a.dateArchived).getTime());

    return (
        <div className="space-y-4">
            <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest pl-2">
                Past Weeks
            </h2>
            
            {sortedHistory.map((snapshot) => {
                const completionRate = snapshot.totalBlocks > 0
                    ? Math.round((snapshot.completedBlocks / snapshot.totalBlocks) * 100)
                    : 0;

                // Build top categories from breakdown
                const catEntries = Object.entries(snapshot.categoryBreakdown)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 4);

                // SVG ring for completion
                const ringSize = 48;
                const ringStroke = 4;
                const ringRadius = (ringSize - ringStroke) / 2;
                const ringCircumference = 2 * Math.PI * ringRadius;
                const ringOffset = ringCircumference * (1 - completionRate / 100);

                return (
                    <div key={snapshot.id} className="glass-card rounded-2xl p-5 relative overflow-hidden group border border-zinc-800/30 hover:border-zinc-700/50 transition-all duration-300">
                        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-zinc-500/20 to-transparent" />
                        <div className="absolute -right-12 -top-12 w-28 h-28 bg-indigo-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        
                        <div className="flex gap-4 relative z-10">
                            {/* Completion ring */}
                            <div className="relative shrink-0">
                                <svg width={ringSize} height={ringSize} viewBox={`0 0 ${ringSize} ${ringSize}`}>
                                    <circle
                                        cx={ringSize / 2} cy={ringSize / 2} r={ringRadius}
                                        fill="none" stroke="#1c1c1e" strokeWidth={ringStroke}
                                    />
                                    <circle
                                        cx={ringSize / 2} cy={ringSize / 2} r={ringRadius}
                                        fill="none"
                                        stroke={completionRate >= 80 ? '#10b981' : completionRate >= 50 ? '#f59e0b' : '#ef4444'}
                                        strokeWidth={ringStroke}
                                        strokeDasharray={ringCircumference}
                                        strokeDashoffset={ringOffset}
                                        strokeLinecap="round"
                                        transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
                                        className="transition-all duration-1000 ease-out"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-xs font-black text-white">{completionRate}%</span>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-sm font-bold text-zinc-200 truncate">
                                        {snapshot.weekLabel}
                                    </h3>
                                    <button
                                        onClick={() => viewWeekByKey(snapshot.weekKey)}
                                        className="text-[9px] uppercase font-black tracking-widest text-indigo-400 hover:text-white bg-indigo-500/10 hover:bg-indigo-500/30 px-2.5 py-1 rounded-full border border-indigo-500/20 transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 shrink-0 ml-2"
                                    >
                                        View
                                    </button>
                                </div>

                                {/* Stats row */}
                                <div className="flex items-center gap-3 mb-3 flex-wrap">
                                    <div className="flex items-center gap-1">
                                        <span className="text-[10px]">✅</span>
                                        <span className="text-[10px] font-bold text-zinc-400">
                                            {snapshot.completedBlocks ?? 0}/{snapshot.totalBlocks ?? 0}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="text-[10px]">⚡</span>
                                        <span className="text-[10px] font-bold text-amber-400">
                                            {snapshot.xpEarned ?? 0} XP
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="text-[10px]">😴</span>
                                        <span className="text-[10px] font-bold text-zinc-400">
                                            {snapshot.avgSleepHours}h avg
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="text-[10px]">📊</span>
                                        <span className="text-[10px] font-bold text-zinc-400">
                                            {snapshot.dayScore}%
                                        </span>
                                    </div>
                                </div>

                                {/* Category breakdown pills */}
                                {catEntries.length > 0 && (
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        {catEntries.map(([catId, mins]) => {
                                            const cat = categories.find(c => c.id === catId);
                                            const hours = (mins / 60).toFixed(1);
                                            return (
                                                <span
                                                    key={catId}
                                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-900/50 border border-zinc-800/50 text-[9px] font-bold text-zinc-400"
                                                >
                                                    <span>{cat?.emoji || '📦'}</span>
                                                    <span>{hours}h</span>
                                                </span>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
