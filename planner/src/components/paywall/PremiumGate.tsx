import React from "react";
import { useGate } from "../../hooks/useGate";
import type { GatedFeature } from "../../store/useSubscriptionStore";

interface PremiumGateProps {
    feature: GatedFeature;
    children: React.ReactNode;
    title: string;
    description: string;
}

export default function PremiumGate({ feature, children, title, description }: PremiumGateProps) {
    const { allowed, gate } = useGate(feature);

    if (allowed) {
        return <>{children}</>;
    }

    return (
        <div className="relative w-full h-full min-h-[400px] rounded-2xl overflow-hidden glass-card">
            <div className="pointer-events-none select-none blur-md opacity-30 w-full h-full">
                {children}
            </div>

            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-black/50 backdrop-blur-md border border-white/5 rounded-2xl text-center">
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-xl shadow-lg shadow-indigo-500/20 mb-4 animate-pulse">
                    🔒
                </div>
                <h3 className="text-xl font-black text-white mb-2">{title}</h3>
                <p className="text-zinc-400 text-xs max-w-sm mb-6 leading-relaxed">
                    {description}
                </p>
                <button
                    onClick={() => gate()}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-xs font-black uppercase tracking-wider text-white hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-indigo-500/20 cursor-pointer"
                >
                    Unlock Pro Feature
                </button>
            </div>
        </div>
    );
}
