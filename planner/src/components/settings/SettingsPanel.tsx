import { useScheduleStore } from "../../store/useScheduleStore";

function minsToTime(mins: number) {
    const h = Math.floor(mins / 60).toString().padStart(2, "0");
    const m = (mins % 60).toString().padStart(2, "0");
    return `${h}:${m}`;
}

function timeToMins(time: string) {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
}

export default function SettingsPanel() {
    const { selectedDay, week, updateWakeTime, updateCommute } = useScheduleStore();
    const day = week[selectedDay];

    if (!day) return null;

    return (
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            
            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-500">
                Settings
            </h2>

            <div className="mt-6 space-y-5 relative z-10">
                <div>
                    <label className="text-sm font-medium text-zinc-400">Wake Time</label>
                    <input
                        type="time"
                        value={minsToTime(day.wakeTime)}
                        onChange={(e) => updateWakeTime(selectedDay, timeToMins(e.target.value))}
                        className="mt-2 w-full rounded-xl border border-zinc-800 bg-[#050505] p-3 text-white focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600 transition duration-300 shadow-inner"
                    />
                </div>

                <div>
                    <label className="text-sm font-medium text-zinc-400">Commute</label>
                    <select
                        value={day.commuteMins}
                        onChange={(e) => updateCommute(selectedDay, Number(e.target.value))}
                        className="mt-2 w-full rounded-xl border border-zinc-800 bg-[#050505] p-3 text-white focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600 transition duration-300 shadow-inner"
                    >
                        <option value={15}>15 mins</option>
                        <option value={30}>30 mins</option>
                        <option value={45}>45 mins</option>
                        <option value={60}>60 mins</option>
                    </select>
                </div>

                <div className="pt-4 border-t border-zinc-800/50">
                    <button
                        onClick={async () => {
                            const btn = document.getElementById("force-sync-btn");
                            if (btn) btn.innerText = "Syncing...";
                            const { forcePushToCloud } = await import("../../store/useScheduleStore");
                            await forcePushToCloud();
                            if (btn) btn.innerText = "Synced!";
                            setTimeout(() => { if (btn) btn.innerText = "Force Sync to Cloud"; }, 2000);
                        }}
                        id="force-sync-btn"
                        className="w-full rounded-xl bg-zinc-800/50 hover:bg-zinc-700 p-3 text-sm font-bold text-white transition-colors border border-zinc-700/50"
                    >
                        Force Sync to Cloud
                    </button>
                    <p className="text-[10px] text-zinc-500 mt-2 text-center leading-relaxed">
                        If your phone and laptop are out of sync, click this on the device that has the correct data.
                    </p>
                </div>
            </div>
        </div>
    );
}