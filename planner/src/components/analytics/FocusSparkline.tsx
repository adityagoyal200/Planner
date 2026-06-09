import { useScheduleStore, DAY_KEYS } from "../../store/useScheduleStore";

export default function FocusSparkline() {
    const { week } = useScheduleStore();
    
    // Compute deep work hours per day
    const deepWorkTypes = new Set(["work", "study", "aim"]);
    const data = DAY_KEYS.map(d => {
        let mins = 0;
        for (const b of week[d].blocks) {
            if (b.on && deepWorkTypes.has(b.type)) mins += b.dur;
        }
        return mins / 60;
    });

    const totalHours = data.reduce((a, b) => a + b, 0);
    const maxH = Math.max(1, ...data);

    // SVG sparkline
    const W = 200;
    const H = 40;
    const padX = 4;
    const chartW = W - padX * 2;

    const getX = (i: number) => padX + (i / 6) * chartW;
    const getY = (v: number) => H - 4 - (v / maxH) * (H - 8);

    const points = data.map((v, i) => `${getX(i)},${getY(v)}`).join(" ");
    const areaPath = `M ${getX(0)},${H} ` +
        data.map((v, i) => `L ${getX(i)},${getY(v)}`).join(" ") +
        ` L ${getX(6)},${H} Z`;

    return (
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
            
            <div className="flex items-center justify-between mb-3">
                <div>
                    <h3 className="text-sm font-bold text-zinc-300">Focus Hours</h3>
                    <div className="text-[10px] uppercase font-bold tracking-widest text-zinc-600 mt-0.5">
                        Deep Work · Study · Aim
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-black text-white">{totalHours.toFixed(1)}h</div>
                    <div className="text-[10px] uppercase font-bold tracking-widest text-zinc-600">this week</div>
                </div>
            </div>

            <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 50 }}>
                <defs>
                    <linearGradient id="focusGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                    </linearGradient>
                </defs>
                <path d={areaPath} fill="url(#focusGrad)" />
                <polyline
                    points={points}
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="drop-shadow-[0_0_4px_rgba(99,102,241,0.5)]"
                />
                {data.map((v, i) => (
                    <circle key={i} cx={getX(i)} cy={getY(v)} r="2.5" fill="#6366f1" stroke="#09090b" strokeWidth="1.5" />
                ))}
            </svg>

            {/* Day labels */}
            <div className="flex justify-between px-1 mt-1">
                {["M", "T", "W", "T", "F", "S", "S"].map((l, i) => (
                    <span key={i} className="text-[9px] font-bold text-zinc-700">{l}</span>
                ))}
            </div>
        </div>
    );
}
