import { useScheduleStore } from "../../store/useScheduleStore";
import { computeSchedule } from "../../engine/computeSchedule";
import { formatTime } from "../../utils/formatTime";
import { getDateForDayKey } from "../../utils/dateUtils";

function minsToTimeStr(mins: number) {
    const positiveMins = ((mins % 1440) + 1440) % 1440;
    const h = Math.floor(positiveMins / 60);
    const m = positiveMins % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

function timeStrToMins(timeStr: string) {
    if (!timeStr) return null;
    const [h, m] = timeStr.split(":").map(Number);
    return h * 60 + m;
}

export default function SleepAnalysis() {
    const { selectedDay, week, updateActualWakeTime, updateActualSleepTime, updateActualWakeDate, updateActualSleepDate } = useScheduleStore();
    const day = week[selectedDay];

    const days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
    const currentIdx = days.indexOf(selectedDay);
    const yesterdayKey = days[(currentIdx - 1 + 7) % 7] as keyof typeof week;
    const yesterdayData = week[yesterdayKey];
    
    const refDate = getDateForDayKey(selectedDay);
    const prevRefDate = getDateForDayKey(yesterdayKey);
    
    // Calculate yesterday's sleep for comparison
    const yDayScheduled = computeSchedule(yesterdayData, [], { referenceDate: prevRefDate });
    const yDayWake = yesterdayData.actualWakeTime !== null ? yesterdayData.actualWakeTime : yesterdayData.wakeTime;
    const yDaySleep = yesterdayData.actualSleepTime !== null ? yesterdayData.actualSleepTime : yDayScheduled.sleepTime;
    
    let yDayDuration = 0;
    if (yesterdayData.actualSleepTime != null && yesterdayData.actualSleepDate && yesterdayData.actualWakeDate) {
        const sleepDate = new Date(yesterdayData.actualSleepDate);
        const wakeDate = new Date(yesterdayData.actualWakeDate || yesterdayData.actualSleepDate);
        let sleepAbsolute = sleepDate.getTime() / 60000 + (yesterdayData.actualSleepTime % 1440);
        let wakeAbsolute = wakeDate.getTime() / 60000 + (yDayWake % 1440);
        
        let diff = wakeAbsolute - sleepAbsolute;
        if (diff < 0) diff += 24 * 60;
        if (diff > 24 * 60) diff -= 24 * 60;
        yDayDuration = diff;
    } else if (yDaySleep <= 24 * 60) {
        yDayDuration = (24 * 60 - yDaySleep) + yDayWake;
    } else {
        yDayDuration = yDayWake - (yDaySleep - 24 * 60);
    }
    yDayDuration += yDayScheduled.totalNapMins;
    const yesterdaySleepStr = (yDayDuration / 60).toFixed(1);

    if (!day) return null;

    const { sleepTime, totalNapMins } = computeSchedule(day, [], { referenceDate: refDate });
    
    // Use actuals if provided, otherwise planned
    const wakeMins = day.actualWakeTime !== null ? day.actualWakeTime : day.wakeTime;
    const effectiveSleepTime = day.actualSleepTime !== null ? day.actualSleepTime : sleepTime;
    
    let sleepDurationMins = 0;
    if (day.actualSleepTime != null && day.actualSleepDate && day.actualWakeDate) {
        const sleepDate = new Date(day.actualSleepDate);
        const wakeDate = new Date(day.actualWakeDate || day.actualSleepDate);
        let sleepAbsolute = sleepDate.getTime() / 60000 + (day.actualSleepTime % 1440);
        let wakeAbsolute = wakeDate.getTime() / 60000 + (wakeMins % 1440);
        
        let diff = wakeAbsolute - sleepAbsolute;
        if (diff < 0) diff += 24 * 60;
        if (diff > 24 * 60) diff -= 24 * 60;
        sleepDurationMins = diff;
    } else if (effectiveSleepTime <= 24 * 60) {
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
    
    const isReality = day.actualWakeTime !== null || day.actualSleepTime !== null;

    return (
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden group">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent transition-opacity duration-500 group-hover:opacity-100 opacity-50" />
            
            <div className="flex justify-between items-start relative z-10">
                <div>
                    <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">
                        Last Night's Sleep
                    </h2>
                    <div className="flex items-baseline gap-2">
                        <div className={`text-4xl font-black tracking-tighter ${colorClass} drop-shadow-lg`}>
                            {sleepHours}h
                        </div>
                        {totalNapMins > 0 && (
                            <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider bg-zinc-900 px-2 py-0.5 rounded-md">
                                + {totalNapMins}m Nap
                            </div>
                        )}
                    </div>
                </div>
                <div className="text-right flex flex-col items-end">
                    <div className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest mb-1">Previous Night</div>
                    <div className="text-lg font-black text-zinc-400 bg-zinc-900/50 px-3 py-1 rounded-lg border border-zinc-800/50">{yesterdaySleepStr}h</div>
                </div>
            </div>

            <div className="mt-2 relative z-10">
                <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded ${isReality ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-zinc-800 text-zinc-400'}`}>
                    {isReality ? 'Based on Reality' : 'Based on Planned Schedule'}
                </span>
            </div>

            <div className="mt-6 border-t border-zinc-800/50 pt-5 relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-zinc-300">Log Reality</h3>
                    {isReality && (
                        <button 
                            onClick={() => {
                                updateActualWakeTime(selectedDay, null);
                                updateActualSleepTime(selectedDay, null);
                            }}
                            className="text-[10px] text-zinc-500 hover:text-rose-400 font-bold uppercase tracking-widest transition-colors flex items-center gap-1 bg-zinc-900 hover:bg-rose-950 px-2 py-1 rounded-md"
                        >
                            Reset
                        </button>
                    )}
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between bg-zinc-900/50 border border-zinc-800/50 p-3 rounded-xl hover:border-zinc-700 transition-colors">
                        <div className="flex flex-col">
                            <span className="text-white text-sm font-bold">Woke up</span>
                            <span className="text-zinc-500 text-[10px] font-bold">Planned: {formatTime(day.wakeTime)}</span>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <input 
                                type="text"
                                inputMode="numeric"
                                placeholder="HH:MM"
                                defaultValue={day.actualWakeTime !== null ? minsToTimeStr(day.actualWakeTime) : ""}
                                key={`wake-${day.actualWakeTime}`}
                                onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                                onBlur={(e) => {
                                    const val = e.target.value.trim();
                                    if (!val) { updateActualWakeTime(selectedDay, null); return; }
                                    let mins = timeStrToMins(val);
                                    if (mins === null) {
                                        const numVal = parseInt(val, 10);
                                        if (!isNaN(numVal) && numVal >= 0 && numVal <= 23) mins = numVal * 60;
                                    }
                                    if (mins !== null) {
                                        updateActualWakeTime(selectedDay, mins);
                                        if (!day.actualWakeDate) updateActualWakeDate(selectedDay, refDate);
                                    } else {
                                        e.target.value = day.actualWakeTime !== null ? minsToTimeStr(day.actualWakeTime) : "";
                                    }
                                }}
                                className="bg-zinc-800 text-white border border-zinc-700 rounded-lg px-2 py-1 text-sm font-bold focus:outline-none focus:border-indigo-500 hover:bg-zinc-700 transition-colors cursor-pointer w-20 text-right tabular-nums"
                            />
                            <input
                                type="date"
                                value={day.actualWakeDate || refDate}
                                onChange={(e) => updateActualWakeDate(selectedDay, e.target.value)}
                                className="bg-transparent text-[10px] text-zinc-500 border-none p-0 text-right focus:ring-0 hover:text-white cursor-pointer w-[85px] leading-tight [&::-webkit-calendar-picker-indicator]:invert-[0.4] [&::-webkit-calendar-picker-indicator]:opacity-50 hover:[&::-webkit-calendar-picker-indicator]:opacity-100 transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between bg-zinc-900/50 border border-zinc-800/50 p-3 rounded-xl hover:border-zinc-700 transition-colors">
                        <div className="flex flex-col">
                            <span className="text-white text-sm font-bold">Went to sleep</span>
                            <span className="text-zinc-500 text-[10px] font-bold">Planned: {formatTime(sleepTime)}</span>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <input 
                                type="text"
                                inputMode="numeric"
                                placeholder="HH:MM"
                                defaultValue={day.actualSleepTime !== null ? minsToTimeStr(day.actualSleepTime) : ""}
                                key={`sleep-${day.actualSleepTime}`}
                                onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                                onBlur={(e) => {
                                    const val = e.target.value.trim();
                                    if (!val) { updateActualSleepTime(selectedDay, null); return; }
                                    let mins = timeStrToMins(val);
                                    if (mins === null) {
                                        const numVal = parseInt(val, 10);
                                        if (!isNaN(numVal) && numVal >= 0 && numVal <= 23) mins = numVal * 60;
                                    }
                                    if (mins !== null) {
                                        updateActualSleepTime(selectedDay, mins);
                                        if (!day.actualSleepDate) {
                                            const sleepRef = new Date(refDate);
                                            sleepRef.setDate(sleepRef.getDate() + 1);
                                            updateActualSleepDate(selectedDay, sleepRef.toISOString().split("T")[0]);
                                        }
                                    } else {
                                        e.target.value = day.actualSleepTime !== null ? minsToTimeStr(day.actualSleepTime) : "";
                                    }
                                }}
                                className="bg-zinc-800 text-white border border-zinc-700 rounded-lg px-2 py-1 text-sm font-bold focus:outline-none focus:border-indigo-500 hover:bg-zinc-700 transition-colors cursor-pointer w-20 text-right tabular-nums"
                            />
                            <input
                                type="date"
                                value={day.actualSleepDate || (() => {
                                    const d = new Date(refDate);
                                    d.setDate(d.getDate() + 1);
                                    return d.toISOString().split("T")[0];
                                })()}
                                onChange={(e) => updateActualSleepDate(selectedDay, e.target.value)}
                                className="bg-transparent text-[10px] text-zinc-500 border-none p-0 text-right focus:ring-0 hover:text-white cursor-pointer w-[85px] leading-tight [&::-webkit-calendar-picker-indicator]:invert-[0.4] [&::-webkit-calendar-picker-indicator]:opacity-50 hover:[&::-webkit-calendar-picker-indicator]:opacity-100 transition-all"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}