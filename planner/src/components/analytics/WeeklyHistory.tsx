import { useScheduleStore } from "../../store/useScheduleStore";

export default function WeeklyHistory() {
    const { weekHistory } = useScheduleStore();

    if (!weekHistory || weekHistory.length === 0) {
        return null;
    }

    // Sort history from newest to oldest
    const sortedHistory = [...weekHistory].sort((a, b) => new Date(b.dateArchived).getTime() - new Date(a.dateArchived).getTime());

    return (
        <div className="space-y-4">
            <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest pl-2">
                Past Weeks
            </h2>
            
            {sortedHistory.map((snapshot) => {
                const { categoryBreakdown } = snapshot;
                const aimHours = ((categoryBreakdown["aim"] || 0) / 60).toFixed(1);
                const valHours = ((categoryBreakdown["val"] || categoryBreakdown["gaming"] || 0) / 60).toFixed(1);
                const gymHours = ((categoryBreakdown["gym"] || categoryBreakdown["health"] || 0) / 60).toFixed(1);

                return (
                    <div key={snapshot.id} className="glass-card rounded-2xl p-5 relative overflow-hidden group border border-zinc-800/30 hover:border-zinc-700/50 transition-colors">
                        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-zinc-500/20 to-transparent transition-opacity duration-500 opacity-50" />
                        
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-md font-bold text-zinc-300">
                                {snapshot.weekLabel}
                            </h3>
                            <div className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">
                                Score: {snapshot.dayScore}%
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-[#111116] p-3 rounded-xl border border-zinc-900/50">
                                    <div className="text-xs font-medium text-zinc-500 mb-1">Total Sleep</div>
                                    <div className="text-xl font-black text-zinc-200">{snapshot.totalSleepHours}h</div>
                                    <div className="text-[10px] text-zinc-600 font-bold mt-1">Avg {snapshot.avgSleepHours}h/night</div>
                                </div>
                                <div className="bg-[#111116] p-3 rounded-xl border border-rose-900/10">
                                    <div className="text-xs font-medium text-rose-500/70 mb-1">Sleep Debt</div>
                                    <div className="text-xl font-black text-rose-400">{snapshot.sleepDebtHours}h</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <div className="text-center bg-zinc-900/30 rounded-lg p-2 border border-zinc-800/30">
                                    <div className="text-[10px] uppercase font-bold text-zinc-500 mb-1">🎯 Aim</div>
                                    <div className="text-sm font-bold text-zinc-300">{aimHours}h</div>
                                </div>
                                <div className="text-center bg-zinc-900/30 rounded-lg p-2 border border-zinc-800/30">
                                    <div className="text-[10px] uppercase font-bold text-zinc-500 mb-1">🎮 Gaming</div>
                                    <div className="text-sm font-bold text-zinc-300">{valHours}h</div>
                                </div>
                                <div className="text-center bg-zinc-900/30 rounded-lg p-2 border border-zinc-800/30">
                                    <div className="text-[10px] uppercase font-bold text-zinc-500 mb-1">🏋️ Gym</div>
                                    <div className="text-sm font-bold text-zinc-300">{gymHours}h</div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
