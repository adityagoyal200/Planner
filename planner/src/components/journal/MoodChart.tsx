import { useScheduleStore, DAY_KEYS } from "../../store/useScheduleStore";

const MOOD_EMOJIS = ["", "😫", "😔", "😐", "🙂", "😊"];

export default function MoodChart() {
    const { journalsByWeek, selectedDay, currentWeekKey, browsingWeekKey } = useScheduleStore();
    const weekKey = browsingWeekKey || currentWeekKey;
    const journal = journalsByWeek[weekKey] || {};
    const labels = ["M", "T", "W", "T", "F", "S", "S"];

    const moodData = DAY_KEYS.map(d => journal?.[d]?.mood || 0);
    const energyData = DAY_KEYS.map(d => journal?.[d]?.energy || 0);

    const hasData = moodData.some(v => v > 0) || energyData.some(v => v > 0);

    if (!hasData) {
        return (
            <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />
                <h3 className="text-sm font-bold text-zinc-300 mb-4">Mood & Energy Trend</h3>
                <div className="text-zinc-600 text-sm text-center py-6">
                    Start logging your mood to see trends here
                </div>
            </div>
        );
    }

    // Chart dimensions
    const W = 320;
    const H = 120;
    const padX = 30;
    const padY = 15;
    const chartW = W - padX * 2;
    const chartH = H - padY * 2;

    const getX = (i: number) => padX + (i / 6) * chartW;
    const getY = (v: number) => v === 0 ? padY + chartH : padY + chartH - ((v - 1) / 4) * chartH;

    // Build mood line (only connect non-zero points)
    const moodPoints = moodData
        .map((v, i) => v > 0 ? `${getX(i)},${getY(v)}` : null)
        .filter(Boolean)
        .join(" ");

    const energyPoints = energyData
        .map((v, i) => v > 0 ? `${getX(i)},${getY(v)}` : null)
        .filter(Boolean)
        .join(" ");

    // Averages
    const validMoods = moodData.filter(v => v > 0);
    const validEnergy = energyData.filter(v => v > 0);
    const avgMood = validMoods.length > 0 ? validMoods.reduce((a, b) => a + b, 0) / validMoods.length : 0;
    const avgEnergy = validEnergy.length > 0 ? validEnergy.reduce((a, b) => a + b, 0) / validEnergy.length : 0;

    return (
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />
            
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-zinc-300">Mood & Energy Trend</h3>
                <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest">
                    <span className="flex items-center gap-1.5">
                        <span className="w-3 h-0.5 bg-purple-400 rounded-full inline-block" />
                        <span className="text-zinc-500">Mood</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-3 h-0.5 bg-amber-400 rounded-full inline-block" />
                        <span className="text-zinc-500">Energy</span>
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-4 mb-2">
                {avgMood > 0 && (
                    <div className="flex items-center gap-1.5">
                        <span className="text-lg">{MOOD_EMOJIS[Math.round(avgMood)]}</span>
                        <span className="text-xs font-bold text-zinc-500">avg mood</span>
                    </div>
                )}
                {avgEnergy > 0 && (
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs">⚡</span>
                        <span className="text-sm font-black text-amber-400">{avgEnergy.toFixed(1)}</span>
                        <span className="text-xs font-bold text-zinc-500">avg energy</span>
                    </div>
                )}
            </div>

            <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 140 }}>
                {/* Y-axis labels */}
                {[1, 2, 3, 4, 5].map(v => (
                    <g key={v}>
                        <line x1={padX} y1={getY(v)} x2={W - padX} y2={getY(v)} stroke="#1c1c1e" strokeWidth="0.5" />
                        <text x={padX - 5} y={getY(v) + 3} textAnchor="end" fill="#3f3f46" fontSize="8" fontWeight="bold">{v}</text>
                    </g>
                ))}

                {/* Energy line */}
                {energyPoints && (
                    <polyline
                        points={energyPoints}
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray="4,4"
                        opacity="0.6"
                    />
                )}

                {/* Mood line */}
                {moodPoints && (
                    <polyline
                        points={moodPoints}
                        fill="none"
                        stroke="#a855f7"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="drop-shadow-[0_0_6px_rgba(168,85,247,0.4)]"
                    />
                )}

                {/* Mood dots */}
                {moodData.map((v, i) => v > 0 && (
                    <circle key={`m-${i}`} cx={getX(i)} cy={getY(v)} r="4" fill="#a855f7" stroke="#09090b" strokeWidth="2" />
                ))}

                {/* Energy dots */}
                {energyData.map((v, i) => v > 0 && (
                    <circle key={`e-${i}`} cx={getX(i)} cy={getY(v)} r="3" fill="#f59e0b" stroke="#09090b" strokeWidth="1.5" />
                ))}

                {/* X-axis labels */}
                {labels.map((l, i) => (
                    <text key={i} x={getX(i)} y={H - 2} textAnchor="middle" fill={DAY_KEYS[i] === selectedDay ? "#fff" : "#52525b"} fontSize="9" fontWeight="bold">
                        {l}
                    </text>
                ))}
            </svg>
        </div>
    );
}
