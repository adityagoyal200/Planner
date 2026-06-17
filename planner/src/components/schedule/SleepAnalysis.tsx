import { useScheduleStore } from "../../store/useScheduleStore";
import { computeSchedule } from "../../engine/computeSchedule";
import { formatTime } from "../../utils/formatTime";
import { addDaysToISODate, getDateForDayKeyInWeek } from "../../utils/dateUtils";
import { getTotalSleepDurationMins } from "../../utils/sleepUtils";
import { minsToTimeStr, parseTimeInput } from "../../utils/timeUtils";

export default function SleepAnalysis() {
    const { selectedDay, week, currentWeekKey, browsingWeekKey, updateActualWakeTime, updateActualSleepTime, updateActualWakeDate, updateActualSleepDate } = useScheduleStore();
    const day = week[selectedDay];
    const isReadOnly = !!browsingWeekKey;

    const days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
    const currentIdx = days.indexOf(selectedDay);
    const yesterdayKey = days[(currentIdx - 1 + 7) % 7] as keyof typeof week;
    const yesterdayData = week[yesterdayKey];
    
    const viewedWeekKey = browsingWeekKey || currentWeekKey;
    const refDate = getDateForDayKeyInWeek(selectedDay, viewedWeekKey);
    const prevRefDate = getDateForDayKeyInWeek(yesterdayKey, viewedWeekKey);
    
    // Calculate yesterday's sleep for comparison
    const yDayScheduled = computeSchedule(yesterdayData, [], { referenceDate: prevRefDate });
    const yDayDuration = getTotalSleepDurationMins(yesterdayData, yDayScheduled.sleepTime, yDayScheduled.totalNapMins);
    const yesterdaySleepStr = (yDayDuration / 60).toFixed(1);

    if (!day) return null;

    const { sleepTime, totalNapMins } = computeSchedule(day, [], { referenceDate: refDate });
    const sleepDurationMins = getTotalSleepDurationMins(day, sleepTime, totalNapMins);
    const sleepHours = (sleepDurationMins / 60).toFixed(1);
    const wakeMinsForInference = day.actualWakeTime ?? day.wakeTime;
    const wakeDateForInference = day.actualWakeDate || refDate;
    const inferredSleepDate = day.actualSleepTime !== null && day.actualSleepTime > wakeMinsForInference
        ? addDaysToISODate(wakeDateForInference, -1)
        : wakeDateForInference;
    
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
                                updateActualWakeDate(selectedDay, null);
                                updateActualSleepDate(selectedDay, null);
                            }}
                            className="text-[10px] text-zinc-500 hover:text-rose-400 font-bold uppercase tracking-widest transition-colors flex items-center gap-1 bg-zinc-900 hover:bg-rose-950 px-2 py-1 rounded-md"
                        >
                            Reset
                        </button>
                    )}
                </div>

                    {isReadOnly && (
                        <div className="text-[10px] uppercase font-bold tracking-widest text-amber-500/70 mb-3">
                            Viewing a past week - read only
                        </div>
                    )}

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
                                    if (isReadOnly) return;
                                    const val = e.target.value.trim();
                                    if (!val) {
                                        updateActualWakeTime(selectedDay, null);
                                        updateActualWakeDate(selectedDay, null);
                                        return;
                                    }
                                    const mins = parseTimeInput(val, 23);
                                    if (mins !== null) {
                                        updateActualWakeTime(selectedDay, mins);
                                        if (!day.actualWakeDate) updateActualWakeDate(selectedDay, refDate);
                                    } else {
                                        e.target.value = day.actualWakeTime !== null ? minsToTimeStr(day.actualWakeTime) : "";
                                    }
                                }}
                                disabled={isReadOnly}
                                className="bg-zinc-800 text-white border border-zinc-700 rounded-lg px-2 py-1 text-sm font-bold focus:outline-none focus:border-indigo-500 hover:bg-zinc-700 transition-colors cursor-pointer w-20 text-right tabular-nums"
                            />
                            <input
                                type="date"
                                value={day.actualWakeDate || refDate}
                                onChange={(e) => { if (!isReadOnly) updateActualWakeDate(selectedDay, e.target.value); }}
                                disabled={isReadOnly}
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
                                    if (isReadOnly) return;
                                    const val = e.target.value.trim();
                                    if (!val) {
                                        updateActualSleepTime(selectedDay, null);
                                        updateActualSleepDate(selectedDay, null);
                                        return;
                                    }
                                    const mins = parseTimeInput(val, 23);
                                    if (mins !== null) {
                                        updateActualSleepTime(selectedDay, mins);
                                        if (!day.actualSleepDate) {
                                            const wakeMins = day.actualWakeTime ?? day.wakeTime;
                                            const wakeDate = day.actualWakeDate || refDate;
                                            const sleepDate = mins > wakeMins ? addDaysToISODate(wakeDate, -1) : wakeDate;
                                            updateActualSleepDate(selectedDay, sleepDate);
                                        }
                                    } else {
                                        e.target.value = day.actualSleepTime !== null ? minsToTimeStr(day.actualSleepTime) : "";
                                    }
                                }}
                                disabled={isReadOnly}
                                className="bg-zinc-800 text-white border border-zinc-700 rounded-lg px-2 py-1 text-sm font-bold focus:outline-none focus:border-indigo-500 hover:bg-zinc-700 transition-colors cursor-pointer w-20 text-right tabular-nums"
                            />
                            <input
                                type="date"
                                value={day.actualSleepDate || inferredSleepDate}
                                onChange={(e) => { if (!isReadOnly) updateActualSleepDate(selectedDay, e.target.value); }}
                                disabled={isReadOnly}
                                className="bg-transparent text-[10px] text-zinc-500 border-none p-0 text-right focus:ring-0 hover:text-white cursor-pointer w-[85px] leading-tight [&::-webkit-calendar-picker-indicator]:invert-[0.4] [&::-webkit-calendar-picker-indicator]:opacity-50 hover:[&::-webkit-calendar-picker-indicator]:opacity-100 transition-all"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
