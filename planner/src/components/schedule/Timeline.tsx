import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { AlertCircle, Trash2, Clock, Plus, GripVertical } from "lucide-react";
import { computeSchedule } from "../../engine/computeSchedule";
import { useScheduleStore } from "../../store/useScheduleStore";
import { formatTime } from "../../utils/formatTime";
import { getDateForDayKey, getDaysDiff } from "../../utils/dateUtils";
import BlockTypePicker from "./BlockTypePicker";
import type { BlockType } from "../../types/block";

import { nanoid } from "nanoid";

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

export default function Timeline() {
    const { week, selectedDay, updateBlock, removeBlock, reorderBlocks, insertBlock, setFocusBlock, focusBlockId, calendarEvents, categories } = useScheduleStore();
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

    const days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
    const currentIdx = days.indexOf(selectedDay);
    const prevDayKey = days[(currentIdx - 1 + 7) % 7] as keyof typeof week;
    const prevDayData = week[prevDayKey];
    
    const refDate = getDateForDayKey(selectedDay);
    const prevRefDate = getDateForDayKey(prevDayKey);
    
    // We need to compute prev day to get its carry over
    const prevResult = computeSchedule(prevDayData, [], { referenceDate: prevRefDate });

    const { scheduled, warnings, nowBlockIndex, nowProgress } = computeSchedule(day, todaysEvents, {
        referenceDate: refDate,
        prevDayCarryOver: prevResult.carryOverForNextDay
    });

    const onDragEnd = (result: DropResult) => {
        const { source, destination, draggableId } = result;

        if (!destination) return;
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        const draggableBlocks = scheduled.filter((b: any) => !b.virtual);

        if (source.droppableId === "palette" && destination.droppableId === "timeline") {
            const type = draggableId.replace("palette-", "") as BlockType;
            const newId = nanoid();
            const orderedIds = draggableBlocks.map((b: any) => b.id);
            orderedIds.splice(destination.index, 0, newId);
            insertBlock(selectedDay, type, newId, orderedIds);
            setShowPicker(false);
            return;
        }

        if (source.droppableId === "timeline" && destination.droppableId === "timeline") {
            const orderedIds = draggableBlocks.map((b: any) => b.id);
            const [removed] = orderedIds.splice(source.index, 1);
            orderedIds.splice(destination.index, 0, removed);
            reorderBlocks(selectedDay, orderedIds);
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
                            className="rounded-xl bg-white text-black px-3 py-2 sm:px-5 sm:py-2.5 font-bold shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] transition-all duration-300 hover:scale-105 cursor-pointer flex items-center gap-1 sm:gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            <span className="hidden sm:inline">Add Block</span>
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

                                        if (isGap) {
                                            const nextBlock = scheduled.find((b: any, i: number) => i > index && !b.virtual);
                                            const causedByManualBuffer = nextBlock && (nextBlock as any).actualStart != null;
                                            
                                            return (
                                                <div key={`gap-${index}`} className="flex items-center gap-3 sm:gap-6 py-2 group/gap">
                                                    <div className="w-12 sm:w-16 text-right text-xs font-bold text-zinc-600 tracking-widest shrink-0">
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

                                        const renderNowLine = isActive && (
                                            <div className="absolute left-0 right-0 z-50 pointer-events-none" style={{ top: `${nowProgress * 100}%` }}>
                                                <div className="flex items-center">
                                                    <div className="w-12 sm:w-16 flex justify-end pr-2 sm:pr-4 shrink-0">
                                                        <div className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(244,63,94,0.5)]">
                                                            NOW
                                                        </div>
                                                    </div>
                                                    <div className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)] animate-pulse -ml-[6.5px]" />
                                                    <div className="flex-1 h-px bg-gradient-to-r from-rose-500 to-transparent" />
                                                </div>
                                            </div>
                                        );

                                        const isEditableVirtual = isVirtual && !isGoogle && !isGap && !block.carryOver;
                                        const canEditTime = !isVirtual || isGoogle || isEditableVirtual;
                                        const canEditDur = !isVirtual || isGoogle || isEditableVirtual;
                                        const canEditLabel = !isVirtual;

                                        const renderBlockContent = (isDragging = false) => (
                                            <div className={`flex items-stretch gap-4 sm:gap-6 relative ${isVirtual && !isEditableVirtual ? 'opacity-50' : isEditableVirtual ? 'opacity-70' : (block.on === false ? 'opacity-40' : '')} ${isDragging ? 'shadow-2xl scale-105 z-50' : ''}`}>
                                                {renderNowLine}

                                                {/* Left Timeline Time + Date */}
                                                <div className="w-28 flex flex-col items-end pt-4 text-sm font-bold text-zinc-500 tracking-wider relative group/time shrink-0">
                                                    {canEditTime ? (
                                                        <>
                                                            <input 
                                                                type="text" 
                                                                inputMode="numeric"
                                                                defaultValue={minsToTimeStr(block.start)}
                                                                key={`time-${block.id}-${block.start}`}
                                                                placeholder="HH:MM"
                                                                onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                                                                onBlur={(e) => {
                                                                    const val = e.target.value.trim();
                                                                    let minsOfDay = timeStrToMins(val);
                                                                    if (minsOfDay === null) {
                                                                        const numVal = parseInt(val, 10);
                                                                        if (!isNaN(numVal) && numVal >= 0 && numVal <= 47) {
                                                                            minsOfDay = numVal * 60;
                                                                        }
                                                                    }
                                                                    if (minsOfDay !== null) {
                                                                        let extraDays = Math.floor(minsOfDay / 1440);
                                                                        minsOfDay = minsOfDay % 1440;
                                                                        
                                                                        let blockDateStr = block.actualStartDate || refDate;
                                                                        
                                                                        if (extraDays > 0) {
                                                                            const d = new Date(refDate);
                                                                            d.setDate(d.getDate() + extraDays);
                                                                            blockDateStr = d.toISOString().split("T")[0];
                                                                        } else {
                                                                            const currentMinsOfDay = ((block.start % 1440) + 1440) % 1440;
                                                                            if (minsOfDay < 360 && currentMinsOfDay >= 720 && !block.actualStartDate) {
                                                                                const nextDay = new Date(refDate);
                                                                                nextDay.setDate(nextDay.getDate() + 1);
                                                                                blockDateStr = nextDay.toISOString().split("T")[0];
                                                                            }
                                                                        }
                                                                        
                                                                        const dayDiff = getDaysDiff(blockDateStr, refDate);
                                                                        const absoluteMins = dayDiff * 1440 + minsOfDay;
                                                                        
                                                                        if (isGoogle) {
                                                                            useScheduleStore.getState().syncCalendarEventUpdate(block.originalEvent.id, { startMins: absoluteMins, endMins: absoluteMins + block.dur });
                                                                        } else if (!isVirtual) {
                                                                            updateBlock(selectedDay, block.id, { actualStart: minsOfDay, actualStartDate: blockDateStr });
                                                                        }
                                                                    } else {
                                                                        e.target.value = minsToTimeStr(block.start);
                                                                    }
                                                                }}
                                                                className={`w-full bg-transparent text-right border-none p-0 focus:outline-none focus:ring-0 text-[13px] tabular-nums ${isActive ? "text-white" : isEditableVirtual ? "text-zinc-600" : "text-zinc-500"} hover:text-white cursor-pointer transition-all`}
                                                                title="Edit start time (24h, e.g. 21:00)"
                                                            />
                                                            <div className="text-[10px] text-zinc-600 mt-0.5 tabular-nums text-right w-full">
                                                                {(() => {
                                                                    const dateStr = block.actualStartDate || refDate;
                                                                    const d = new Date(dateStr + "T00:00:00");
                                                                    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
                                                                })()}
                                                            </div>
                                                            {!isEditableVirtual && (
                                                                <input
                                                                    type="date"
                                                                    value={block.actualStartDate || refDate}
                                                                    onChange={(e) => {
                                                                        const newDate = e.target.value;
                                                                        if (!newDate) return;
                                                                        const currentMinsOfDay = ((block.start % 1440) + 1440) % 1440;
                                                                        const dayDiff = getDaysDiff(newDate, refDate);
                                                                        const absoluteMins = dayDiff * 1440 + currentMinsOfDay;
                                                                        if (isGoogle) {
                                                                            useScheduleStore.getState().syncCalendarEventUpdate(block.originalEvent.id, { startMins: absoluteMins, endMins: absoluteMins + block.dur });
                                                                        } else {
                                                                            updateBlock(selectedDay, block.id, { actualStart: currentMinsOfDay, actualStartDate: newDate });
                                                                        }
                                                                    }}
                                                                    className="text-[10px] bg-transparent border-none p-0 text-right focus:ring-0 text-zinc-700 hover:text-white cursor-pointer mt-0.5 w-full opacity-0 group-hover/time:opacity-100 transition-opacity [&::-webkit-calendar-picker-indicator]:invert-[0.4] [&::-webkit-calendar-picker-indicator]:opacity-50 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
                                                                    title="Change date"
                                                                />
                                                            )}
                                                        </>
                                                    ) : (
                                                        <div className={isActive ? "text-white flex flex-col items-end" : "flex flex-col items-end"}>
                                                            <span>{formatTime(block.start)}</span>
                                                            {block.carryOver && (
                                                                <span className="text-[9px] font-bold text-indigo-400/70 uppercase tracking-widest mt-1 bg-indigo-500/10 px-1 rounded border border-indigo-500/20">
                                                                    ↩ Prev
                                                                </span>
                                                            )}
                                                            {!block.carryOver && Math.floor(block.start / 1440) !== 0 && (
                                                                <span className="text-[10px] text-zinc-600 mt-1 font-bold">
                                                                    {Math.floor(block.start / 1440) < 0 ? 'Prev Day' : Math.floor(block.start / 1440) === 1 ? 'Next Day' : `+${Math.floor(block.start / 1440)} Days`}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                    <div className="text-[11px] text-zinc-700 mt-1 tabular-nums">{formatTime(block.end)}</div>
                                                </div>

                                                {/* Block Card */}
                                                <div 
                                                    onClick={() => { if (!isVirtual || isGoogle) setFocusBlock(focusBlockId === block.id ? null : block.id); }}
                                                    className={`flex-1 rounded-2xl border p-3 sm:p-4 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group relative overflow-hidden backdrop-blur-2xl ${(!isVirtual || isGoogle || isEditableVirtual) ? 'cursor-pointer' : ''}
                                                        ${isVirtual && !isGoogle ? `border-zinc-900/50 ${isEditableVirtual ? 'bg-zinc-900/20 hover:border-zinc-700/50' : 'bg-zinc-900/10'}` : ''}
                                                        ${!isVirtual ? 'glass-card hover:border-white/20' : ''}
                                                        ${isGoogle ? 'border-zinc-800/80 shadow-lg' : ''}
                                                        ${isActive && !isVirtual ? 'shadow-[0_0_30px_rgba(255,255,255,0.05)] border-zinc-500 scale-[1.01]' : 'border-white/5'}
                                                        ${isDragging ? 'border-zinc-400 shadow-[0_0_40px_rgba(0,0,0,0.5)] scale-105 z-50' : ''}
                                                        ${(!isVirtual || isGoogle) && focusBlockId === block.id ? 'ring-1 ring-indigo-500/60 border-indigo-500/40 shadow-[0_0_30px_rgba(99,102,241,0.15)] scale-[1.02] z-40' : ''}
                                                    `}
                                                    style={isGoogle ? {
                                                        background: `linear-gradient(135deg, ${block.color}15 0%, rgba(5,5,5,0.5) 100%)`,
                                                        borderColor: `${block.color}30`
                                                    } : (!isVirtual ? {
                                                        background: `linear-gradient(135deg, ${
                                                            categories.find(c => c.id === block.type)?.bg || "#111"
                                                        }aa 0%, rgba(255,255,255,0.02) 100%)`,
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
                                                            <div className={`text-3xl drop-shadow-md shrink-0 pointer-events-none ${isEditableVirtual ? 'text-2xl opacity-70' : ''}`}>
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
                                                                    categories.find(c => c.id === block.type)?.emoji || "⚡"
                                                                )}
                                                            </div>
                                                            <div className="flex-1">
                                                                {canEditLabel ? (
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
                                                                    <div className={`font-bold tracking-tight px-0 py-1 ${isEditableVirtual ? 'text-lg text-zinc-500' : 'text-xl text-zinc-300'}`} style={isGoogle ? { color: block.color } : {}}>
                                                                        {block.label}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-4 text-right shrink-0">
                                                            {canEditDur ? (
                                                                <div className="flex items-center group/dur">
                                                                    <input
                                                                        type="text"
                                                                        inputMode="numeric"
                                                                        pattern="[0-9]*"
                                                                        defaultValue={block.dur}
                                                                        key={`dur-${block.id}-${block.dur}`}
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === 'Enter') {
                                                                                e.currentTarget.blur();
                                                                            }
                                                                        }}
                                                                        onBlur={(e) => {
                                                                            const val = parseInt(e.target.value, 10);
                                                                            if (!isNaN(val) && val > 0 && val !== block.dur) {
                                                                                if (isGoogle) {
                                                                                    useScheduleStore.getState().syncCalendarEventUpdate(block.originalEvent.id, { endMins: block.start + val });
                                                                                } else if (isEditableVirtual && block.id.startsWith("commute")) {
                                                                                    if (block.id === "commute-home") {
                                                                                        useScheduleStore.getState().updateCommute(selectedDay, Math.max(0, val - 15));
                                                                                    } else {
                                                                                        useScheduleStore.getState().updateCommute(selectedDay, val);
                                                                                    }
                                                                                } else if (!isVirtual) {
                                                                                    updateBlock(selectedDay, block.id, { dur: val });
                                                                                }
                                                                            } else {
                                                                                e.target.value = block.dur.toString();
                                                                            }
                                                                        }}
                                                                        className={`w-16 bg-transparent border-none p-0 text-right font-black tracking-tighter focus:outline-none focus:ring-0 ${isEditableVirtual ? 'text-xl text-zinc-600 hover:text-zinc-400' : block.on === false ? 'text-zinc-700 text-2xl' : 'text-zinc-300 hover:text-white text-2xl'} border-b border-transparent hover:border-dashed hover:border-zinc-500 transition-all cursor-pointer`}
                                                                        title="Edit duration"
                                                                    />
                                                                    <span className={`text-sm font-semibold ml-1 ${isEditableVirtual ? 'text-zinc-700' : 'text-zinc-600'}`}>m</span>
                                                                </div>
                                                            ) : (
                                                                <div className="text-2xl font-black tracking-tighter text-zinc-600">
                                                                    {block.allDay ? "All Day" : block.dur}
                                                                    {!block.allDay && <span className="text-sm font-semibold text-zinc-700 ml-1">m</span>}
                                                                </div>
                                                            )}

                                                            {(!isVirtual || isEditableVirtual) && (
                                                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    {!isEditableVirtual && (
                                                                        <button 
                                                                            onClick={() => updateBlock(selectedDay, block.id, { on: !block.on })}
                                                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${block.on ? 'bg-zinc-300' : 'bg-zinc-800'}`}
                                                                        >
                                                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-black transition-transform ${block.on ? 'translate-x-6' : 'translate-x-1'}`} />
                                                                        </button>
                                                                    )}

                                                                    {(!block.locked || isEditableVirtual) && (
                                                                        <button onClick={() => {
                                                                            if (isEditableVirtual && block.id.startsWith("commute")) {
                                                                                useScheduleStore.getState().updateCommute(selectedDay, 0);
                                                                            } else if (!isVirtual) {
                                                                                removeBlock(selectedDay, block.id);
                                                                            }
                                                                        }} className="p-2 text-zinc-500 hover:text-rose-500 transition ml-1 cursor-pointer">
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </button>
                                                                    )}
                                                                    
                                                                    {!isEditableVirtual && (
                                                                        <button 
                                                                            onClick={() => setFocusBlock(block.id)}
                                                                            className={`p-2 transition ml-1 cursor-pointer rounded-full ${focusBlockId === block.id ? 'bg-rose-500/20 text-rose-500' : 'text-zinc-500 hover:text-white hover:bg-zinc-800'}`}
                                                                            title="Focus on this block"
                                                                        >
                                                                            <Clock className="w-4 h-4" />
                                                                        </button>
                                                                    )}
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