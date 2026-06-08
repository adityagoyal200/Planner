import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Pencil, Trash2, Check, X, ArrowUp, ArrowDown } from "lucide-react";
import { computeSchedule } from "../../engine/computeSchedule";
import { useScheduleStore } from "../../store/useScheduleStore";
import { formatTime } from "../../utils/formatTime";
import { BLOCK_META } from "../../constants/blockTypes";

export default function Timeline() {
    const { week, selectedDay, addBlock, updateBlock, removeBlock, moveBlock } = useScheduleStore();
    const day = week[selectedDay];

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editLabel, setEditLabel] = useState("");
    const [editDur, setEditDur] = useState(0);

    if (!day) return null;

    const { scheduled, warnings } = computeSchedule(day);

    const startEdit = (block: any) => {
        setEditingId(block.id);
        setEditLabel(block.label);
        setEditDur(block.dur);
    };

    const saveEdit = (blockId: string) => {
        updateBlock(selectedDay, blockId, { label: editLabel, dur: editDur });
        setEditingId(null);
    };

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-500">
                        Schedule
                    </h2>
                    <p className="text-zinc-500 mt-1 font-medium">
                        Dynamic computed timeline
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

            <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                    {scheduled.map((block: any, index: number) => {
                        const isEditing = editingId === block.id;

                        return (
                        <motion.div
                            key={block.id || `${block.label}-${block.start}-${index}`}
                            layout
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: block.virtual ? 0.5 : (block.on === false ? 0.3 : 1), y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
                            className="rounded-2xl border border-zinc-800/50 p-4 transition-all duration-300 hover:border-zinc-600/50 group relative overflow-hidden backdrop-blur-md"
                            style={{
                                background: `linear-gradient(135deg, ${
                                    BLOCK_META[block.type as keyof typeof BLOCK_META]?.bg || "#111"
                                } 0%, #050505 100%)`,
                            }}
                        >
                            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-[0.02] transition-opacity duration-300" />
                            
                            <div className="flex items-center justify-between relative z-10 gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-4">
                                        <div className="text-3xl drop-shadow-md shrink-0">
                                            {BLOCK_META[block.type as keyof typeof BLOCK_META]?.emoji || "⚡"}
                                        </div>
                                        <div className="flex-1">
                                            {isEditing ? (
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    value={editLabel}
                                                    onChange={(e) => setEditLabel(e.target.value)}
                                                    className="w-full bg-[#111] text-white border border-zinc-700 rounded-lg px-3 py-1 font-bold text-lg focus:outline-none focus:border-zinc-500"
                                                />
                                            ) : (
                                                <div className={`font-bold text-xl tracking-tight transition-colors ${block.on === false ? 'text-zinc-600 line-through' : 'text-zinc-100 group-hover:text-white'}`}>
                                                    {block.label}
                                                </div>
                                            )}
                                            
                                            <div className="text-zinc-500 text-sm mt-1 font-medium flex items-center gap-2">
                                                <span className="text-zinc-400">{formatTime(block.start)}</span>
                                                <span className="text-zinc-700">→</span>
                                                <span className="text-zinc-400">{formatTime(block.end)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 text-right shrink-0">
                                    {isEditing ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                value={editDur}
                                                onChange={(e) => setEditDur(Number(e.target.value))}
                                                className="w-20 bg-[#111] text-white border border-zinc-700 rounded-lg px-3 py-1 font-black text-xl focus:outline-none focus:border-zinc-500 text-right"
                                            />
                                            <span className="text-zinc-500 font-bold mr-2">m</span>
                                            
                                            <button onClick={() => saveEdit(block.id)} className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500/30 transition cursor-pointer">
                                                <Check className="w-5 h-5" />
                                            </button>
                                            <button onClick={() => setEditingId(null)} className="p-2 bg-zinc-800 text-zinc-400 rounded-xl hover:bg-zinc-700 transition cursor-pointer">
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className={`text-2xl font-black tracking-tighter ${block.on === false ? 'text-zinc-700' : 'text-zinc-300'}`}>
                                                {block.end - block.start}
                                                <span className="text-sm font-semibold text-zinc-600 ml-1">m</span>
                                            </div>

                                            {!block.virtual && (
                                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {!block.locked && (
                                                        <>
                                                            <button onClick={() => moveBlock(selectedDay, block.id, "up")} className="p-2 text-zinc-500 hover:text-white transition cursor-pointer" title="Move Up">
                                                                <ArrowUp className="w-4 h-4" />
                                                            </button>
                                                            <button onClick={() => moveBlock(selectedDay, block.id, "down")} className="p-2 text-zinc-500 hover:text-white transition cursor-pointer" title="Move Down">
                                                                <ArrowDown className="w-4 h-4" />
                                                            </button>
                                                            <button onClick={() => startEdit(block)} className="p-2 text-zinc-500 hover:text-white transition cursor-pointer" title="Edit Block">
                                                                <Pencil className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                    
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
                                        </>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )})}
                </AnimatePresence>
            </div>
        </div>
    );
}