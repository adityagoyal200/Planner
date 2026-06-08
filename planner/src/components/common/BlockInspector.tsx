import { useScheduleStore } from "../../store/useScheduleStore";
import { computeSchedule } from "../../engine/computeSchedule";

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

export default function BlockInspector() {
    const { selectedDay, week, focusBlockId, updateBlock } = useScheduleStore();
    const day = week[selectedDay];

    if (!day || !focusBlockId) return null;

    const { scheduled } = computeSchedule(day);
    const block = scheduled.find((b: any) => b.id === focusBlockId);
    const realBlock = day.blocks.find(b => b.id === focusBlockId);

    if (!block || block.virtual || !realBlock) {
        return (
            <div className="bg-[#0a0a0a] border border-zinc-800/50 rounded-2xl p-4 text-center">
                <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Select a block to inspect</p>
            </div>
        );
    }

    const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const mins = timeStrToMins(e.target.value);
        updateBlock(selectedDay, block.id, { actualStart: mins });
    };

    const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newEndMins = timeStrToMins(e.target.value);
        if (newEndMins !== null) {
            // End Time = Start Time + Duration
            // So new Duration = newEndMins - Start Time
            let newDur = newEndMins - block.start;
            // Handle cross-midnight logic if end time is early morning but start time is late night
            if (newDur < 0 && newEndMins < 12 * 60) {
                newDur = (newEndMins + 24 * 60) - block.start;
            }
            if (newDur > 0) {
                updateBlock(selectedDay, block.id, { dur: newDur });
            }
        }
    };

    return (
        <div className="bg-[#0a0a0a] border border-zinc-800/50 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Block Details</h3>
                {realBlock.actualStart != null && (
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
