import { useScheduleStore } from "../../store/useScheduleStore";
import { computeSchedule } from "../../engine/computeSchedule";

export default function WeeklyAnalysis() {
    const { week } = useScheduleStore();

    let totalSleepMins = 0;
    let totalAimMins = 0;
    let totalValMins = 0;
    let totalGymMins = 0;

    Object.values(week).forEach((dayData) => {
        const { sleepTime, totalNapMins } = computeSchedule(dayData);
        
        const wakeMins = dayData.actualWakeTime !== null ? dayData.actualWakeTime : dayData.wakeTime;
        const effectiveSleepTime = dayData.actualSleepTime !== null ? dayData.actualSleepTime : sleepTime;

        let sleepDurationMins = 0;
        if (effectiveSleepTime <= 24 * 60) {
            sleepDurationMins = (24 * 60 - effectiveSleepTime) + wakeMins;
        } else {
            const sleepNextDayMins = effectiveSleepTime - 24 * 60;
            sleepDurationMins = wakeMins - sleepNextDayMins;
        }
        
        sleepDurationMins += totalNapMins;
        totalSleepMins += sleepDurationMins;

        dayData.blocks.forEach(b => {
            if (!b.on) return;
            if (b.type === "aim") totalAimMins += b.dur;
            if (b.type === "val") totalValMins += b.dur;
            if (b.type === "gym") totalGymMins += b.dur;
        });
    });

    const targetSleepMins = 7 * 7 * 60; // 49 hours
    const sleepDebt = Math.max(0, targetSleepMins - totalSleepMins);

    return (
        <div className="rounded-2xl border border-indigo-900/30 bg-gradient-to-br from-[#0c0c14] to-[#050508] p-5 shadow-2xl backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent transition-opacity duration-500 opacity-50" />
            
            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 to-indigo-500 relative z-10 mb-6">
                Weekly Analytics
            </h2>

            <div className="space-y-5 relative z-10">
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#111116] p-4 rounded-xl border border-indigo-900/20 shadow-inner">
                        <div className="text-sm font-medium text-indigo-400/70 mb-1">Total Sleep</div>
                        <div className="text-2xl font-black text-indigo-100">{(totalSleepMins / 60).toFixed(1)}h</div>
                    </div>
                    <div className="bg-[#111116] p-4 rounded-xl border border-rose-900/20 shadow-inner">
                        <div className="text-sm font-medium text-rose-400/70 mb-1">Sleep Debt</div>
                        <div className="text-2xl font-black text-rose-400">{(sleepDebt / 60).toFixed(1)}h</div>
                    </div>
                </div>

                <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-zinc-400 flex items-center gap-2">🎯 Aim Routine</span>
                        <span className="font-bold text-white">{(totalAimMins / 60).toFixed(1)}h</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-zinc-400 flex items-center gap-2">🎮 Valorant</span>
                        <span className="font-bold text-white">{(totalValMins / 60).toFixed(1)}h</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-zinc-400 flex items-center gap-2">🏋️ Gym Sessions</span>
                        <span className="font-bold text-white">{(totalGymMins / 60).toFixed(1)}h</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
