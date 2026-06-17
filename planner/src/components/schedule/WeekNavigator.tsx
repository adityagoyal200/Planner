import { ChevronLeft, ChevronRight } from "lucide-react";
import { useScheduleStore } from "../../store/useScheduleStore";
import { getWeekLabel } from "../../utils/dateUtils";

export default function WeekNavigator() {
    const { currentWeekKey, browsingWeekKey, navigateWeek, jumpToCurrentWeek } = useScheduleStore();
    const isViewingCurrent = !browsingWeekKey;
    const viewedKey = browsingWeekKey || currentWeekKey;
    const label = getWeekLabel(viewedKey);

    return (
        <div className="flex items-center justify-between glass-card rounded-2xl px-4 py-3 mb-6 relative overflow-hidden group">
            {/* Ambient glow */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            {!isViewingCurrent && (
                <div className="absolute inset-0 bg-amber-500/[0.02] pointer-events-none" />
            )}

            {/* Left: Prev button */}
            <button
                onClick={() => navigateWeek('prev')}
                className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-all duration-200 cursor-pointer active:scale-95"
                title="Previous week"
            >
                <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Center: Week label + badge */}
            <div className="flex items-center gap-3 select-none">
                {!isViewingCurrent && (
                    <span className="text-[9px] uppercase font-black tracking-widest text-amber-500/80 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 animate-in fade-in slide-in-from-left-2 duration-300">
                        Past
                    </span>
                )}
                <span className="text-sm font-bold text-white tracking-tight">
                    {label}
                </span>
                {isViewingCurrent && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)] animate-pulse" />
                )}
            </div>

            {/* Right: Next or "This Week" */}
            <div className="flex items-center gap-2">
                {!isViewingCurrent && (
                    <button
                        onClick={jumpToCurrentWeek}
                        className="text-[10px] uppercase font-black tracking-widest text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full border border-white/10 transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 animate-in fade-in slide-in-from-right-2 duration-300"
                    >
                        This Week
                    </button>
                )}
                <button
                    onClick={() => navigateWeek('next')}
                    disabled={isViewingCurrent}
                    className={`p-2 rounded-xl transition-all duration-200 cursor-pointer active:scale-95 ${
                        isViewingCurrent
                            ? 'text-zinc-700 cursor-not-allowed'
                            : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                    }`}
                    title="Next week"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
