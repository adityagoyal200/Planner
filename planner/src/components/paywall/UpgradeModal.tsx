import { motion, AnimatePresence } from "framer-motion";
import { useSubscriptionStore } from "../../store/useSubscriptionStore";
import { X, Star, Shield, Zap, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";
import { toast } from "react-hot-toast";

const PRO_FEATURES = [
    {
        title: "All Novel Features Included",
        desc: "Energy Map, Life Score gauge, Time Budget rings, Time Debt ledger, Personal Records wall.",
        icon: Sparkles,
        color: "text-amber-400 bg-amber-500/10",
    },
    {
        title: "Unlimited Time-Blocking",
        desc: "Schedule as many blocks per day as you want. No daily limits.",
        icon: Zap,
        color: "text-indigo-400 bg-indigo-500/10",
    },
    {
        title: "Advanced Integrations",
        desc: "Full, bi-directional Google Calendar sync and notifications.",
        icon: Shield,
        color: "text-emerald-400 bg-emerald-500/10",
    },
];

const FEATURE_COMPARISON = [
    { name: "Daily blocks limit", free: "Max 3 blocks", pro: "Unlimited" },
    { name: "Analytics Dashboard", free: "🔒 Gated", pro: "✅ Full access" },
    { name: "Reflection & Journal", free: "🔒 Gated", pro: "✅ Full access" },
    { name: "Habits Grid & Streaks", free: "🔒 Gated", pro: "✅ Full access" },
    { name: "Google Calendar Sync", free: "🔒 Gated", pro: "✅ Full access" },
    { name: "Life Score Composite", free: "❌ Gated", pro: "✅ Full access" },
    { name: "Time Budgets & Debt", free: "❌ Gated", pro: "✅ Full access" },
    { name: "Personal Records Wall", free: "❌ Gated", pro: "✅ Full access" },
];

export default function UpgradeModal() {
    const isOpen = useSubscriptionStore((s) => s.upgradeModalOpen);
    const feature = useSubscriptionStore((s) => s.upgradeModalFeature);
    const closeUpgradeModal = useSubscriptionStore((s) => s.closeUpgradeModal);
    const upgradeToPro = useSubscriptionStore((s) => s.upgradeToPro);

    if (!isOpen) return null;

    const handleUpgrade = () => {
        upgradeToPro();
        closeUpgradeModal();
        toast.success("Welcome to Planner Pro! All features unlocked.", {
            duration: 4000,
            icon: "👑",
            style: {
                background: "#0a0a0f",
                color: "#fff",
                border: "1px solid rgba(16, 185, 129, 0.2)",
                borderRadius: "16px",
            },
        });
        
        // Trigger a premium burst of confetti
        const duration = 3 * 1000;
        const end = Date.now() + duration;

        (function frame() {
            confetti({
                particleCount: 3,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ["#6366f1", "#a855f7", "#ec4899"],
            });
            confetti({
                particleCount: 3,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ["#6366f1", "#a855f7", "#ec4899"],
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        }());
    };

    const getFeatureName = (id: string | null) => {
        if (!id) return "Premium Features";
        return id
            .split("_")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={closeUpgradeModal}
                    className="fixed inset-0 bg-black/60 backdrop-blur-md cursor-pointer"
                />

                {/* Modal Card */}
                <motion.div
                    initial={{ scale: 0.95, y: 15, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.95, y: 15, opacity: 0 }}
                    className="relative w-full max-w-2xl bg-[#0a0a0f] border border-white/5 rounded-3xl shadow-2xl z-10 overflow-hidden my-8"
                >
                    {/* Glowing Accent */}
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                    <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl" />
                    <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-pink-500/10 blur-3xl" />

                    <button
                        onClick={closeUpgradeModal}
                        className="absolute right-5 top-5 p-2 rounded-xl bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    <div className="p-6 sm:p-8">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-500/10 text-xs font-black text-indigo-400 uppercase tracking-widest mb-3">
                                <Star className="w-3.5 h-3.5 fill-current" /> Premium Upgrade
                            </span>
                            <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                                Unlock the Full Personal OS
                            </h2>
                            {feature ? (
                                <p className="text-zinc-400 text-sm mt-2">
                                    Unlock <span className="text-indigo-400 font-bold">{getFeatureName(feature)}</span> and everything else below.
                                </p>
                            ) : (
                                <p className="text-zinc-400 text-sm mt-2">
                                    Take control of your focus, health, and schedule today.
                                </p>
                            )}
                        </div>

                        {/* Pro Value Highlights */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            {PRO_FEATURES.map((item, idx) => (
                                <div key={idx} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all flex flex-col items-center text-center">
                                    <div className={`p-2.5 rounded-xl ${item.color} mb-3`}>
                                        <item.icon className="w-5 h-5" />
                                    </div>
                                    <h4 className="text-sm font-extrabold text-white mb-1">{item.title}</h4>
                                    <p className="text-zinc-500 text-[11px] leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </div>

                        {/* Feature Table */}
                        <div className="glass-card rounded-2xl border border-white/5 overflow-hidden mb-8">
                            <div className="grid grid-cols-3 bg-white/[0.02] py-2.5 px-4 text-xs font-bold text-zinc-400 uppercase tracking-wider border-b border-white/5">
                                <div>Feature</div>
                                <div className="text-center">Free</div>
                                <div className="text-center text-indigo-400">Pro</div>
                            </div>
                            <div className="max-h-[160px] overflow-y-auto divide-y divide-white/5">
                                {FEATURE_COMPARISON.map((f, i) => (
                                    <div key={i} className="grid grid-cols-3 py-2.5 px-4 text-xs font-medium">
                                        <div className="text-zinc-300">{f.name}</div>
                                        <div className="text-center text-zinc-500">{f.free}</div>
                                        <div className="text-center text-indigo-300 font-bold">{f.pro}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Pricing & CTA */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-indigo-950/40 to-purple-950/40 border border-indigo-500/20">
                            <div>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-3xl font-black text-white">$8</span>
                                    <span className="text-zinc-400 text-xs font-medium">/ month</span>
                                </div>
                                <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mt-0.5">Cancel anytime</div>
                            </div>
                            <button
                                onClick={handleUpgrade}
                                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-sm font-black uppercase tracking-wider text-white shadow-xl shadow-indigo-500/20 hover:opacity-95 active:scale-95 transition-all cursor-pointer text-center"
                            >
                                Get Instant Access
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
