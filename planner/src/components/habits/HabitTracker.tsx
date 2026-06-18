import { useState } from "react";
import { nanoid } from "nanoid";
import { useScheduleStore, DAY_KEYS, type DayKey, type Habit } from "../../store/useScheduleStore";
import { getWeekLabel } from "../../utils/dateUtils";

const FREQUENCY_OPTIONS = [
    { id: "daily", label: "Every Day" },
    { id: "weekdays", label: "Weekdays" },
    { id: "custom", label: "Custom" },
] as const;

const DAY_LABELS: Record<DayKey, string> = {
    mon: "M", tue: "T", wed: "W", thu: "T", fri: "F", sat: "S", sun: "S"
};

const DAY_FULL_LABELS: Record<DayKey, string> = {
    mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun"
};

const HABIT_EMOJIS = ["💧", "🧘", "📖", "💊", "🏃", "🎯", "✍️", "🧹", "🌿", "😴", "🍎", "📵", "🎵", "🙏", "💡", "🧠"];

function isHabitActiveOnDay(habit: Habit, day: DayKey): boolean {
    if (habit.frequency === "daily") return true;
    if (habit.frequency === "weekdays") return ["mon", "tue", "wed", "thu", "fri"].includes(day);
    if (habit.frequency === "custom") return habit.customDays?.includes(day) ?? false;
    return false;
}

function computeHabitStreak(
    habit: Habit,
    habitCompletionsByWeek: Record<string, Record<string, Record<DayKey, boolean>>>,
    currentWeekKey: string
): number {
    // Simplified streak: count consecutive completed days going backwards from today
    const today = new Date();
    const todayDayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1;
    let streak = 0;

    // Check current week backwards from today
    for (let i = todayDayIndex; i >= 0; i--) {
        const dayKey = DAY_KEYS[i];
        if (!isHabitActiveOnDay(habit, dayKey)) continue;
        const weekCompletions = habitCompletionsByWeek[currentWeekKey];
        const done = weekCompletions?.[habit.id]?.[dayKey] ?? false;
        if (done) streak++;
        else break;
    }

    return streak;
}

