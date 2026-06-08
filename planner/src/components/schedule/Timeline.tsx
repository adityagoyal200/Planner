import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Trash2, GripVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { computeSchedule } from "../../engine/computeSchedule";
import { useScheduleStore } from "../../store/useScheduleStore";
import { formatTime } from "../../utils/formatTime";
import { BLOCK_META } from "../../constants/blockTypes";

export default function Timeline() {
    const { week, selectedDay, addBlock, updateBlock, removeBlock, reorderDayBlocks } = useScheduleStore();
    const day = week[selectedDay];

    if (!day) return null;

    const { scheduled, warnings } = computeSchedule(day);

    const handleDragEnd = (result: DropResult) => {
        if (!result.destination) return;

        const srcIdx = result.source.index;
        const destIdx = result.destination.index;
        if (srcIdx === destIdx) return;

        const newScheduled = Array.from(scheduled);
        const [removed] = newScheduled.splice(srcIdx, 1);
        newScheduled.splice(destIdx, 0, removed);

        const newRealOrder = newScheduled.filter((b: any) => !b.virtual).map((b: any) => b.id);
        reorderDayBlocks(selectedDay, newRealOrder);
    };

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-500">
                        Schedule
                    </h2>
                    <p className="text-zinc-500 mt-1 font-medium">
                        Drag to reorder • Click to edit
                    </p>
                </div>
                <button
                    onClick={() => addBlock(selectedDay)}
                    className="rounded-xl bg-white text-black px-5 py-2.5 font-bold shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] transition-all duration-300 hover:scale-105 cursor-pointer"
                >
                    + Add Block
                </button>
            </div>

            {warnings.length > 0 && (
                <div className="space-y-2 mb-4">
                    {warnings.map((warn, i) => (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            key={i}
                            className="rounded-xl border border-rose-900/50 bg-rose-950/20 p-4 flex items-center gap-3 text-rose-400"
                        >
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <span className="font-medium text-sm leading-tight">{warn}</span>
                        </motion.div>
                    ))}
                </div>
            )}

            <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="timeline-droppable">
                    {(provided) => (
                        <div
                            className="space-y-4"
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                        >
                            <AnimatePresence mode="popLayout">
                                {scheduled.map((block: any, index: number) => {
                                    const draggableId = block.id || `virtual-${index}`;
                                    const isDragDisabled = !!block.virtual || !!block.locked;

                                    return (
                                        <Draggable
                                            key={draggableId}
                                            draggableId={draggableId}
                                            index={index}
                                            isDragDisabled={isDragDisabled}
                                        >
                                            {(provided, snapshot) => (
                                                <motion.div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    layout
                                                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                                    animate={{ opacity: block.virtual ? 0.5 : (block.on === false ? 0.3 : 1), y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.9 }}
                                                    transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
                                                    className={`rounded-2xl border border-zinc-800/50 p-4 transition-colors duration-300 hover:border-zinc-600/50 group relative overflow-hidden backdrop-blur-md ${snapshot.isDragging ? 'shadow-2xl shadow-zinc-900/50 z-50 border-zinc-500' : ''}`}
                                                    style={{
                                                        ...provided.draggableProps.style,
                                                        background: `linear-gradient(135deg, ${BLOCK_META[block.type as keyof typeof BLOCK_META]?.bg || "#111"
                                                            } 0%, #050505 100%)`,
                                                    }}
                                                >
                                                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-[0.02] transition-opacity duration-300" />

                                                    <div className="flex items-center justify-between relative z-10 gap-4">
                                                        <div className="flex-1 flex items-center">

                                                            {!block.virtual && !block.locked && (
                                                                <div
                                                                    {...provided.dragHandleProps}
                                                                    className="mr-3 p-1 text-zinc-600 hover:text-white cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
                                                                >
                                                                    <GripVertical className="w-5 h-5" />
                                                                </div>
                                                            )}

                                                            <div className="flex items-center gap-4 flex-1">
                                                                <div className={`text-3xl drop-shadow-md shrink-0 ${block.virtual || block.locked ? 'ml-9' : ''}`}>
                                                                    {BLOCK_META[block.type as keyof typeof BLOCK_META]?.emoji || "⚡"}
                                                                </div>
                                                                <div className="flex-1">
                                                                    {!block.virtual ? (
                                                                        <input
                                                                            type="text"
                                                                            defaultValue={block.label}
                                                                            onBlur={(e) => {
                                                                                if (e.target.value !== block.label) {
                                                                                    updateBlock(selectedDay, block.id, { label: e.target.value });
                                                                                }
                                                                            }}
                                                                            className={`w-full bg-transparent border-none px-0 py-1 font-bold text-xl tracking-tight focus:outline-none focus:ring-0 ${block.on === false ? 'text-zinc-600 line-through' : 'text-zinc-100 group-hover:text-white transition-colors'}`}
                                                                        />
                                                                    ) : (
                                                                        <div className="font-bold text-xl tracking-tight text-zinc-100 group-hover:text-white transition-colors px-0 py-1">
                                                                            {block.label}
                                                                        </div>
                                                                    )}

                                                                    <div className="text-zinc-500 text-sm mt-0.5 font-medium flex items-center gap-2">
                                                                        <span className="text-zinc-400">{formatTime(block.start)}</span>
                                                                        <span className="text-zinc-700">→</span>
                                                                        <span className="text-zinc-400">{formatTime(block.end)}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-4 text-right shrink-0">
                                                            {!block.virtual ? (
                                                                <div className="flex items-center">
                                                                    <input
                                                                        type="number"
                                                                        defaultValue={block.end - block.start}
                                                                        onBlur={(e) => {
                                                                            const val = Number(e.target.value);
                                                                            if (val > 0 && val !== block.dur) {
                                                                                updateBlock(selectedDay, block.id, { dur: val });
                                                                            } else if (val <= 0) {
                                                                                e.target.value = block.dur; // Revert if invalid
                                                                            }
                                                                        }}
                                                                        className={`w-16 bg-transparent border-none px-0 py-1 font-black text-2xl text-right tracking-tighter focus:outline-none focus:ring-0 ${block.on === false ? 'text-zinc-700' : 'text-zinc-300'}`}
                                                                    />
                                                                    <span className="text-sm font-semibold text-zinc-600 ml-1">m</span>
                                                                </div>
                                                            ) : (
                                                                <div className="text-2xl font-black tracking-tighter text-zinc-300">
                                                                    {block.end - block.start}
                                                                    <span className="text-sm font-semibold text-zinc-600 ml-1">m</span>
                                                                </div>
                                                            )}

                                                            {!block.virtual && (
                                                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    {/* Toggle Switch */}
                                                                    <button
                                                                        onClick={() => updateBlock(selectedDay, block.id, { on: !block.on })}
                                                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${block.on ? 'bg-zinc-300' : 'bg-zinc-800'}`}
                                                                    >
                                                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-black transition-transform ${block.on ? 'translate-x-6' : 'translate-x-1'}`} />
                                                                    </button>

                                                                    {!block.locked && (
                                                                        <button onClick={() => removeBlock(selectedDay, block.id)} className="p-2 text-zinc-500 hover:text-rose-500 transition ml-2 cursor-pointer">
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {block.virtual && (
                                                                <div className="text-xs uppercase tracking-widest text-zinc-500 mt-1 font-bold">
                                                                    Virtual
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </Draggable>
                                    );
                                })}
                            </AnimatePresence>
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>
        </div>
    );
}