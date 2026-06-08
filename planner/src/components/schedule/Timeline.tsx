import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Trash2, ChevronUp, ChevronDown, Clock, Plus } from "lucide-react";
import { computeSchedule } from "../../engine/computeSchedule";
import { useScheduleStore } from "../../store/useScheduleStore";
import { formatTime } from "../../utils/formatTime";
import { BLOCK_META } from "../../constants/blockTypes";
import BlockTypePicker from "./BlockTypePicker";
import type { BlockType } from "../../types/block";

export default function Timeline() {
    const { week, selectedDay, addBlock, updateBlock, removeBlock, moveBlock, setFocusBlock, focusBlockId } = useScheduleStore();
    const day = week[selectedDay];
    const [showPicker, setShowPicker] = useState(false);
    const [, setTick] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => setTick(t => t + 1), 60000);
        return () => clearInterval(timer);
    }, []);

    if (!day) return null;

    const { scheduled, warnings, nowBlockIndex, nowProgress, currentMins } = computeSchedule(day);

    const handleAddBlock = (type: BlockType) => {
        const meta = BLOCK_META[type];
        const defaultDur = type === "nap" ? 60 : 30;
        addBlock(selectedDay, type, `New ${type} block`, defaultDur);
    };

    return (
        <div className="space-y-6 pb-32">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-500">
                        Schedule
                    </h2>
                    <p className="text-zinc-500 mt-1 font-medium">
                        Linear timeline • Click outside to save
                    </p>
                </div>
                <div className="relative">
                    <button
                        onClick={() => setShowPicker(!showPicker)}
                        className="rounded-xl bg-white text-black px-5 py-2.5 font-bold shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] transition-all duration-300 hover:scale-105 cursor-pointer flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Add Block
                    </button>
                    {showPicker && (
                        <BlockTypePicker onSelect={handleAddBlock} onClose={() => setShowPicker(false)} />
                    )}
                </div>
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

            <div className="relative">
                {/* Timeline base line */}
                <div className="absolute left-10 top-0 bottom-0 w-px bg-zinc-900 z-0" />

                <div className="space-y-4 relative z-10">
                    <AnimatePresence mode="popLayout">
                        {scheduled.map((block: any, index: number) => {
                            const isVirtual = !!block.virtual;
                            const isGap = block.type === "free" && isVirtual;
                            const isActive = index === nowBlockIndex;

                            // Render Gap
                            if (isGap) {
                                return (
                                    <motion.div
                                        key={block.id}
                                        layout
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="flex items-center gap-6 py-2"
                                    >
                                        <div className="w-20 text-right text-xs font-bold text-zinc-600 tracking-widest">
                                            {formatTime(block.start)}
                                        </div>
                                        <div className="flex-1 flex items-center gap-4 border-t border-dashed border-zinc-800/50">
                                            <div className="text-xs font-bold text-zinc-600 uppercase tracking-widest bg-black px-2 -ml-2">
                                                {block.dur}m gap
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            }

                            // Render Active "Now" Indicator Line
                            const renderNowLine = isActive && (
                                <div className="absolute left-0 right-0 z-50 pointer-events-none" style={{ top: `${nowProgress * 100}%` }}>
                                    <div className="flex items-center">
                                        <div className="w-20 flex justify-end pr-4">
                                            <div className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(244,63,94,0.5)]">
                                                NOW
                                            </div>
                                        </div>
                                        <div className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)] animate-pulse -ml-[6.5px]" />
                                        <div className="flex-1 h-px bg-gradient-to-r from-rose-500 to-transparent" />
                                    </div>
                                </div>
                            );

                            return (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                    animate={{ opacity: isVirtual ? 0.6 : (block.on === false ? 0.3 : 1), y: 0, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
                                    key={block.id}
                                    className="flex items-stretch gap-6 relative"
                                >
                                    {renderNowLine}

                                    {/* Left Timeline Time */}
                                    <div className="w-20 flex flex-col items-end pt-5 text-sm font-bold text-zinc-500 tracking-wider">
                                        <div className={isActive ? "text-white" : ""}>{formatTime(block.start)}</div>
                                        <div className="text-xs text-zinc-700 mt-1">{formatTime(block.end)}</div>
                                    </div>

                                    {/* Block Card */}
                                    <div 
                                        className={`flex-1 rounded-2xl border p-4 transition-colors duration-300 group relative overflow-hidden backdrop-blur-md
                                            ${isVirtual ? 'border-zinc-900 bg-zinc-900/10' : 'border-zinc-800/50 hover:border-zinc-600/50'}
                                            ${isActive && !isVirtual ? 'shadow-[0_0_30px_rgba(255,255,255,0.05)] border-zinc-700' : ''}
                                        `}
                                        style={!isVirtual ? {
                                            background: `linear-gradient(135deg, ${
                                                BLOCK_META[block.type as keyof typeof BLOCK_META]?.bg || "#111"
                                            } 0%, #050505 100%)`,
                                        } : {}}
                                    >
                                        {isActive && !isVirtual && (
                                            <div 
                                                className="absolute left-0 top-0 bottom-0 bg-white/5 pointer-events-none transition-all duration-1000 ease-linear"
                                                style={{ width: `${nowProgress * 100}%` }}
                                            />
                                        )}

                                        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-[0.02] transition-opacity duration-300 pointer-events-none" />
                                        
                                        <div className="flex items-center justify-between relative z-10 gap-4">
                                            <div className="flex-1 flex items-center">
                                                <div className="flex items-center gap-4 flex-1">
                                                    <div className="text-3xl drop-shadow-md shrink-0">
                                                        {BLOCK_META[block.type as keyof typeof BLOCK_META]?.emoji || "⚡"}
                                                    </div>
                                                    <div className="flex-1">
                                                        {!isVirtual ? (
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
                                                            <div className="font-bold text-xl tracking-tight text-zinc-300 px-0 py-1">
                                                                {block.label}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 text-right shrink-0">
                                                {!isVirtual ? (
                                                    <div className="flex items-center">
                                                        <input
                                                            type="number"
                                                            defaultValue={block.dur}
                                                            onBlur={(e) => {
                                                                const val = Number(e.target.value);
                                                                if (val > 0 && val !== block.dur) {
                                                                    updateBlock(selectedDay, block.id, { dur: val });
                                                                } else if (val <= 0) {
                                                                    e.target.value = block.dur.toString();
                                                                }
                                                            }}
                                                            className={`w-16 bg-transparent border-none px-0 py-1 font-black text-2xl text-right tracking-tighter focus:outline-none focus:ring-0 ${block.on === false ? 'text-zinc-700' : 'text-zinc-300'}`}
                                                        />
                                                        <span className="text-sm font-semibold text-zinc-600 ml-1">m</span>
                                                    </div>
                                                ) : (
                                                    <div className="text-2xl font-black tracking-tighter text-zinc-500">
                                                        {block.dur}
                                                        <span className="text-sm font-semibold text-zinc-700 ml-1">m</span>
                                                    </div>
                                                )}

                                                {!isVirtual && (
                                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button 
                                                            onClick={() => updateBlock(selectedDay, block.id, { on: !block.on })}
                                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${block.on ? 'bg-zinc-300' : 'bg-zinc-800'}`}
                                                        >
                                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-black transition-transform ${block.on ? 'translate-x-6' : 'translate-x-1'}`} />
                                                        </button>

                                                        <div className="flex flex-col gap-1 ml-2 border-l border-zinc-800 pl-3">
                                                            <button onClick={() => moveBlock(selectedDay, block.id, 'up')} className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-white transition">
                                                                <ChevronUp className="w-4 h-4" />
                                                            </button>
                                                            <button onClick={() => moveBlock(selectedDay, block.id, 'down')} className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-white transition">
                                                                <ChevronDown className="w-4 h-4" />
                                                            </button>
                                                        </div>

                                                        {!block.locked && (
                                                            <button onClick={() => removeBlock(selectedDay, block.id)} className="p-2 text-zinc-500 hover:text-rose-500 transition ml-1 cursor-pointer">
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        
                                                        <button 
                                                            onClick={() => setFocusBlock(block.id)}
                                                            className={`p-2 transition ml-1 cursor-pointer rounded-full ${focusBlockId === block.id ? 'bg-rose-500/20 text-rose-500' : 'text-zinc-500 hover:text-white hover:bg-zinc-800'}`}
                                                            title="Focus on this block"
                                                        >
                                                            <Clock className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}