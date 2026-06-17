import { useScheduleStore } from "../../store/useScheduleStore";
import { computeSchedule } from "../../engine/computeSchedule";
import { getDateForDayKeyInWeek } from "../../utils/dateUtils";
import { minsToTimeStr, parseTimeInput } from "../../utils/timeUtils";

export default function BlockInspector() {
    const { selectedDay, week, focusBlockId, updateBlock, currentWeekKey, browsingWeekKey } = useScheduleStore();
    const day = week[selectedDay];

    if (!day || !focusBlockId) return null;

    const refDate = getDateForDayKeyInWeek(selectedDay, browsingWeekKey || currentWeekKey);
    const { scheduled } = computeSchedule(day, useScheduleStore.getState().calendarEvents, { referenceDate: refDate });
    const block = scheduled.find((b) => b.id === focusBlockId);
    
    // We allow normal blocks OR google blocks
    const isGoogle = block?.source === "google";
    const realBlock = isGoogle ? block.originalEvent : day.blocks.find(b => b.id === focusBlockId);

    if (!block || (block.virtual && !isGoogle) || !realBlock) {
        return (
            <div className="glass-card rounded-2xl p-4 text-center">
                <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Select a block to inspect</p>
            </div>
        );
    }

    const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const mins = parseTimeInput(e.target.value, 23);
        if (mins !== null) {
            if (isGoogle) {
                const originalEventId = block.originalEvent?.id;
                if (originalEventId) {
                    useScheduleStore.getState().syncCalendarEventUpdate(originalEventId, { startMins: mins, endMins: mins + block.dur });
                }
            } else {
                updateBlock(selectedDay, block.id, { actualStart: mins });
            }
        }
    };

    const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newEndMins = parseTimeInput(e.target.value, 23);
        if (newEndMins !== null) {
            let newDur = newEndMins - block.start;
            if (newDur < 0 && newEndMins < 12 * 60) {
                newDur = (newEndMins + 24 * 60) - block.start;
            }
            if (newDur > 0) {
                if (isGoogle) {
                    const originalEventId = block.originalEvent?.id;
                    if (originalEventId) {
                        useScheduleStore.getState().syncCalendarEventUpdate(originalEventId, { endMins: block.start + newDur });
                    }
                } else {
                    updateBlock(selectedDay, block.id, { dur: newDur });
                }
            }
        }
    };

    return (
        <div className="glass-card rounded-2xl p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    {isGoogle ? "Google Event Details" : "Block Details"}
                </h3>
                {!isGoogle && "actualStart" in realBlock && realBlock.actualStart != null && (
                    <button 
                        onClick={() => updateBlock(selectedDay, block.id, { actualStart: null })}
                        className="text-[10px] text-rose-500 hover:text-rose-400 font-bold uppercase tracking-widest transition-colors flex items-center gap-1 bg-rose-500/10 hover:bg-rose-500/20 px-2 py-0.5 rounded"
                    >
                        Reset Flow
                    </button>
                )}
            </div>

            <div className="text-white font-black text-lg mb-4 truncate" title={block.label}>
                {block.label}
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between bg-zinc-900/50 p-2.5 rounded-xl border border-zinc-800/50 hover:border-zinc-700 transition-colors">
                    <span className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Start</span>
                    <input 
                        type="time" 
                        value={minsToTimeStr(block.start)}
                        onChange={handleStartChange}
                        className="bg-transparent text-white border-none p-0 text-right text-sm font-bold focus:outline-none focus:ring-0 cursor-pointer hover:text-indigo-400 transition-colors"
                    />
                </div>

                <div className="flex items-center justify-between bg-zinc-900/50 p-2.5 rounded-xl border border-zinc-800/50 hover:border-zinc-700 transition-colors">
                    <span className="text-zinc-400 text-xs font-bold uppercase tracking-widest">End</span>
                    <input 
                        type="time" 
                        value={minsToTimeStr(block.end)}
                        onChange={handleEndChange}
                        className="bg-transparent text-white border-none p-0 text-right text-sm font-bold focus:outline-none focus:ring-0 cursor-pointer hover:text-indigo-400 transition-colors"
                    />
                </div>
            </div>
        </div>
    );
}
