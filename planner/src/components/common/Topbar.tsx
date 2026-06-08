export default function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
    const now = new Date();

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

            <div className="text-zinc-400">
                {now.toLocaleTimeString()}
            </div>

        </div>
    );
}