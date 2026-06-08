export default function Topbar() {
    const now = new Date();

    return (
        <div className="h-16 border-b border-zinc-900 bg-[#050505] px-6 flex items-center justify-between">

            <div>
                <div className="text-sm text-zinc-500">
                    Tuesday
                </div>

                <div className="font-semibold">
                    Build Mode
                </div>
            </div>

            <div className="text-zinc-400">
                {now.toLocaleTimeString()}
            </div>

        </div>
    );
}