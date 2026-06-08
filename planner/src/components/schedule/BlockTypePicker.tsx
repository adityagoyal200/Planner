import { BLOCK_META } from "../../constants/blockTypes";
import type { BlockType } from "../../types/block";

interface Props {
    onSelect: (type: BlockType) => void;
    onClose: () => void;
}

export default function BlockTypePicker({ onSelect, onClose }: Props) {
    return (
        <div className="absolute top-full right-0 mt-2 z-50 p-4 rounded-2xl border border-zinc-800 bg-[#0a0a0a] shadow-2xl backdrop-blur-xl w-64 origin-top-right animate-in fade-in zoom-in duration-200">
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-2xl pointer-events-none" />
            <div className="flex items-center justify-between mb-3 relative z-10">
                <h3 className="text-sm font-bold text-zinc-300">Choose Type</h3>
                <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                    ✕
                </button>
            </div>
            
            <div className="grid grid-cols-4 gap-2 relative z-10">
                {(Object.entries(BLOCK_META) as [BlockType, typeof BLOCK_META[BlockType]][]).map(([type, meta]) => (
                    <button
                        key={type}
                        onClick={() => {
                            onSelect(type);
                            onClose();
                        }}
                        className="flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 hover:scale-105 hover:bg-zinc-800 border border-transparent hover:border-zinc-700"
                        title={type}
                    >
                        <span className="text-2xl mb-1 drop-shadow-md">{meta.emoji}</span>
                        <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                            {type}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}
