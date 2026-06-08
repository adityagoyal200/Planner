import clsx from "clsx";
import { useScheduleStore } from "../../store/useScheduleStore";
import { computeSchedule } from "../../engine/computeSchedule";
import FocusTimer from "./FocusTimer";
import BlockInspector from "./BlockInspector";
import { getQuoteOfTheDay } from "../../data/quotes";

const days = [
    { id: "mon", label: "M" },
    { id: "tue", label: "T" },
    { id: "wed", label: "W" },
    { id: "thu", label: "T" },
    { id: "fri", label: "F" },
    { id: "sat", label: "S" },
    { id: "sun", label: "S" },
] as const;

export default function Sidebar({ onClose }: { onClose?: () => void }) {
    const { selectedDay, setSelectedDay, week, quickNotes, updateQuickNotes, streak } = useScheduleStore();
    const day = week[selectedDay];
    
    const { dayScore } = day ? computeSchedule(day) : { dayScore: 0 };
    const quote = getQuoteOfTheDay();

    return (
        <div className="w-80 h-full border-r border-zinc-900 bg-[#030303] p-5 flex flex-col relative z-10 overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <div className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white to-zinc-500">
                        Planner
                    </div>
                    <div className="text-zinc-500 text-[10px] uppercase tracking-widest mt-1 font-bold">
                        Personal OS
                    </div>
                </div>
                {onClose && (
                    <button onClick={onClose} className="p-2 -mr-2 text-zinc-500 hover:text-white lg:hidden">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Day Picker Compact */}
            <div className="flex items-center justify-between bg-zinc-900/50 p-1.5 rounded-2xl mb-8">
                {days.map((d) => (
                    <button
                        key={d.id}
                        onClick={() => setSelectedDay(d.id)}
                        className={clsx(
                            "flex-1 py-2 text-sm font-bold rounded-xl transition-all duration-300",
                            selectedDay === d.id
                                ? "bg-white text-black shadow-lg"
                                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                        )}
                    >
                        {d.label}
                    </button>
                ))}
            </div>

            {/* Score & Streak Grid */}
            <div className="grid grid-cols-2 gap-3 mb-8">
                <div className="bg-[#0a0a0a] border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between">
                    <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2">Today</div>
                    <div className="text-3xl font-black text-white">{Math.round(dayScore)}<span className="text-xl text-zinc-600">%</span></div>
                </div>
                
                <div className="bg-[#0a0a0a] border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between">
                    <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2">Streak</div>
                    <div className="flex items-center gap-1">
                        <span className="text-3xl font-black text-white">{streak}</span>
                        <span className="text-xl">🔥</span>
                    </div>
                </div>
            </div>

            {/* Focus Timer */}
            <div className="mb-8">
                <FocusTimer />
            </div>

            {/* Block Inspector */}
            <div className="mb-8">
                <BlockInspector />
            </div>

            {/* Quick Notes */}
            <div className="flex-1 flex flex-col min-h-[200px]">
                <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-3 px-1">Quick Notes</div>
                <textarea
                    value={quickNotes}
                    onChange={(e) => updateQuickNotes(e.target.value)}
                    placeholder="Capture thoughts here..."
                    className="flex-1 w-full bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-4 text-sm text-zinc-300 focus:outline-none focus:border-zinc-600 focus:bg-zinc-900 transition-all resize-none placeholder:text-zinc-700 leading-relaxed"
                />
            </div>

            {/* Daily Quote */}
            <div className="mt-8 pt-6 border-t border-zinc-900">
                <blockquote className="text-zinc-500 text-sm italic leading-relaxed">
                    "{quote.text}"
                </blockquote>
                <div className="text-zinc-600 text-xs font-bold uppercase tracking-wider mt-2">
                    — {quote.author}
                </div>
            </div>
        </div>
    );
}