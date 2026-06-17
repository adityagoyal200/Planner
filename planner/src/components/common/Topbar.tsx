import { useState } from "react";
import { useAuthStore } from "../../store/useAuthStore";
import { setCloudUserId, useScheduleStore } from "../../store/useScheduleStore";
import type { AppTab } from "../../store/useScheduleStore";

const TABS: { id: AppTab; label: string; icon: string }[] = [
    { id: "schedule", label: "Schedule", icon: "📋" },
    { id: "analytics", label: "Analytics", icon: "📊" },
    { id: "journal", label: "Journal", icon: "📓" },
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
        <div className="h-16 border-b border-white/5 bg-black/20 backdrop-blur-xl px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
            <div className="flex items-center gap-4">
                {onMenuClick && (
                    <button onClick={onMenuClick} className="p-2 -ml-2 text-zinc-400 hover:text-white lg:hidden">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                )}
                <div className="hidden md:block">
                    <div className="text-sm text-zinc-500">
                        {now.toLocaleDateString("en-US", { weekday: "long" })}
                    </div>

                    <div className="font-semibold">
                        Build Mode
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-1 bg-zinc-900/50 backdrop-blur-md rounded-xl p-1 border border-zinc-800/50 overflow-x-auto hide-scrollbar max-w-full">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setCurrentTab(tab.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                            currentTab === tab.id
                                ? "bg-white text-black shadow-lg shadow-white/10"
                                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                        }`}
                    >
                        <span className="text-sm">{tab.icon}</span>
                        <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                ))}
            </div>

            <div className="flex items-center gap-4">
                <div className="text-zinc-400 text-sm hidden sm:block">
                    {now.toLocaleTimeString()}
                </div>

                {/* User avatar & menu */}
                {user && (
                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
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
                                <div className="absolute right-0 top-12 z-50 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl shadow-black/60 p-4 min-w-[220px]">
                                    <div className="flex items-center gap-3 mb-4 pb-4 border-b border-zinc-800">
                                        <img
                                            src={user.picture || undefined}
                                            alt={user.name || undefined}
                                            className="w-10 h-10 rounded-full"
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

        </div>
    );
}