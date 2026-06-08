import { useScheduleStore } from "../../store/useScheduleStore";
import { computeSchedule } from "../../engine/computeSchedule";
import { formatTime } from "../../utils/formatTime";

export default function SleepAnalysis() {
    const { selectedDay, week } = useScheduleStore();
    const day = week[selectedDay];

    if (!day) return null;

    const { sleepTime } = computeSchedule(day);
    
    const wakeMins = day.wakeTime;
    
    let sleepDurationMins = 0;
    if (sleepTime < 24 * 60) {
        sleepDurationMins = (24 * 60 - sleepTime) + wakeMins;
    } else {
        const sleepNextDayMins = sleepTime - 24 * 60;
        sleepDurationMins = wakeMins - sleepNextDayMins;
    }
    
    const sleepHours = (sleepDurationMins / 60).toFixed(1);
    
    const isGoodSleep = sleepDurationMins >= 7 * 60;
    const colorClass = isGoodSleep ? "text-emerald-400" : "text-amber-400";

    return (
        <div className="rounded-2xl border border-zinc-800/50 bg-gradient-to-b from-[#111] to-[#080808] p-5 shadow-2xl backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent transition-opacity duration-500 group-hover:opacity-100 opacity-50" />
            
            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-500 relative z-10">
                Sleep Analysis
            </h2>

            <div className="mt-5 relative z-10">
                <div className={`text-5xl font-black tracking-tighter ${colorClass} drop-shadow-lg`}>
                    {sleepHours}h
                </div>
                <div className="text-zinc-500 mt-2 font-medium">Projected sleep</div>
            </div>

            <div className="mt-6 space-y-3 relative z-10">
                <div className="flex justify-between items-center border-b border-zinc-800/50 pb-3">
                    <span className="text-zinc-500 font-medium">Wake</span>
                    <span className="font-bold text-zinc-200">{formatTime(wakeMins)}</span>
                </div>

                <div className="flex justify-between items-center pt-1">
                    <span className="text-zinc-500 font-medium">Sleep</span>
                    <span className="font-bold text-zinc-200">{formatTime(sleepTime)}</span>
                </div>
            </div>
        </div>
    );
}