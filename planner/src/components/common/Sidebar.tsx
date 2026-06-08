import clsx from "clsx";
import { useScheduleStore } from "../../store/useScheduleStore";

const days = [
    { id: "mon", label: "Mon" },
    { id: "tue", label: "Tue" },
    { id: "wed", label: "Wed" },
    { id: "thu", label: "Thu" },
    { id: "fri", label: "Fri" },
    { id: "sat", label: "Sat" },
    { id: "sun", label: "Sun" },
] as const;

export default function Sidebar() {
    const { selectedDay, setSelectedDay } = useScheduleStore();

    return (
        <div className="w-64 border-r border-zinc-900 bg-[#030303] p-4 flex flex-col relative z-10">
            <div className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white to-zinc-500">
                Planner
            </div>
            <div className="text-zinc-500 text-xs uppercase tracking-widest mt-2 font-semibold">
                Weekly Planner
            </div>

            <div className="mt-10 space-y-2 flex-1">
                {days.map((d) => (
                    <button
                        key={d.id}
                        onClick={() => setSelectedDay(d.id)}
                        className={clsx(
                            "w-full rounded-xl border p-3 text-left transition-all duration-300 font-medium",
                            selectedDay === d.id
                                ? "border-zinc-700 bg-zinc-800/50 text-white shadow-[0_0_20px_rgba(255,255,255,0.03)]"
                                : "border-transparent bg-transparent text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
                        )}
                    >
                        {d.label}
                    </button>
                ))}
            </div>
        </div>
    );
}