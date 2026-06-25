import { useSubscriptionStore, type GatedFeature } from "../../store/useSubscriptionStore";

interface UpgradeBadgeProps {
    feature: GatedFeature;
    className?: string;
}

export default function UpgradeBadge({ feature, className }: UpgradeBadgeProps) {
    const canAccess = useSubscriptionStore((s) => s.canAccess(feature));

    if (canAccess) return null;

    return (
        <span 
            className={`inline-flex items-center justify-center px-1.5 py-0.5 ml-1.5 text-[8px] font-extrabold uppercase tracking-widest rounded bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-sm shadow-orange-500/20 ${className || ""}`}
            title="Premium Feature"
        >
            Pro
        </span>
    );
}
