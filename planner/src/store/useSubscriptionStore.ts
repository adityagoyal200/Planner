import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SubscriptionTier = "free" | "pro";

export type GatedFeature =
    | "analytics"
    | "journal"
    | "habits"
    | "google_calendar"
    | "notifications"
    | "block_recurrence"
    | "copy_schedule"
    | "week_history"
    | "gamification"
    | "premium_settings"
    | "unlimited_blocks"
    | "unlimited_notes"
    | "time_budgets"
    | "life_score_detail"
    | "personal_records";

const FREE_BLOCK_LIMIT = 3;
const FREE_NOTES_LIMIT = 100;
const TRIAL_DURATION_DAYS = 7;

interface SubscriptionStore {
    tier: SubscriptionTier;
    trialStartDate: string | null; // ISO date string
    upgradeModalOpen: boolean;
    upgradeModalFeature: string | null;

    // Computed helpers
    isTrialActive: () => boolean;
    trialDaysRemaining: () => number;
    canAccess: (feature: GatedFeature) => boolean;
    getBlockLimit: () => number;
    getNotesLimit: () => number;

    // Actions
    startTrial: () => void;
    upgradeToPro: () => void;
    openUpgradeModal: (feature?: string) => void;
    closeUpgradeModal: () => void;
}

export const useSubscriptionStore = create<SubscriptionStore>()(
    persist(
        (set, get) => ({
            tier: "free",
            trialStartDate: null,
            upgradeModalOpen: false,
            upgradeModalFeature: null,

            isTrialActive: () => {
                const { trialStartDate, tier } = get();
                if (tier === "pro") return false;
                if (!trialStartDate) return false;
                const start = new Date(trialStartDate);
                const now = new Date();
                const diffDays = Math.floor(
                    (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
                );
                return diffDays < TRIAL_DURATION_DAYS;
            },

            trialDaysRemaining: () => {
                const { trialStartDate, tier } = get();
                if (tier === "pro") return 0;
                if (!trialStartDate) return TRIAL_DURATION_DAYS;
                const start = new Date(trialStartDate);
                const now = new Date();
                const diffDays = Math.floor(
                    (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
                );
                return Math.max(0, TRIAL_DURATION_DAYS - diffDays);
            },

            canAccess: (_feature: GatedFeature) => {
                const { tier, isTrialActive } = get();
                if (tier === "pro") return true;
                if (isTrialActive()) return true;
                // Free tier — only schedule (limited) is accessible
                return false;
            },

            getBlockLimit: () => {
                const { tier, isTrialActive } = get();
                if (tier === "pro" || isTrialActive()) return Infinity;
                return FREE_BLOCK_LIMIT;
            },

            getNotesLimit: () => {
                const { tier, isTrialActive } = get();
                if (tier === "pro" || isTrialActive()) return Infinity;
                return FREE_NOTES_LIMIT;
            },

            startTrial: () =>
                set({ trialStartDate: new Date().toISOString() }),

            upgradeToPro: () => set({ tier: "pro" }),

            openUpgradeModal: (feature) =>
                set({ upgradeModalOpen: true, upgradeModalFeature: feature || null }),

            closeUpgradeModal: () =>
                set({ upgradeModalOpen: false, upgradeModalFeature: null }),
        }),
        {
            name: "planner-subscription",
            partialize: (state) => ({
                tier: state.tier,
                trialStartDate: state.trialStartDate,
            }),
        }
    )
);