export default function HabitTracker() {
    const {
        habits, addHabit, updateHabit, removeHabit,
        habitCompletionsByWeek, toggleHabitCompletion,
        currentWeekKey, browsingWeekKey, selectedDay,
    } = useScheduleStore();

    const weekKey = browsingWeekKey || currentWeekKey;
    const weekLabel = getWeekLabel(weekKey);
    const weekCompletions = habitCompletionsByWeek[weekKey] || {};
    const isReadOnly = !!browsingWeekKey;

    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formName, setFormName] = useState("");
    const [formEmoji, setFormEmoji] = useState("💧");
    const [formFreq, setFormFreq] = useState<"daily" | "weekdays" | "custom">("daily");
    const [formCustomDays, setFormCustomDays] = useState<DayKey[]>([]);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    const resetForm = () => {
        setFormName("");
        setFormEmoji("💧");
        setFormFreq("daily");
        setFormCustomDays([]);
        setShowEmojiPicker(false);
    };

    const handleSave = () => {
        if (!formName.trim()) return;
        if (editingId) {
            updateHabit(editingId, {
                name: formName.trim(),
                emoji: formEmoji,
                frequency: formFreq,
                customDays: formFreq === "custom" ? formCustomDays : undefined,
            });
            setEditingId(null);
        } else {
            addHabit({
                id: nanoid(),
                name: formName.trim(),
                emoji: formEmoji,
                frequency: formFreq,
                customDays: formFreq === "custom" ? formCustomDays : undefined,
                targetCount: 1,
                createdAt: new Date().toISOString(),
            });
            setIsAdding(false);
        }
        resetForm();
    };

    const startEdit = (habit: Habit) => {
        setEditingId(habit.id);
        setFormName(habit.name);
        setFormEmoji(habit.emoji);
        setFormFreq(habit.frequency);
        setFormCustomDays(habit.customDays || []);
        setIsAdding(false);
    };

    // Calculate weekly stats
    const totalPossible = habits.reduce((acc, habit) => {
        return acc + DAY_KEYS.filter(d => isHabitActiveOnDay(habit, d)).length;
    }, 0);
    const totalDone = habits.reduce((acc, habit) => {
        return acc + DAY_KEYS.filter(d => {
            if (!isHabitActiveOnDay(habit, d)) return false;
            return weekCompletions[habit.id]?.[d] ?? false;
        }).length;
    }, 0);
    const weeklyPct = totalPossible > 0 ? Math.round((totalDone / totalPossible) * 100) : 0;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="page-header mb-2">
                <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-500">
                    Habits
                </h1>
                <span className="page-header-sub text-[10px] uppercase font-bold tracking-widest text-zinc-600">
                    Daily Habits — {weekLabel}
                </span>
            </div>

            {/* Weekly Overview Card */}
            <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Weekly Completion</div>
                        <div className="text-3xl font-black text-white">{weeklyPct}<span className="text-xl text-zinc-600">%</span></div>
                    </div>
                    <div className="text-right">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Completed</div>
                        <div className="text-xl font-black text-zinc-300">{totalDone}<span className="text-sm text-zinc-600">/{totalPossible}</span></div>
                    </div>
                </div>
                <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-white/5">
                    <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${weeklyPct}%` }}
                    />
                </div>
            </div>

            {/* Habit Grid */}
            {habits.length === 0 && !isAdding ? (
                <div className="glass-card rounded-2xl p-8 text-center">
                    <div className="text-4xl mb-3">🎯</div>
                    <h3 className="text-lg font-bold text-zinc-300 mb-1">No habits yet</h3>
                    <p className="text-sm text-zinc-500 mb-4">Track daily habits like drinking water, meditation, or reading.</p>
                    <button
                        onClick={() => { setIsAdding(true); resetForm(); }}
                        className="px-5 py-2.5 rounded-xl bg-white text-black font-bold text-sm hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] cursor-pointer"
                    >
                        + Add Your First Habit
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {/* Header Row */}
                    <div className="flex items-center gap-3 px-2">
                        <div className="flex-1" />
                        <div className="flex gap-1">
                            {DAY_KEYS.map(d => (
                                <div
                                    key={d}
                                    className={`w-9 h-6 flex items-center justify-center text-[10px] font-bold uppercase tracking-wider rounded-md ${
                                        d === selectedDay ? "bg-white/10 text-white" : "text-zinc-600"
                                    }`}
                                >
                                    {DAY_LABELS[d]}
                                </div>
                            ))}
                        </div>
                        <div className="w-14 text-center text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                            Streak
                        </div>
                    </div>

                    {/* Habit Rows */}
                    {habits.map(habit => {
                        const streak = computeHabitStreak(habit, habitCompletionsByWeek, currentWeekKey);
                        const habitDays = weekCompletions[habit.id] || {};
                        const activeDays = DAY_KEYS.filter(d => isHabitActiveOnDay(habit, d));
                        const doneDays = activeDays.filter(d => habitDays[d]);
                        const habitPct = activeDays.length > 0 ? Math.round((doneDays.length / activeDays.length) * 100) : 0;

                        return (
                            <div key={habit.id} className="glass-card rounded-2xl p-3 sm:p-4 relative overflow-hidden group">
                                <div
                                    className="absolute left-0 top-0 bottom-0 bg-emerald-500/5 transition-all duration-700 pointer-events-none"
                                    style={{ width: `${habitPct}%` }}
                                />
                                <div className="flex items-center gap-3 relative z-10">
                                    <button
                                        onClick={() => !isReadOnly && startEdit(habit)}
                                        className="text-2xl shrink-0 hover:scale-110 transition-transform cursor-pointer"
                                        title="Edit habit"
                                    >
                                        {habit.emoji}
                                    </button>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-bold text-zinc-200 truncate">{habit.name}</div>
                                        <div className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider">
                                            {habit.frequency === "daily" ? "Every day" :
                                             habit.frequency === "weekdays" ? "Weekdays" :
                                             habit.customDays?.map(d => DAY_FULL_LABELS[d]).join(", ")}
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        {DAY_KEYS.map(d => {
                                            const active = isHabitActiveOnDay(habit, d);
                                            const done = habitDays[d] ?? false;
                                            return (
                                                <button
                                                    key={d}
                                                    onClick={() => {
                                                        if (active && !isReadOnly) {
                                                            toggleHabitCompletion(habit.id, d);
                                                            const isDone = !(weekCompletions[habit.id]?.[d]);
                                                            if (isDone) {
                                                                useScheduleStore.getState().addXP(5);
                                                            } else {
                                                                useScheduleStore.getState().addXP(-5);
                                                            }
                                                        }
                                                    }}
                                                    disabled={!active || isReadOnly}
                                                    className={`w-9 h-9 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${
                                                        !active
                                                            ? "border-zinc-900/50 bg-transparent opacity-20 cursor-not-allowed"
                                                            : done
                                                            ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.2)] scale-105 cursor-pointer"
                                                            : "border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900/50 cursor-pointer"
                                                    }`}
                                                >
                                                    {done && (
                                                        <svg className="w-4 h-4 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <polyline points="20 6 9 17 4 12" />
                                                        </svg>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <div className="w-14 text-center shrink-0">
                                        {streak > 0 ? (
                                            <div className="flex items-center justify-center gap-0.5">
                                                <span className="text-lg font-black text-amber-400">{streak}</span>
                                                <span className="text-sm">🔥</span>
                                            </div>
                                        ) : (
                                            <span className="text-zinc-700 text-sm font-bold">—</span>
                                        )}
                                    </div>
                                </div>
                                {/* Delete button on hover */}
                                {!isReadOnly && (
                                    <button
                                        onClick={() => {
                                            if (confirm(`Remove "${habit.name}" habit?`)) removeHabit(habit.id);
                                        }}
                                        className="absolute top-2 right-2 p-1 text-zinc-700 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                                        title="Delete habit"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        );
                    })}

                    {/* Add Button */}
                    {!isAdding && !editingId && !isReadOnly && (
                        <button
                            onClick={() => { setIsAdding(true); resetForm(); }}
                            className="w-full glass-card rounded-2xl p-4 flex items-center justify-center gap-2 text-zinc-500 hover:text-white hover:border-white/20 transition-all cursor-pointer group"
                        >
                            <span className="text-lg group-hover:scale-110 transition-transform">+</span>
                            <span className="text-sm font-bold">Add Habit</span>
                        </button>
                    )}
                </div>
            )}

            {/* Add/Edit Form */}
            {(isAdding || editingId) && (
                <div className="glass-card rounded-2xl p-5 relative overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />
                    <h3 className="text-sm font-bold text-zinc-300 mb-4">{editingId ? "Edit Habit" : "New Habit"}</h3>

                    <div className="space-y-4">
                        {/* Name + Emoji */}
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Name</label>
                                <input
                                    type="text"
                                    value={formName}
                                    onChange={e => setFormName(e.target.value)}
                                    placeholder="e.g. Drink 8 glasses of water"
                                    className="mt-1 w-full rounded-xl border border-zinc-800 bg-[#050505] p-3 text-white focus:border-zinc-600 focus:outline-none transition shadow-inner"
                                    autoFocus
                                />
                            </div>
                            <div className="relative">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Icon</label>
                                <button
                                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                    className="mt-1 w-14 h-[46px] flex items-center justify-center bg-[#050505] border border-zinc-800 rounded-xl text-2xl hover:bg-zinc-900 transition-colors cursor-pointer"
                                >
                                    {formEmoji}
                                </button>
                                {showEmojiPicker && (
                                    <div className="absolute right-0 top-full mt-1 z-50 bg-zinc-950 border border-zinc-800 rounded-xl p-2 grid grid-cols-8 gap-1 shadow-2xl animate-in fade-in">
                                        {HABIT_EMOJIS.map(e => (
                                            <button
                                                key={e}
                                                onClick={() => { setFormEmoji(e); setShowEmojiPicker(false); }}
                                                className="w-8 h-8 flex items-center justify-center rounded-lg text-lg hover:bg-zinc-800 transition-colors cursor-pointer"
                                            >
                                                {e}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Frequency */}
                        <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Frequency</label>
                            <div className="flex gap-2">
                                {FREQUENCY_OPTIONS.map(opt => (
                                    <button
                                        key={opt.id}
                                        onClick={() => setFormFreq(opt.id)}
                                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all cursor-pointer ${
                                            formFreq === opt.id
                                                ? "bg-white text-black border-white shadow-lg"
                                                : "border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Custom Days */}
                        {formFreq === "custom" && (
                            <div className="flex gap-2">
                                {DAY_KEYS.map(d => (
                                    <button
                                        key={d}
                                        onClick={() => {
                                            setFormCustomDays(prev =>
                                                prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
                                            );
                                        }}
                                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase border transition-all cursor-pointer ${
                                            formCustomDays.includes(d)
                                                ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-400"
                                                : "border-zinc-800 text-zinc-600 hover:border-zinc-600"
                                        }`}
                                    >
                                        {DAY_FULL_LABELS[d]}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                            <button
                                onClick={() => { setIsAdding(false); setEditingId(null); resetForm(); }}
                                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-zinc-500 hover:bg-zinc-900 transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={!formName.trim()}
                                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-white text-black hover:bg-zinc-200 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {editingId ? "Save Changes" : "Create Habit"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
