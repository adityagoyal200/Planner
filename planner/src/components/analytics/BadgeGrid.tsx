import { useScheduleStore } from "../../store/useScheduleStore";
import { ALL_BADGES, checkBadges } from "../../engine/badgeEngine";

export default function BadgeGrid() {
    const { week, streak, earnedBadges } = useScheduleStore();
    
    const currentlyEarned = checkBadges(week, streak);
    const earnedSet = new Set([...currentlyEarned, ...earnedBadges.map(b => b.id)]);

    return (
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-pink-500/20 to-transparent" />
            
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-zinc-300">Achievements</h3>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    {earnedSet.size} / {ALL_BADGES.length} unlocked
                </span>
            </div>

            <div className="grid grid-cols-4 gap-3">
                {ALL_BADGES.map((badge) => {
                    const unlocked = earnedSet.has(badge.id);

                    return (
                        <div 
                            key={badge.id} 
                            className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all duration-300 group/badge cursor-default ${
                                unlocked 
                                    ? "bg-zinc-900/50 border-zinc-700/50 hover:border-zinc-600" 
                                    : "bg-zinc-950/50 border-zinc-900/30 opacity-40 grayscale"
                            }`}
                            title={unlocked ? `${badge.name}: ${badge.description}` : `🔒 ${badge.description}`}
                        >
                            <div className={`text-2xl transition-transform duration-300 ${unlocked ? 'group-hover/badge:scale-125' : ''}`}>
                                {unlocked ? badge.icon : "🔒"}
                            </div>
                            <div className={`text-[9px] font-bold text-center leading-tight ${unlocked ? 'text-zinc-400' : 'text-zinc-700'}`}>
                                {badge.name}
                            </div>
                            
                            {/* Tooltip on hover */}
                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-zinc-900 border border-zinc-700 px-3 py-1.5 rounded-lg text-[10px] text-zinc-300 font-medium whitespace-nowrap opacity-0 group-hover/badge:opacity-100 transition-opacity pointer-events-none z-20 shadow-xl">
                                {unlocked ? badge.description : `🔒 ${badge.condition}`}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
