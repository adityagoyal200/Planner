import React, { useEffect } from "react";
import { useSubscriptionStore } from "../../store/useSubscriptionStore";

interface AdBannerProps {
    slotId?: string;
    format?: string;
    style?: React.CSSProperties;
    className?: string;
}

export default function AdBanner({ slotId, format = "auto", style, className }: AdBannerProps) {
    const { tier, isTrialActive } = useSubscriptionStore();
    const hasPremium = tier === "pro" || isTrialActive();

    const adClientId = import.meta.env.VITE_ADSENSE_CLIENT_ID || "ca-pub-placeholder";
    const adSlotId = slotId || import.meta.env.VITE_ADSENSE_SLOT_ID || "slot-placeholder";

    useEffect(() => {
        if (hasPremium) return;

        const isRealConfig = adClientId && adClientId !== "ca-pub-placeholder";
        
        // Only load the real Google script in production and with valid configuration
        if (!import.meta.env.DEV && isRealConfig) {
            const scriptId = "google-adsense-script";
            let script = document.getElementById(scriptId) as HTMLScriptElement;
            
            if (!script) {
                script = document.createElement("script");
                script.id = scriptId;
                script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adClientId}`;
                script.crossOrigin = "anonymous";
                script.async = true;
                document.head.appendChild(script);
            }

            // Trigger loading ads via AdSense SDK
            try {
                const adsbygoogle = (window as any).adsbygoogle || [];
                adsbygoogle.push({});
            } catch (err) {
                console.error("AdSense injection failed:", err);
            }
        }
    }, [hasPremium, adClientId]);

    // Premium users do not see ads
    if (hasPremium) {
        return null;
    }

    // In local development or if no API keys are supplied, show a beautiful premium ad placeholder card
    if (import.meta.env.DEV || adClientId === "ca-pub-placeholder") {
        return (
            <div
                className={`w-full flex flex-col items-center justify-center border border-dashed border-white/10 bg-white/[0.02] backdrop-blur-md rounded-2xl p-4 my-4 relative overflow-hidden group min-h-[90px] transition-all duration-300 hover:border-white/20 ${className || ""}`}
                style={style}
            >
                <div className="absolute inset-0 bg-gradient-to-r from-zinc-500/5 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <span className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-widest absolute top-2.5 right-3">
                    Sponsored
                </span>
                <div className="text-center relative z-10 space-y-1">
                    <p className="text-xs font-bold text-zinc-400">Google AdSense</p>
                    <p className="text-[9px] text-zinc-600 font-mono tracking-tight">
                        {adClientId} • Slot: {adSlotId}
                    </p>
                </div>
                <div className="absolute -left-6 -bottom-6 w-12 h-12 bg-white/5 rounded-full blur-xl group-hover:bg-white/10 transition-colors duration-500" />
            </div>
        );
    }

    // Production environment: Render standard AdSense markup
    return (
        <div className={`w-full my-4 overflow-hidden flex justify-center ${className || ""}`} style={style}>
            <ins
                className="adsbygoogle"
                style={{ display: "block", width: "100%", ...style }}
                data-ad-client={adClientId}
                data-ad-slot={adSlotId}
                data-ad-format={format}
                data-full-width-responsive="true"
            />
        </div>
    );
}
