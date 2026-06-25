import { useSubscriptionStore, type GatedFeature } from "../store/useSubscriptionStore";

/**
 * Hook to gate features behind the paywall.
 * Returns `allowed` (boolean) and `gate()` which opens the upgrade modal if not allowed.
 */
export function useGate(feature: GatedFeature) {
    const canAccess = useSubscriptionStore((s) => s.canAccess(feature));
    const openUpgradeModal = useSubscriptionStore((s) => s.openUpgradeModal);

    return {
        allowed: canAccess,
        gate: () => {
            if (!canAccess) {
                openUpgradeModal(feature);
                return false;
            }
            return true;
        },
    };
}

/**
 * Non-hook version for use outside React components (e.g., store actions).
 */
export function checkGate(feature: GatedFeature): boolean {
    return useSubscriptionStore.getState().canAccess(feature);
}
