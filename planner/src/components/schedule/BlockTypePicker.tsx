import { useState } from "react";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { useScheduleStore } from "../../store/useScheduleStore";
import { nanoid } from "nanoid";
import type { BlockCategory } from "../../types/block";

interface Props {
    onClose: () => void;
}

const PRESET_COLORS = [
    "#0f0f0f", "#0b0818", "#060c18", "#070e07", "#09061c", 
    "#040c07", "#100600", "#100800", "#110004", "#0c0200", 
    "#0d0d0d", "#060611", "#080808", "#1a1025", "#142510"
];

const EMOJI_TABS = [
    { name: "Activity", icon: "⚽", emojis: ["⚽","🏀","🏈","⚾","🎾","🏐","🏉","🎱","🏓","🏸","🥊","🏋","🤸","⛹","🤾","🏊","🚴","🧗","🤺","🏇","⛷","🏂","🪂","🏌","🧘","🛹","🛼","🎿","⛸","🎯","🎮","🕹","🎲","🧩","♟","🎳","🎰"] },
    { name: "Objects", icon: "💼", emojis: ["💼","📁","📂","📝","📒","📕","📗","📘","📙","📓","📔","📚","📖","🔖","📎","📐","📏","✂️","🖊","✏️","🖍","🖌","📌","📍","🔑","🔒","💡","🔧","🔨","⚙️","🧰","🛠","⚒","🧲","🧪","🧫","🔬","🔭","📡","💊","🩺","🧬"] },
    { name: "Food", icon: "🍕", emojis: ["🍕","🍔","🍟","🌭","🌮","🌯","🥗","🥘","🍝","🍜","🍲","🍛","🍣","🍱","🥟","🍳","🥞","🧇","🥐","🍞","🥖","🧀","🥩","🍗","🍖","🥓","🍤","🥚","🥣","🥤","☕","🍵","🧃","🍺","🍷","🥤","🧊","🍰","🎂","🧁","🍩","🍪"] },
    { name: "Faces", icon: "😊", emojis: ["😊","😄","😁","🤣","😂","🙂","😉","😍","🥰","😘","😎","🤓","🧐","🤔","🤗","😤","😠","😈","👿","💀","👻","👽","🤖","💩","😺","😸","😻","🙀","😿","👋","✌️","🤞","🤟","🤘","👍","👏","🙏","💪","🦾","🧠","👀","👁"] },
    { name: "Nature", icon: "🌿", emojis: ["🌿","🍀","🌱","🌲","🌳","🌴","🌵","🌾","🌻","🌺","🌹","🌷","🌸","💐","🍄","🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐮","🐷","🐸","🐵","🦄","🐝","🦋","🐌","🐞","🐢","🦎","🐍","🐠","🐬","🦈","🐳"] },
    { name: "Travel", icon: "✈️", emojis: ["✈️","🚀","🛸","🚁","⛵","🚢","🚂","🚃","🚄","🚅","🚆","🚇","🚈","🚉","🚊","🚋","🚌","🚍","🚎","🚐","🚑","🚒","🚓","🚔","🚕","🚖","🚗","🚘","🚙","🛻","🚚","🛵","🏍","🚲","🛴","🏠","🏡","🏢","🏣","🏥","🏦","🏰"] },
    { name: "Symbols", icon: "⭐", emojis: ["⭐","🌟","✨","💫","⚡","🔥","💥","❤️","🧡","💛","💚","💙","💜","🖤","🤍","💯","✅","❌","⭕","❗","❓","💤","💬","💭","🔔","🔕","🎵","🎶","🏆","🥇","🥈","🥉","🎖","🏅","🎗","⬜","⬛","◻️","◼️","▶️","⏸","⏯"] },
];

