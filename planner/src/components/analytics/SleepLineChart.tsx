import { useScheduleStore, DAY_KEYS } from "../../store/useScheduleStore";
import type { DayKey } from "../../store/useScheduleStore";
import { computeSchedule } from "../../engine/computeSchedule";
import { getDateForDayKeyInWeek } from "../../utils/dateUtils";
import { getTotalSleepDurationMins } from "../../utils/sleepUtils";

function getSleepHours(dayKey: DayKey, weekKey: string): number {
    const week = useScheduleStore.getState().week;
    const day = week[dayKey];
    const refDate = getDateForDayKeyInWeek(dayKey, weekKey);
    const { sleepTime, totalNapMins } = computeSchedule(day, [], { referenceDate: refDate });
    return getTotalSleepDurationMins(day, sleepTime, totalNapMins) / 60;
}

export default function SleepLineChart() {
    const { week, currentWeekKey, browsingWeekKey } = useScheduleStore();
    const weekKey = browsingWeekKey || currentWeekKey;
    const labels = ["M", "T", "W", "T", "F", "S", "S"];
    
    const data = DAY_KEYS.map(d => getSleepHours(d, weekKey));
    const target = week.mon.sleepTarget / 60; // Assume uniform target
    
    // Chart dimensions
    const W = 320;
    const H = 140;
    const padX = 30;
    const padY = 20;
    const chartW = W - padX * 2;
    const chartH = H - padY * 2;
    
    const maxY = Math.max(10, ...data, target + 1);
    const minY = 0;
    
    const getX = (i: number) => padX + (i / 6) * chartW;
    const getY = (v: number) => padY + chartH - ((v - minY) / (maxY - minY)) * chartH;
    
    // Build line path
    const points = data.map((v, i) => `${getX(i)},${getY(v)}`).join(" ");
    
    // Area fill path
    const areaPath = `M ${getX(0)},${getY(data[0])} ` +
        data.map((v, i) => `L ${getX(i)},${getY(v)}`).join(" ") +
        ` L ${getX(6)},${getY(0)} L ${getX(0)},${getY(0)} Z`;

    // Target line
    const targetY = getY(target);

    // Average
    const avg = data.reduce((a, b) => a + b, 0) / 7;

    return (
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
            
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-zinc-300">Sleep Trend</h3>
                <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest">
                    <span className="flex items-center gap-1.5">
                        <span className="w-3 h-0.5 bg-blue-400 rounded-full inline-block" />
                        <span className="text-zinc-500">Actual</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-3 h-0.5 bg-zinc-600 rounded-full inline-block border-t border-dashed border-zinc-600" />
                        <span className="text-zinc-500">Target ({target}h)</span>
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl font-black text-white">{avg.toFixed(1)}h</span>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">avg / night</span>
            </div>

            <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 160 }}>
                <defs>
                    <linearGradient id="sleepGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* Y-axis grid lines */}
                {[2, 4, 6, 8, 10].filter(v => v <= maxY).map(v => (
                    <g key={v}>
                        <line x1={padX} y1={getY(v)} x2={W - padX} y2={getY(v)} stroke="#27272a" strokeWidth="0.5" />
                        <text x={padX - 5} y={getY(v) + 3} textAnchor="end" fill="#52525b" fontSize="8" fontWeight="bold">{v}</text>
                    </g>
                ))}

                {/* Target line */}
                <line x1={padX} y1={targetY} x2={W - padX} y2={targetY} stroke="#52525b" strokeWidth="1" strokeDasharray="4,4" />

                {/* Area fill */}
                <path d={areaPath} fill="url(#sleepGradient)" />

                {/* Line */}
                <polyline
                    points={points}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="drop-shadow-[0_0_6px_rgba(59,130,246,0.5)]"
                />

                {/* Data points */}
                {data.map((v, i) => (
                    <g key={i}>
                        <circle cx={getX(i)} cy={getY(v)} r="4" fill={v >= target ? "#22c55e" : "#f59e0b"} stroke="#09090b" strokeWidth="2" />
                        <text x={getX(i)} y={getY(v) - 10} textAnchor="middle" fill="#a1a1aa" fontSize="8" fontWeight="bold">
                            {v.toFixed(1)}
                        </text>
                    </g>
                ))}

                {/* X-axis labels */}
                {labels.map((l, i) => (
                    <text key={i} x={getX(i)} y={H - 4} textAnchor="middle" fill="#71717a" fontSize="9" fontWeight="bold">
                        {l}
                    </text>
                ))}
            </svg>
        </div>
    );
}
