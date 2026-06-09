import { useScheduleStore } from "../../store/useScheduleStore";
import { DAY_KEYS } from "../../store/useScheduleStore";

const MOODS = [
    { value: 5, emoji: "😊", label: "Great" },
    { value: 4, emoji: "🙂", label: "Good" },
    { value: 3, emoji: "😐", label: "Okay" },
    { value: 2, emoji: "😔", label: "Low" },
    { value: 1, emoji: "😫", label: "Awful" },
];

const ENERGY_LEVELS = [1, 2, 3, 4, 5];

export default function MoodLogger() {
    const { selectedDay, journal, updateJournal } = useScheduleStore();
    const entry = journal?.[selectedDay] || { mood: null, energy: null, intention: "", reflection: "", gratitude: [] };

    return (
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />
            
            <h3 className="text-sm font-bold text-zinc-300 mb-4">How are you feeling?</h3>

            {/* Mood Selector */}
            <div className="flex items-center justify-between gap-2 mb-6">
                {MOODS.map((m) => (
                    <button
                        key={m.value}
                        onClick={() => updateJournal(selectedDay, { mood: entry.mood === m.value ? null : m.value })}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all duration-300 flex-1 cursor-pointer ${
                            entry.mood === m.value
                                ? "bg-purple-500/10 border-purple-500/40 scale-105 shadow-lg shadow-purple-500/10"
                                : "border-zinc-800/50 hover:border-zinc-700 hover:bg-zinc-900/50"
                        }`}
                    >
                        <span className={`text-2xl transition-transform duration-200 ${entry.mood === m.value ? 'scale-125' : ''}`}>
                            {m.emoji}
                        </span>
                        <span className={`text-[9px] font-bold uppercase tracking-widest ${entry.mood === m.value ? 'text-purple-400' : 'text-zinc-600'}`}>
                            {m.label}
                        </span>
                    </button>
                ))}
            </div>

            {/* Energy Level */}
            <div className="mb-2">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-zinc-400">Energy Level</span>
                    <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                        {entry.energy ? `${entry.energy}/5` : "Not set"}
                    </span>
                </div>
                <div className="flex gap-2">
                    {ENERGY_LEVELS.map((level) => (
                        <button
                            key={level}
                            onClick={() => updateJournal(selectedDay, { energy: entry.energy === level ? null : level })}
                            className={`flex-1 h-8 rounded-lg border text-sm font-black transition-all duration-300 cursor-pointer ${
                                entry.energy !== null && entry.energy >= level
                                    ? "bg-amber-500/20 border-amber-500/40 text-amber-400"
                                    : "border-zinc-800/50 text-zinc-700 hover:border-zinc-700"
                            }`}
                        >
                            ⚡
                        </button>
                    ))}
                </div>
            </div>

            {/* Mood Trend Mini */}
            <div className="mt-4 pt-4 border-t border-zinc-800/50">
                <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2">This Week's Mood</div>
                <div className="flex items-end gap-1 h-8">
                    {DAY_KEYS.map((d) => {
                        const dayMood = journal?.[d]?.mood;
                        const height = dayMood ? (dayMood / 5) * 100 : 10;
                        const isSelected = d === selectedDay;
                        return (
                            <div 
                                key={d} 
                                className={`flex-1 rounded-t-sm transition-all duration-300 ${
                                    dayMood 
                                        ? dayMood >= 4 ? 'bg-emerald-500/40' : dayMood >= 3 ? 'bg-amber-500/40' : 'bg-red-500/40'
                                        : 'bg-zinc-900'
                                } ${isSelected ? 'ring-1 ring-white/20' : ''}`}
                                style={{ height: `${height}%` }}
                                title={`${d}: ${dayMood ? MOODS.find(m => m.value === dayMood)?.label : 'Not logged'}`}
                            />
                        );
                    })}
                </div>
                <div className="flex justify-between mt-1">
                    {["M", "T", "W", "T", "F", "S", "S"].map((l, i) => (
                        <span key={i} className="text-[8px] font-bold text-zinc-700 flex-1 text-center">{l}</span>
                    ))}
                </div>
            </div>
        </div>
    );
}
