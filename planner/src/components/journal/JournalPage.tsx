import MoodLogger from "./MoodLogger";
import ReflectionEditor from "./ReflectionEditor";
import MoodChart from "./MoodChart";
import { useScheduleStore } from "../../store/useScheduleStore";
import { getWeekLabel } from "../../utils/dateUtils";

const DAY_LABELS: Record<string, string> = {
    mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday",
    fri: "Friday", sat: "Saturday", sun: "Sunday"
};

export default function JournalPage() {
    const { selectedDay, currentWeekKey, browsingWeekKey } = useScheduleStore();
    const weekLabel = getWeekLabel(browsingWeekKey || currentWeekKey);

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-baseline gap-3 mb-2">
                <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-500">
                    Journal
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-600">
                    {DAY_LABELS[selectedDay]}'s Entry - {weekLabel}
                </span>
            </div>

            {/* Mood & Energy */}
            <MoodLogger />

            {/* Mood Trend Chart */}
            <MoodChart />

            {/* Reflection & Gratitude */}
            <ReflectionEditor />
        </div>
    );
}
