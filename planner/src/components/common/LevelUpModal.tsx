import { motion, AnimatePresence } from "framer-motion";
import { useScheduleStore } from "../../store/useScheduleStore";
import { Sparkles, Trophy, X } from "lucide-react";

export default function LevelUpModal() {
    const { levelUpModal, setLevelUpModal } = useScheduleStore();

    if (!levelUpModal) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                {/* Subtle Backdrop */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    onClick={() => setLevelUpModal(null)}
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm cursor-pointer"
                />

                {/* Elegant Modal content */}
                <motion.div 
                    initial={{ scale: 0.95, y: 10, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.95, y: 10, opacity: 0 }}
                    transition={{ type: "tween", ease: "easeOut", duration: 0.3 }}
                    className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-2xl z-10"
                >
                    {/* Subtle top glow */}
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
                    
                    <button 
                        onClick={() => setLevelUpModal(null)}
                        className="absolute right-4 top-4 text-zinc-500 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="p-8 text-center">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.1, duration: 0.4, ease: "easeOut" }}
                            className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900 border border-white/5 shadow-inner relative"
                        >
                            <div className="absolute inset-0 rounded-2xl bg-indigo-500/10 blur-xl" />
                            <Trophy className="h-8 w-8 text-indigo-400 relative z-10" />
                        </motion.div>

                        <div className="flex justify-center items-center gap-2 mb-3">
                            <Sparkles className="w-4 h-4 text-zinc-400" />
                            <span className="text-xs tracking-[0.2em] font-bold uppercase text-zinc-400">
                                Level Up
                            </span>
                            <Sparkles className="w-4 h-4 text-zinc-400" />
                        </div>

                        <h2 className="text-3xl font-light tracking-tight text-white mb-2">
                            Level <span className="font-semibold">{levelUpModal.level}</span>
                        </h2>

                        <p className="text-zinc-300 font-medium text-sm mb-6 inline-block bg-white/5 py-1 px-3 rounded-md">
                            {levelUpModal.title}
                        </p>

                        <button
                            onClick={() => setLevelUpModal(null)}
                            className="w-full rounded-lg bg-white py-3 px-6 text-sm font-semibold text-black shadow-sm hover:bg-zinc-200 transition-colors cursor-pointer"
                        >
                            Continue
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
