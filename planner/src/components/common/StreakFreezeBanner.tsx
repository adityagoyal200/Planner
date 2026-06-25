import { useScheduleStore } from "../../store/useScheduleStore";
import { isStreakAtRisk } from "../../utils/streakUtils";

export default function StreakFreezeBanner() {
    const {
        streak,
        lastCompletedDate,
        streakFrozenDates,
        streakFreezes,
        streakFreezeUsedThisWeek,
        gamificationEnabled,
        useStreakFreeze,
    } = useScheduleStore();

    if (!gamificationEnabled) return null;
    if (!isStreakAtRisk(streak, lastCompletedDate, streakFrozenDates)) return null;
    if (streakFreezes <= 0 || streakFreezeUsedThisWeek) return null;

    return (
        <div className="mb-4 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-cyan-300 flex items-center gap-2">
                    <span>❄️</span>
                    Streak at risk
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                    Your {streak}-day streak will break unless you complete a block today or use a freeze.
                </p>
            </div>
            <button
                type="button"
                onClick={() => useStreakFreeze()}
                className="shrink-0 px-4 py-2 rounded-xl bg-cyan-500 text-black text-xs font-bold hover:bg-cyan-400 transition-colors cursor-pointer"
            >
                Use streak freeze
            </button>
        </div>
    );
}
