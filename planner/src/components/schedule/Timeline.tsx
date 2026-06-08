import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { AlertCircle, Trash2, Clock, Plus, GripVertical } from "lucide-react";
import { computeSchedule } from "../../engine/computeSchedule";
import { useScheduleStore } from "../../store/useScheduleStore";
import { formatTime } from "../../utils/formatTime";
import { BLOCK_META } from "../../constants/blockTypes";
import BlockTypePicker from "./BlockTypePicker";
import type { BlockType } from "../../types/block";

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

export default function Timeline() {
    const { week, selectedDay, updateBlock, removeBlock, reorderBlocks, insertBlock, setFocusBlock, focusBlockId, calendarEvents } = useScheduleStore();
    const day = week[selectedDay];
    const [showPicker, setShowPicker] = useState(false);
    const [, setTick] = useState(0);

    // Force re-render every minute to keep "Now" indicator accurate
    useEffect(() => {
        const timer = setInterval(() => setTick(t => t + 1), 60000);
        return () => clearInterval(timer);
    }, []);

    if (!day) return null;

    const isToday = selectedDay === new Date().toLocaleDateString("en-US", { weekday: "short" }).toLowerCase();
    const todaysEvents = isToday ? calendarEvents : [];

    const { scheduled, warnings, nowBlockIndex, nowProgress } = computeSchedule(day, todaysEvents);

    const onDragEnd = (result: DropResult) => {
        const { source, destination, draggableId } = result;

        if (!destination) return;
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        // Calculate real block index for destination
        let realDestIndex = 0;
        for (let i = 0; i < destination.index; i++) {
            if (!scheduled[i].virtual) realDestIndex++;
        }

        if (source.droppableId === "palette" && destination.droppableId === "timeline") {
            const type = draggableId.replace("palette-", "") as BlockType;
            insertBlock(selectedDay, type, realDestIndex);
            setShowPicker(false);
            return;
        }

        if (source.droppableId === "timeline" && destination.droppableId === "timeline") {
            let realSourceIndex = 0;
            for (let i = 0; i < source.index; i++) {
                if (!scheduled[i].virtual) realSourceIndex++;
            }
            reorderBlocks(selectedDay, realSourceIndex, realDestIndex);
        }
    };

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="space-y-6 pb-32 no-select">
                <div className="flex items-center justify-between relative z-50">
                    <div>
                        <h2 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-500">
                            Schedule
                        </h2>
                        <p className="text-zinc-500 mt-1 font-medium text-sm">
                            Edit start times to add buffers • Drag icons to insert
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
                            <BlockTypePicker onClose={() => setShowPicker(false)} />
                        )}
                    </div>
                </div>

                {warnings.length > 0 && (
                    <div className="space-y-2 mb-4">
                        {warnings.map((warn, i) => (
                            <div 
                                key={i} 
                                className="rounded-xl border border-rose-900/50 bg-rose-950/20 p-4 flex items-center gap-3 text-rose-400 animate-in slide-in-from-top-2"
                            >
                                <AlertCircle className="w-5 h-5 shrink-0" />
                                <span className="font-medium text-sm leading-tight">{warn}</span>
                            </div>
                        ))}
                    </div>
                )}

                <div className="relative">
                    {/* Timeline base line */}
                    <div className="absolute left-10 top-0 bottom-0 w-px bg-zinc-900 z-0" />

                    <Droppable droppableId="timeline">
                        {(provided) => (
                            <div 
                                className="space-y-4 relative z-10 min-h-[200px]"
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                            >
                                {(() => {
                                    let draggableIndex = 0;
                                    return scheduled.map((block: any, index: number) => {
                                        const isVirtual = !!block.virtual;
                                        const isGap = block.type === "free" && isVirtual && block.source !== "google";
                                        const isGoogle = block.source === "google";
                                        const isActive = index === nowBlockIndex;

                                        // Render Gap
                                        if (isGap) {
                                            // Check if this gap is caused by the next block having an actualStart
                                            const nextBlock = scheduled.find((b: any, i: number) => i > index && !b.virtual);
                                            const causedByManualBuffer = nextBlock && (nextBlock as any).actualStart != null;
                                            
                                            return (
                                                <div key={`gap-${index}`} className="flex items-center gap-6 py-2 group/gap">
                                                    <div className="w-20 text-right text-xs font-bold text-zinc-600 tracking-widest">
                                                        {formatTime(block.start)}
                                                    </div>
                                                    <div className="flex-1 flex items-center gap-4 border-t border-dashed border-zinc-800/50 relative">
                                                        <div className="text-xs font-bold text-zinc-600 uppercase tracking-widest bg-black px-2 -ml-2">
                                                            {block.dur}m buffer
                                                        </div>
                                                        
                                                        {causedByManualBuffer && (
                                                            <button 
                                                                onClick={() => updateBlock(selectedDay, nextBlock.id, { actualStart: null })}
                                                                className="absolute right-0 top-1/2 -translate-y-1/2 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white border border-rose-500/20 text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full transition-all opacity-0 group-hover/gap:opacity-100 flex items-center gap-1"
                                                                title="Delete buffer and snap schedule up"
                                                            >
                                                                <span>✕ Close Gap</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
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

                                        // Render block content
                                        const renderBlockContent = (isDragging = false) => (
                                            <div className={`flex items-stretch gap-6 relative ${isVirtual ? 'opacity-60' : (block.on === false ? 'opacity-40' : '')} ${isDragging ? 'shadow-2xl scale-105 z-50' : ''}`}>
                                                {renderNowLine}

                                                {/* Left Timeline Time - Editable Start Time */}
                                                <div className="w-20 flex flex-col items-end pt-5 text-sm font-bold text-zinc-500 tracking-wider relative group/time">
                                                    {!isVirtual || isGoogle ? (
                                                        <input 
                                                            type="time" 
                                                            value={minsToTimeStr(block.start)}
                                                            onChange={(e) => {
                                                                const mins = timeStrToMins(e.target.value);
                                                                if (mins !== null) {
                                                                    if (isGoogle) {
                                                                        useScheduleStore.getState().syncCalendarEventUpdate(block.originalEvent.id, { startMins: mins, endMins: mins + block.dur });
                                                                    } else {
                                                                        updateBlock(selectedDay, block.id, { actualStart: mins });
                                                                    }
                                                                }
                                                            }}
                                                            className={`w-full bg-transparent text-right border-none p-0 focus:outline-none focus:ring-0 ${isActive ? "text-white" : "text-zinc-500"} hover:text-white cursor-pointer hover:border-b hover:border-dashed hover:border-zinc-500 transition-all`}
                                                            title="Edit start time"
                                                        />
                                                    ) : (
                                                        <div className={isActive ? "text-white" : ""}>{formatTime(block.start)}</div>
                                                    )}
                                                    <div className="text-xs text-zinc-700 mt-1">{formatTime(block.end)}</div>
                                                </div>

                                                {/* Block Card */}
                                                <div 
                                                    onClick={() => { if (!isVirtual || isGoogle) setFocusBlock(focusBlockId === block.id ? null : block.id); }}
                                                    className={`flex-1 rounded-2xl border p-4 transition-all duration-300 group relative overflow-hidden backdrop-blur-md ${(!isVirtual || isGoogle) ? 'cursor-pointer' : ''}
                                                        ${isVirtual && !isGoogle ? 'border-zinc-900 bg-zinc-900/10' : ''}
                                                        ${isGoogle ? 'border-zinc-800/80 shadow-lg' : ''}
                                                        ${!isVirtual ? 'border-zinc-800/50 hover:border-zinc-600/50' : ''}
                                                        ${isActive && !isVirtual ? 'shadow-[0_0_30px_rgba(255,255,255,0.05)] border-zinc-700' : ''}
                                                        ${isDragging ? 'border-zinc-500 shadow-[0_0_40px_rgba(0,0,0,0.5)]' : ''}
                                                        ${(!isVirtual || isGoogle) && focusBlockId === block.id ? 'ring-1 ring-indigo-500/60 border-indigo-500/40 shadow-[0_0_20px_rgba(99,102,241,0.15)]' : ''}
                                                    `}
                                                    style={isGoogle ? {
                                                        background: `linear-gradient(135deg, ${block.color}15 0%, #050505 100%)`,
                                                        borderColor: `${block.color}30`
                                                    } : (!isVirtual ? {
                                                        background: `linear-gradient(135deg, ${
                                                            BLOCK_META[block.type as keyof typeof BLOCK_META]?.bg || "#111"
                                                        } 0%, #050505 100%)`,
                                                    } : {})}
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
                                                            <div className="text-3xl drop-shadow-md shrink-0 pointer-events-none">
                                                                {isGoogle ? (
                                                                    <div className="w-8 h-8 rounded bg-zinc-900 flex items-center justify-center border" style={{ borderColor: `${block.color}50`, color: block.color }}>
                                                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                                                            <line x1="16" y1="2" x2="16" y2="6" />
                                                                            <line x1="8" y1="2" x2="8" y2="6" />
                                                                            <line x1="3" y1="10" x2="21" y2="10" />
                                                                        </svg>
                                                                    </div>
                                                                ) : (
                                                                    BLOCK_META[block.type as keyof typeof BLOCK_META]?.emoji || "⚡"
                                                                )}
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
                                                                    <div className="font-bold text-xl tracking-tight text-zinc-300 px-0 py-1" style={isGoogle ? { color: block.color } : {}}>
                                                                        {block.label}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-4 text-right shrink-0">
                                                            {!isVirtual || isGoogle ? (
                                                                <div className="flex items-center group/dur">
                                                                    <input
                                                                        type="number"
                                                                        defaultValue={block.dur}
                                                                        onBlur={(e) => {
                                                                            const val = Number(e.target.value);
                                                                            if (val > 0 && val !== block.dur) {
                                                                                if (isGoogle) {
                                                                                    useScheduleStore.getState().syncCalendarEventUpdate(block.originalEvent.id, { endMins: block.start + val });
                                                                                } else {
                                                                                    updateBlock(selectedDay, block.id, { dur: val });
                                                                                }
                                                                            } else if (val <= 0) {
                                                                                e.target.value = block.dur.toString();
                                                                            }
                                                                        }}
                                                                        className={`w-12 bg-transparent border-none p-0 text-right font-black text-2xl tracking-tighter focus:outline-none focus:ring-0 ${block.on === false ? 'text-zinc-700' : 'text-zinc-300 hover:text-white border-b border-transparent hover:border-dashed hover:border-zinc-500 transition-all cursor-pointer'}`}
                                                                        title="Edit duration"
                                                                    />
                                                                    <span className="text-sm font-semibold text-zinc-600 ml-1">m</span>
                                                                </div>
                                                            ) : (
                                                                <div className="text-2xl font-black tracking-tighter text-zinc-500">
                                                                    {block.allDay ? "All Day" : block.dur}
                                                                    {!block.allDay && <span className="text-sm font-semibold text-zinc-700 ml-1">m</span>}
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
                                            </div>
                                        );

                                        // If virtual, it's not draggable
                                        if (isVirtual) {
                                            return <div key={`virtual-${index}`}>{renderBlockContent(false)}</div>;
                                        }

                                        // If real, wrap in Draggable
                                        const currentIndex = draggableIndex++;
                                        return (
                                            <Draggable key={block.id} draggableId={block.id} index={currentIndex}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        className="relative"
                                                    >
                                                        <div 
                                                            {...provided.dragHandleProps} 
                                                            className={`absolute -left-6 top-1/2 -translate-y-1/2 p-2 text-zinc-600 hover:text-white transition-colors cursor-grab active:cursor-grabbing ${snapshot.isDragging ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}
                                                        >
                                                            <GripVertical className="w-4 h-4" />
                                                        </div>
                                                        {renderBlockContent(snapshot.isDragging)}
                                                    </div>
                                                )}
                                            </Draggable>
                                        );
                                    });
                                })()}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </div>
            </div>
        </DragDropContext>
    );
}