import { useState } from "react";
import { useAuthStore } from "../../store/useAuthStore";
import { setCloudUserId } from "../../store/useScheduleStore";

export default function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
    const now = new Date();
    const { user, logout } = useAuthStore();
    const [showMenu, setShowMenu] = useState(false);

    const handleLogout = () => {
        setCloudUserId(null);
        logout();
        setShowMenu(false);
    };

    return (
        <div className="h-16 border-b border-zinc-900 bg-[#050505] px-4 md:px-6 flex items-center justify-between sticky top-0 z-30">

            <div className="flex items-center gap-4">
                {onMenuClick && (
                    <button onClick={onMenuClick} className="p-2 -ml-2 text-zinc-400 hover:text-white lg:hidden">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                )}
                <div>
                    <div className="text-sm text-zinc-500">
                        {now.toLocaleDateString("en-US", { weekday: "long" })}
                    </div>

                    <div className="font-semibold">
                        Build Mode
                    </div>
                </div>
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
                                src={user.picture}
                                alt={user.name}
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
                                            src={user.picture}
                                            alt={user.name}
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