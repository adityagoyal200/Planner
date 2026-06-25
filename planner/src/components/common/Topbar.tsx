import { useState } from "react";
import { useAuthStore } from "../../store/useAuthStore";
import { setCloudUserId, useScheduleStore } from "../../store/useScheduleStore";
import type { AppTab } from "../../store/useScheduleStore";
import UpgradeBadge from "../paywall/UpgradeBadge";

const TABS: { id: AppTab; label: string; icon: string }[] = [
    { id: "schedule", label: "Schedule", icon: "📋" },
    { id: "analytics", label: "Analytics", icon: "📊" },
    { id: "journal", label: "Journal", icon: "📓" },
    { id: "habits", label: "Habits", icon: "🎯" },
    { id: "settings", label: "Settings", icon: "⚙️" },
];

export default function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
    const now = new Date();
    const { user, logout } = useAuthStore();
    const [showMenu, setShowMenu] = useState(false);
    const { currentTab, setCurrentTab } = useScheduleStore();

    const handleLogout = () => {
        setCloudUserId(null);
        logout();
        setShowMenu(false);
    };

    return (
        <header className="sticky top-0 z-30 border-b border-white/5 bg-black/20 backdrop-blur-xl safe-pt shadow-sm">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2 sm:px-6 sm:py-0 sm:min-h-16">
                {/* Left: menu + title */}
                <div className="flex items-center gap-2 sm:gap-4 order-1 flex-1 min-w-0">
                    {onMenuClick && (
                        <button
                            onClick={onMenuClick}
                            className="p-2 -ml-1 text-zinc-400 hover:text-white lg:hidden shrink-0"
                            aria-label="Open menu"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    )}
                    <div className="min-w-0 lg:hidden">
                        <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold truncate">
                            {now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                        </div>
                        <div className="text-sm font-semibold text-white truncate">Planner</div>
                    </div>
                    <div className="hidden lg:block">
                        <div className="text-sm text-zinc-500">
                            {now.toLocaleDateString("en-US", { weekday: "long" })}
                        </div>
                        <div className="font-semibold">Build Mode</div>
                    </div>
                </div>

                {/* Right: time + avatar */}
                <div className="flex items-center gap-2 sm:gap-4 order-2 shrink-0">
                    <div className="text-zinc-400 text-xs sm:text-sm tabular-nums">
                        {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>

                    {user && (
                        <div className="relative">
                            <button
                                onClick={() => setShowMenu(!showMenu)}
                                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                                aria-label="Account menu"
                            >
                                <img
                                    src={user.picture || undefined}
                                    alt={user.name || undefined}
                                    className="w-8 h-8 rounded-full border-2 border-zinc-800 hover:border-zinc-600 transition-colors"
                                    referrerPolicy="no-referrer"
                                />
                            </button>

                            {showMenu && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                                    <div className="absolute right-0 top-12 z-50 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl shadow-black/60 p-4 min-w-[min(220px,calc(100vw-2rem))]">
                                        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-zinc-800">
                                            <img
                                                src={user.picture || undefined}
                                                alt={user.name || undefined}
                                                className="w-10 h-10 rounded-full shrink-0"
                                                referrerPolicy="no-referrer"
                                            />
                                            <div className="min-w-0">
                                                <div className="text-sm font-bold text-white truncate">{user.name}</div>
                                                <div className="text-xs text-zinc-500 truncate">{user.email}</div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full text-left text-sm text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 px-3 py-2 rounded-lg transition-all font-medium"
                                        >
                                            Sign out
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Tabs: full width on mobile */}
                <nav
                    className="topbar-tabs order-3 w-full sm:w-auto sm:flex-1 sm:order-2 flex items-center justify-center gap-1 bg-zinc-900/50 backdrop-blur-md rounded-xl p-1 border border-zinc-800/50 overflow-x-auto"
                    aria-label="Main navigation"
                >
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setCurrentTab(tab.id)}
                            className={`flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer whitespace-nowrap shrink-0 ${
                                currentTab === tab.id
                                    ? "bg-white text-black shadow-lg shadow-white/10"
                                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                            }`}
                        >
                            <span className="text-sm">{tab.icon}</span>
                            <span className="hidden sm:inline">{tab.label}</span>
                            {(tab.id === "analytics" || tab.id === "journal" || tab.id === "habits") && (
                                <UpgradeBadge feature={tab.id} />
                            )}
                        </button>
                    ))}
                </nav>
            </div>
        </header>
    );
}
