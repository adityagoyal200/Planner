import { useScheduleStore } from "../../store/useScheduleStore";
import { getLevelInfo } from "../../engine/xpEngine";
import { computeWeeklyXpSummary } from "../../services/analyticsService";

export default function XPCard() {
    const { xp, streak, gamificationEnabled, week, streakFreezes, streakFreezeUsedThisWeek, currentWeekKey, browsingWeekKey } = useScheduleStore();
    
    if (!gamificationEnabled) return null;

    const weekXP = computeWeeklyXpSummary(week, streak, browsingWeekKey || currentWeekKey);
    const totalXP = xp;
    const info = getLevelInfo(totalXP);
    const weekXPLabel = weekXP.toLocaleString();

    // SVG arc for circular progress
    const size = 100;
    const strokeW = 8;
    const radius = (size - strokeW) / 2;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference * (1 - info.progress);

    return (
        <div className="glass-card rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
            
            {/* Ambient glow */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-amber-500/5 rounded-full blur-3xl group-hover:bg-amber-500/10 transition-all duration-1000" />

            <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10 text-center sm:text-left">
                {/* Circular Level Gauge */}
                <div className="relative shrink-0">
                    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                        {/* Background ring */}
                        <circle
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            fill="none"
                            stroke="#1c1c1e"
                            strokeWidth={strokeW}
                        />
                        {/* Progress ring */}
                        <circle
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            fill="none"
                            stroke="url(#xpGradient)"
                            strokeWidth={strokeW}
                            strokeDasharray={circumference}
                            strokeDashoffset={dashOffset}
                            strokeLinecap="round"
                            transform={`rotate(-90 ${size / 2} ${size / 2})`}
                            className="transition-all duration-1000 ease-out drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]"
                        />
                        <defs>
                            <linearGradient id="xpGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#f59e0b" />
                                <stop offset="100%" stopColor="#ef4444" />
                            </linearGradient>
                        </defs>
                    </svg>
                    {/* Level number inside circle */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="text-2xl font-black text-white">{info.level}</div>
                        <div className="text-[8px] uppercase font-bold tracking-widest text-zinc-500">Level</div>
                    </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="text-[10px] uppercase font-bold tracking-widest text-amber-500/70 mb-1">
                        {info.title}
                    </div>
                    
                    {/* XP Bar */}
                    <div className="mb-2">
                        <div className="flex justify-between items-baseline mb-1">
                            <span className="text-lg font-black text-white">{totalXP.toLocaleString()} XP</span>
                            <span className="text-[10px] font-bold text-zinc-600">{weekXPLabel} this week</span>
                        </div>
                        <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-gradient-to-r from-amber-500 to-red-500 rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(245,158,11,0.3)]"
                                style={{ width: `${info.progress * 100}%` }}
                            />
                        </div>
                    </div>

                    {/* Streak & Badges */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                            <span className="text-lg">🔥</span>
                            <span className="text-sm font-black text-white">{streak}</span>
                            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">day streak</span>
                        </div>
                        {streakFreezeUsedThisWeek && (
                            <div className="flex items-center gap-1">
                                <span className="text-xs">❄️</span>
                                <span className="text-[10px] font-bold text-cyan-500/70">Freeze used</span>
                            </div>
                        )}
                        {!streakFreezeUsedThisWeek && streakFreezes > 0 && (
                            <div className="flex items-center gap-1">
                                <span className="text-xs">❄️</span>
                                <span className="text-[10px] font-bold text-zinc-600">{streakFreezes} freeze</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