export default function BlockTypePicker({ onClose }: Props) {
    const { categories, addCategory, updateCategory, removeCategory } = useScheduleStore();
    const [isAdding, setIsAdding] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingCatId, setEditingCatId] = useState<string | null>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [emojiTab, setEmojiTab] = useState("Activity");
    
    // New Category Form State
    const [newName, setNewName] = useState("");
    const [newEmoji, setNewEmoji] = useState("✨");
    const [newColor, setNewColor] = useState(PRESET_COLORS[0]);

    const openEditForm = (cat: BlockCategory) => {
        setEditingCatId(cat.id);
        setNewName(cat.name);
        setNewEmoji(cat.emoji);
        setNewColor(cat.bg || PRESET_COLORS[0]);
        setIsAdding(false);
    };

    const handleSave = () => {
        if (!newName.trim()) return;
        if (editingCatId) {
            updateCategory(editingCatId, {
                name: newName.trim(),
                emoji: newEmoji,
                bg: newColor
            });
            setEditingCatId(null);
        } else {
            addCategory({
                id: nanoid(6).toLowerCase(),
                name: newName.trim(),
                emoji: newEmoji,
                bg: newColor
            });
            setIsAdding(false);
        }
        setNewName("");
    };

    return (
        <div className="fixed inset-x-4 bottom-4 sm:absolute sm:inset-auto sm:top-full sm:right-0 sm:mt-2 z-[100] p-4 rounded-2xl border border-white/10 bg-black/40 shadow-2xl backdrop-blur-2xl sm:w-[320px] origin-bottom sm:origin-top-right animate-in fade-in slide-in-from-bottom-4 sm:slide-in-from-top-2 duration-300">
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-2xl pointer-events-none" />
            <div className="flex items-center justify-between mb-3 relative z-10">
                <h3 className="text-sm font-bold text-zinc-300">{isEditing ? 'Tap to Edit / Remove' : 'Drag to Timeline'}</h3>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => { setIsEditing(!isEditing); setEditingCatId(null); setIsAdding(false); }} 
                        className={`text-xs font-bold px-2 py-1 rounded-md transition-colors ${isEditing ? 'bg-red-500/20 text-red-400' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'}`}
                    >
                        {isEditing ? 'Done' : 'Edit'}
                    </button>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                        ✕
                    </button>
                </div>
            </div>
            
            <Droppable droppableId="palette" isDropDisabled={true} direction="horizontal">
                {(provided) => (
                    <div 
                        className="grid grid-cols-4 gap-2 relative z-10 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar"
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                    >
                        {categories.map((cat, index) => (
                            <Draggable key={`palette-${cat.id}`} draggableId={`palette-${cat.id}`} index={index}>
                                {(provided, snapshot) => (
                                    <>
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...(isEditing ? {} : provided.dragHandleProps)}
                                            onClick={isEditing ? () => openEditForm(cat) : undefined}
                                            className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300 hover:bg-white/10 border relative backdrop-blur-md
                                                ${isEditing ? 'border-zinc-500/50 hover:border-zinc-400 bg-zinc-900/40 cursor-pointer animate-pulse-subtle' : 'border-white/5 hover:border-white/20 bg-white/5'}
                                                ${snapshot.isDragging ? 'shadow-2xl z-50 scale-110 border-white/40 bg-white/10' : ''}`}
                                            title={isEditing ? `Edit ${cat.name}` : cat.name}
                                        >
                                            {isEditing && (
                                                <div 
                                                    onClick={(e) => { e.stopPropagation(); if (confirm(`Remove "${cat.name}" category?`)) removeCategory(cat.id); }}
                                                    className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[8px] font-bold text-white shadow-lg z-20 hover:bg-red-400 cursor-pointer transition-colors"
                                                    title={`Remove ${cat.name}`}
                                                >
                                                    ✕
                                                </div>
                                            )}
                                            <span className="text-2xl mb-1 drop-shadow-md pointer-events-none">{cat.emoji}</span>
                                            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider pointer-events-none truncate w-full text-center">
                                                {cat.name}
                                            </span>
                                        </div>
                                        {snapshot.isDragging && (
                                            <div className="flex flex-col items-center justify-center p-2 rounded-xl border border-dashed border-zinc-700 opacity-50">
                                                <span className="text-2xl mb-1">{cat.emoji}</span>
                                                <span className="text-[10px] uppercase font-bold text-zinc-500 truncate w-full text-center">{cat.name}</span>
                                            </div>
                                        )}
                                    </>
                                )}
                            </Draggable>
                        ))}
                        {provided.placeholder}
                        
                        {/* Add Button */}
                        {(!isAdding && !editingCatId) && (
                            <div 
                                onClick={() => { setIsAdding(true); setEditingCatId(null); setNewName(""); setNewEmoji("✨"); setNewColor(PRESET_COLORS[0]); }}
                                className="flex flex-col items-center justify-center p-2 rounded-xl border border-dashed border-zinc-800 hover:border-zinc-500 hover:bg-zinc-900 cursor-pointer transition-colors"
                            >
                                <span className="text-2xl mb-1 text-zinc-600">+</span>
                                <span className="text-[10px] uppercase font-bold text-zinc-600">New</span>
                            </div>
                        )}
                    </div>
                )}
            </Droppable>

            {/* Add/Edit Category Form */}
            {(isAdding || editingCatId) && (
                <div className="mt-4 pt-4 border-t border-zinc-800/50 relative z-10 animate-in fade-in slide-in-from-top-2">
                    <div className="flex gap-2 mb-3">
                        <div className="flex-1">
                            <input 
                                type="text" 
                                placeholder="Category Name" 
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-600"
                                autoFocus
                            />
                        </div>
                        <button 
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className={`w-12 h-10 flex items-center justify-center bg-zinc-900 border rounded-lg text-xl transition-all hover:bg-zinc-800 ${showEmojiPicker ? 'border-zinc-500 bg-zinc-800' : 'border-zinc-800'}`}
                        >
                            {newEmoji}
                        </button>
                    </div>

                    {showEmojiPicker && (
                        <div className="mb-3 bg-zinc-900/80 border border-zinc-800 rounded-xl p-2 animate-in fade-in slide-in-from-top-1">
                            <div className="flex gap-1 mb-2 overflow-x-auto pb-1">
                                {EMOJI_TABS.map(tab => (
                                    <button
                                        key={tab.name}
                                        onClick={() => setEmojiTab(tab.name)}
                                        className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${emojiTab === tab.name ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                                    >
                                        {tab.icon} {tab.name}
                                    </button>
                                ))}
                            </div>
                            <div className="grid grid-cols-8 gap-0.5 max-h-[140px] overflow-y-auto custom-scrollbar">
                                {(EMOJI_TABS.find(t => t.name === emojiTab)?.emojis || []).map(emoji => (
                                    <button 
                                        key={emoji}
                                        onClick={() => { setNewEmoji(emoji); setShowEmojiPicker(false); }}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg text-lg hover:bg-zinc-700 transition-colors"
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    <div className="flex flex-wrap gap-1.5 mb-4">
                        {PRESET_COLORS.map(color => (
                            <button
                                key={color}
                                onClick={() => setNewColor(color)}
                                className={`w-5 h-5 rounded-full border-2 transition-all ${newColor === color ? 'border-zinc-400 scale-110' : 'border-transparent hover:scale-110'}`}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                    </div>

                    <div className="flex gap-2">
                        <button 
                            onClick={() => { setIsAdding(false); setEditingCatId(null); }}
                            className="flex-1 py-2 rounded-lg text-xs font-bold text-zinc-500 hover:bg-zinc-900 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleSave}
                            className="flex-1 py-2 rounded-lg text-xs font-bold bg-white text-black hover:bg-zinc-200 transition-colors"
                        >
                            {editingCatId ? 'Save' : 'Create'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
