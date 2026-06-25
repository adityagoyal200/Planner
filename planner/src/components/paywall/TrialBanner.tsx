import { useSubscriptionStore } from "../../store/useSubscriptionStore";

export default function TrialBanner() {
    const tier = useSubscriptionStore((s) => s.tier);
    const isTrialActive = useSubscriptionStore((s) => s.isTrialActive());
    const trialDaysRemaining = useSubscriptionStore((s) => s.trialDaysRemaining());
    const openUpgradeModal = useSubscriptionStore((s) => s.openUpgradeModal);

    if (tier === "pro") {
        return (
            <div className="glass-card rounded-2xl p-4 mb-6 border border-emerald-500/20 relative overflow-hidden group">
                <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-emerald-500/10 blur-2xl group-hover:bg-emerald-500/20 transition-all duration-500" />
                <div className="flex items-center gap-3 relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-400 to-teal-500 flex items-center justify-center text-lg shadow-lg shadow-emerald-500/10">
                        👑
                    </div>
                    <div>
                        <div className="text-xs font-black text-emerald-400 uppercase tracking-widest">Pro Subscriber</div>
                        <div className="text-[10px] text-zinc-500 font-medium">All premium features unlocked</div>
                    </div>
                </div>
            </div>
        );
    }

    if (isTrialActive) {
        return (
            <div className="glass-card rounded-2xl p-4 mb-6 border border-indigo-500/20 relative overflow-hidden group">
                <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-indigo-500/10 blur-2xl group-hover:bg-indigo-500/20 transition-all duration-500" />
                <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-lg shadow-lg shadow-indigo-500/10">
                            ⏳
                        </div>
                        <div>
                            <div className="text-xs font-black text-white uppercase tracking-wider">Pro Free Trial</div>
                            <div className="text-[10px] text-indigo-400 font-extrabold uppercase tracking-widest">{trialDaysRemaining} days remaining</div>
                        </div>
                    </div>
                    <button
                        onClick={() => openUpgradeModal()}
                        className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-[10px] font-black uppercase tracking-wider text-white hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                    >
                        Upgrade
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="glass-card rounded-2xl p-4 mb-6 border border-rose-500/20 relative overflow-hidden group">
            <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-rose-500/10 blur-2xl group-hover:bg-rose-500/20 transition-all duration-500" />
            <div className="flex flex-col gap-3 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-orange-500 flex items-center justify-center text-lg shadow-lg shadow-rose-500/10">
                        🔒
                    </div>
                    <div>
                        <div className="text-xs font-black text-rose-400 uppercase tracking-wider">Free Tier (Limited)</div>
                        <div className="text-[10px] text-zinc-500 font-medium">Trial period has expired</div>
                    </div>
                </div>
                <button
                    onClick={() => openUpgradeModal()}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-xs font-black uppercase tracking-wider text-white hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-indigo-500/20 cursor-pointer text-center"
                >
                    Unlock Pro ($8/mo)
                </button>
            </div>
        </div>
    );
}
