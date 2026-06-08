import { Droppable, Draggable } from "@hello-pangea/dnd";
import { BLOCK_META } from "../../constants/blockTypes";
import type { BlockType } from "../../types/block";

interface Props {
    onClose: () => void;
}

export default function BlockTypePicker({ onClose }: Props) {
    return (
        <div className="absolute top-full right-0 mt-2 z-50 p-4 rounded-2xl border border-zinc-800 bg-[#0a0a0a] shadow-2xl backdrop-blur-xl w-[280px] origin-top-right animate-in fade-in zoom-in duration-200">
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-2xl pointer-events-none" />
            <div className="flex items-center justify-between mb-3 relative z-10">
                <h3 className="text-sm font-bold text-zinc-300">Drag to Timeline</h3>
                <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                    ✕
                </button>
            </div>
            
            <Droppable droppableId="palette" isDropDisabled={true} direction="horizontal">
                {(provided) => (
                    <div 
                        className="grid grid-cols-4 gap-2 relative z-10"
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                    >
                        {(Object.entries(BLOCK_META) as [BlockType, typeof BLOCK_META[BlockType]][]).map(([type, meta], index) => (
                            <Draggable key={`palette-${type}`} draggableId={`palette-${type}`} index={index}>
                                {(provided, snapshot) => (
                                    <>
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 hover:bg-zinc-800 border border-transparent hover:border-zinc-700 bg-[#0a0a0a] ${snapshot.isDragging ? 'shadow-2xl z-50 scale-110 border-zinc-500' : ''}`}
                                            title={type}
                                        >
                                            <span className="text-2xl mb-1 drop-shadow-md pointer-events-none">{meta.emoji}</span>
                                            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider pointer-events-none">
                                                {type}
                                            </span>
                                        </div>
                                        {snapshot.isDragging && (
                                            <div className="flex flex-col items-center justify-center p-2 rounded-xl border border-dashed border-zinc-700 opacity-50">
                                                <span className="text-2xl mb-1">{meta.emoji}</span>
                                                <span className="text-[10px] uppercase font-bold text-zinc-500">{type}</span>
                                            </div>
                                        )}
                                    </>
                                )}
                            </Draggable>
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </div>
    );
}
