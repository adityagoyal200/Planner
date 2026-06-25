import { useScheduleStore, type DayKey } from "../../store/useScheduleStore";
import type { Block } from "../../types/block";


interface MicroReviewProps {
    day: DayKey;
    block: Block;
}

export default function MicroReview({ day, block }: MicroReviewProps) {
    const updateBlock = useScheduleStore((s) => s.updateBlock);

    const handleRate = (rating: 1 | 2 | 3) => {
        updateBlock(day, block.id, { flowRating: rating });
    };

    const handleTagChange = (tag: string) => {
        updateBlock(day, block.id, { flowTag: tag });
    };

    if (!block.completed) return null;

    return (
        <div 
            onClick={(e) => e.stopPropagation()} // Prevent card focus toggle
            className="mt-3 pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-2"
        >
            {block.flowRating ? (
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Flow Rating:</span>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-white/5 border border-white/5">
                            {block.flowRating === 3 && (
                                <>
                                    <span className="text-xs">🔥</span>
                                    <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-widest">Deep Focus</span>
                                </>
                            )}
                            {block.flowRating === 2 && (
                                <>
                                    <span className="text-xs">😐</span>
                                    <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Okay</span>
                                </>
                            )}
                            {block.flowRating === 1 && (
                                <>
                                    <span className="text-xs">😴</span>
                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Dragging</span>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            placeholder="Add tag (e.g., creative)"
                            value={block.flowTag || ""}
                            onChange={(e) => handleTagChange(e.target.value)}
                            className="bg-transparent border-none p-0 focus:ring-0 text-[10px] text-zinc-400 placeholder:text-zinc-700 text-right w-28 focus:outline-none"
                        />
                        <button
                            onClick={() => updateBlock(day, block.id, { flowRating: undefined, flowTag: undefined })}
                            className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 hover:text-zinc-400 transition-colors"
                        >
                            Reset
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">How was your flow?</span>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => handleRate(1)}
                            className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-white/5 hover:border-zinc-700 hover:bg-zinc-800 text-[10px] font-extrabold flex items-center gap-1 transition-all"
                            title="Dragging / Distracted"
                        >
                            <span>😴</span> <span className="hidden sm:inline text-zinc-400 text-[9px] uppercase tracking-wider">Drag</span>
                        </button>
                        <button
                            onClick={() => handleRate(2)}
                            className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-white/5 hover:border-zinc-700 hover:bg-zinc-800 text-[10px] font-extrabold flex items-center gap-1 transition-all"
                            title="Normal Flow"
                        >
                            <span>😐</span> <span className="hidden sm:inline text-zinc-400 text-[9px] uppercase tracking-wider">Okay</span>
                        </button>
                        <button
                            onClick={() => handleRate(3)}
                            className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-white/5 hover:border-zinc-700 hover:bg-zinc-800 text-[10px] font-extrabold flex items-center gap-1 transition-all"
                            title="Deep Focus / Energized"
                        >
                            <span>🔥</span> <span className="hidden sm:inline text-amber-400 text-[9px] uppercase tracking-wider font-black">Deep</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
