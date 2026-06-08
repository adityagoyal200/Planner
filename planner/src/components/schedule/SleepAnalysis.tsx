import { useScheduleStore } from "../../store/useScheduleStore";
import { computeSchedule } from "../../engine/computeSchedule";
import { formatTime } from "../../utils/formatTime";

function minsToTimeStr(mins: number) {
    const h = Math.floor(mins / 60) % 24;
    const m = mins % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

function timeStrToMins(timeStr: string) {
    if (!timeStr) return null;
    const [h, m] = timeStr.split(":").map(Number);
    return h * 60 + m;
}

export default function SleepAnalysis() {
    const { selectedDay, week, updateActualWakeTime, updateActualSleepTime } = useScheduleStore();
    const day = week[selectedDay];

    if (!day) return null;

    const { sleepTime, totalNapMins } = computeSchedule(day);
    
    const wakeMins = day.actualWakeTime !== null ? day.actualWakeTime : day.wakeTime;
    const effectiveSleepTime = day.actualSleepTime !== null ? day.actualSleepTime : sleepTime;
    
    let sleepDurationMins = 0;
    if (effectiveSleepTime <= 24 * 60) {
        sleepDurationMins = (24 * 60 - effectiveSleepTime) + wakeMins;
    } else {
        const sleepNextDayMins = effectiveSleepTime - 24 * 60;
        sleepDurationMins = wakeMins - sleepNextDayMins;
    }

    // Add nap to sleep duration
    sleepDurationMins += totalNapMins;
    
    const sleepHours = (sleepDurationMins / 60).toFixed(1);
    
    const isGoodSleep = sleepDurationMins >= day.sleepTarget;
    const colorClass = isGoodSleep ? "text-emerald-400" : "text-amber-400";

    return (
        <div className="rounded-2xl border border-zinc-800/50 bg-gradient-to-b from-[#111] to-[#080808] p-5 shadow-2xl backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent transition-opacity duration-500 group-hover:opacity-100 opacity-50" />
            
            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-500 relative z-10 flex justify-between items-center">
                <span>Sleep Tracker</span>
                {totalNapMins > 0 && (
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider bg-zinc-900 px-2 py-1 rounded-md">
                        + {totalNapMins}m Nap
                    </span>
                )}
            </h2>

            <div className="mt-5 relative z-10 flex items-end justify-between">
                <div>
                    <div className={`text-5xl font-black tracking-tighter ${colorClass} drop-shadow-lg`}>
                        {sleepHours}h
                    </div>
                    <div className="text-zinc-500 mt-2 font-medium text-sm">
                        Total sleep {day.actualSleepTime !== null ? "(Actual)" : "(Planned)"}
                    </div>
                </div>
            </div>

            <div className="mt-6 space-y-4 relative z-10">
                <div className="flex flex-col gap-1 border-b border-zinc-800/50 pb-4">
                    <div className="flex justify-between items-center text-sm mb-1">
                        <span className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Woke up at</span>
                        <span className="text-zinc-600 text-[10px] font-bold">Planned: {formatTime(day.wakeTime)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <input 
                            type="time" 
                            value={day.actualWakeTime !== null ? minsToTimeStr(day.actualWakeTime) : ""}
                            onChange={(e) => updateActualWakeTime(selectedDay, timeStrToMins(e.target.value))}
                            className="bg-zinc-900 text-white border border-zinc-800 rounded-lg px-3 py-1.5 text-sm font-bold focus:outline-none focus:border-zinc-600 w-full"
                            placeholder="Actual Wake Time"
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center text-sm mb-1">
                        <span className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Went to sleep at</span>
                        <span className="text-zinc-600 text-[10px] font-bold">Planned: {formatTime(sleepTime)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <input 
                            type="time" 
                            value={day.actualSleepTime !== null ? minsToTimeStr(day.actualSleepTime) : ""}
                            onChange={(e) => {
                                let mins = timeStrToMins(e.target.value);
                                // If time is like 01:00 (AM), and planned sleep is usually after midnight
                                // we need to add 24*60 if it's considered "next day" sleep.
                                // For simplicity, if time is < 12:00PM (720 mins), assume it's next day sleep.
                                if (mins !== null && mins < 12 * 60) {
                                    mins += 24 * 60;
                                }
                                updateActualSleepTime(selectedDay, mins);
                            }}
                            className="bg-zinc-900 text-white border border-zinc-800 rounded-lg px-3 py-1.5 text-sm font-bold focus:outline-none focus:border-zinc-600 w-full"
                            placeholder="Actual Sleep Time"
                        />
                    </div>
                </div>
                
                {(day.actualWakeTime !== null || day.actualSleepTime !== null) && (
                    <button 
                        onClick={() => {
                            updateActualWakeTime(selectedDay, null);
                            updateActualSleepTime(selectedDay, null);
                        }}
                        className="w-full text-center text-[10px] text-zinc-500 hover:text-zinc-300 font-bold uppercase tracking-widest mt-2 transition-colors"
                    >
                        Reset to Planned
                    </button>
                )}
            </div>
        </div>
    );
}