import { useScheduleStore } from "../../store/useScheduleStore";

export default function ReflectionEditor() {
    const { selectedDay, journalsByWeek, currentWeekKey, browsingWeekKey, updateJournal } = useScheduleStore();
    const weekKey = browsingWeekKey || currentWeekKey;
    const journal = journalsByWeek[weekKey] || {};
    const entry = journal?.[selectedDay] || { mood: null, energy: null, intention: "", reflection: "", gratitude: [] };

    const gratitude = entry.gratitude || [];

    const updateGratitude = (index: number, value: string) => {
        const updated = [...gratitude];
        updated[index] = value;
        updateJournal(selectedDay, { gratitude: updated });
    };

    const addGratitude = () => {
        updateJournal(selectedDay, { gratitude: [...gratitude, ""] });
    };

    return (
        <div className="space-y-5">
            {/* Morning Intention */}
            <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm">🌅</span>
                    <h3 className="text-sm font-bold text-zinc-300">Morning Intention</h3>
                </div>
                <textarea
                    value={entry.intention}
                    onChange={(e) => updateJournal(selectedDay, { intention: e.target.value })}
                    placeholder="What's your #1 priority today?"
                    className="w-full bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-3 text-sm text-zinc-300 placeholder:text-zinc-700 focus:outline-none focus:border-zinc-600 resize-none h-20 leading-relaxed transition-colors"
                />
            </div>

            {/* Evening Reflection */}
            <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm">🌙</span>
                    <h3 className="text-sm font-bold text-zinc-300">Evening Reflection</h3>
                </div>
                <textarea
                    value={entry.reflection}
                    onChange={(e) => updateJournal(selectedDay, { reflection: e.target.value })}
                    placeholder="What went well today? What would you change?"
                    className="w-full bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-3 text-sm text-zinc-300 placeholder:text-zinc-700 focus:outline-none focus:border-zinc-600 resize-none h-24 leading-relaxed transition-colors"
                />
            </div>

            {/* Gratitude */}
            <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <span className="text-sm">🙏</span>
                        <h3 className="text-sm font-bold text-zinc-300">Gratitude</h3>
                    </div>
                    {gratitude.length < 5 && (
                        <button
                            onClick={addGratitude}
                            className="text-[10px] font-bold text-zinc-500 hover:text-emerald-400 uppercase tracking-widest transition-colors bg-zinc-900 hover:bg-emerald-950 px-2 py-1 rounded-md cursor-pointer"
                        >
                            + Add
                        </button>
                    )}
                </div>
                
                <div className="space-y-2">
                    {gratitude.length === 0 && (
                        <button
                            onClick={addGratitude}
                            className="w-full p-3 rounded-xl border border-dashed border-zinc-800 text-sm text-zinc-600 hover:text-zinc-400 hover:border-zinc-600 transition-colors cursor-pointer"
                        >
                            + Something you're grateful for today...
                        </button>
                    )}
                    {gratitude.map((g, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <span className="text-emerald-500/50 text-xs">✦</span>
                            <input
                                type="text"
                                value={g}
                                onChange={(e) => updateGratitude(i, e.target.value)}
                                placeholder="Something you're grateful for..."
                                className="flex-1 bg-zinc-900/50 border border-zinc-800/50 rounded-lg px-3 py-2 text-sm text-zinc-300 placeholder:text-zinc-700 focus:outline-none focus:border-zinc-600 transition-colors"
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
