import { useScheduleStore } from "../../store/useScheduleStore";

export default function NewWeekBanner() {
    const { newWeekArchived, dismissNewWeekBanner } = useScheduleStore();

    if (!newWeekArchived) return null;

    const completionRate = newWeekArchived.totalBlocks > 0
        ? Math.round((newWeekArchived.completedBlocks / newWeekArchived.totalBlocks) * 100)
        : 0;

    return (
        <div className="mb-6 glass-card rounded-2xl p-5 relative overflow-hidden group border border-indigo-500/20 animate-in slide-in-from-top-4 duration-500">
            {/* Top gradient */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-500/5 rounded-full blur-3xl" />

            <div className="relative z-10">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">🎉</span>
                            <h3 className="text-sm font-black text-white uppercase tracking-wider">
                                New Week Started!
                            </h3>
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                            <span className="text-white font-bold">{newWeekArchived.weekLabel}</span> was archived automatically.
                        </p>

                        {/* Stats row */}
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs">✅</span>
                                <span className="text-xs font-bold text-zinc-300">
                                    {newWeekArchived.completedBlocks}/{newWeekArchived.totalBlocks} blocks
                                </span>
                                <span className="text-[10px] font-bold text-zinc-600">({completionRate}%)</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs">⚡</span>
                                <span className="text-xs font-bold text-amber-400">{newWeekArchived.xpEarned} XP</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs">😴</span>
                                <span className="text-xs font-bold text-zinc-300">{newWeekArchived.avgSleepHours}h avg</span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={dismissNewWeekBanner}
                        className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer shrink-0"
                        title="Dismiss"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
