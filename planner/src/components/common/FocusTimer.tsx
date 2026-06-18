import { useState, useEffect } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { useScheduleStore } from "../../store/useScheduleStore";
import { sendFocusTimerNotification } from "../../services/notificationService";

export default function FocusTimer() {
    const { focusBlockId, week, selectedDay, pomodoroWork, updateBlock, browsingWeekKey } = useScheduleStore();
    const day = week[selectedDay];
    
    const block = day?.blocks.find(b => b.id === focusBlockId);
    const isReadOnly = !!browsingWeekKey;
    
    const timerDuration = pomodoroWork * 60;
    const [timeLeft, setTimeLeft] = useState(timerDuration);
    const [isRunning, setIsRunning] = useState(false);

    // Reset timer when pomodoroWork setting changes
    useEffect(() => {
        const resetTimer = setTimeout(() => {
            setTimeLeft(pomodoroWork * 60);
            setIsRunning(false);
        }, 0);
        return () => clearTimeout(resetTimer);
    }, [pomodoroWork]);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isRunning && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        setIsRunning(false);
                        sendFocusTimerNotification();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRunning, timeLeft]);

    const toggle = () => setIsRunning(!isRunning);
    const reset = () => {
        setIsRunning(false);
        setTimeLeft(timerDuration);
    };

    const mins = Math.floor(timeLeft / 60).toString().padStart(2, "0");
    const secs = (timeLeft % 60).toString().padStart(2, "0");
    const progress = ((timerDuration - timeLeft) / timerDuration) * 100;

    return (
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden group">
            <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-rose-500 to-orange-500 transition-all duration-1000 ease-linear`} style={{ width: `${progress}%` }} />
            
            {isRunning && (
                <div className="absolute inset-0 bg-rose-500/5 animate-pulse pointer-events-none" />
            )}

            <div className="flex items-center justify-between mb-4 relative z-10">
                <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            {isRunning && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>}
                            <span className={`relative inline-flex rounded-full h-2 w-2 ${isRunning ? 'bg-rose-500' : 'bg-zinc-600'}`}></span>
                        </span>
                        Focus Mode
                    </h3>
                    {block && (
                        <p className="text-xs text-zinc-400 mt-1 truncate max-w-[140px]">
                            {block.label}
                        </p>
                    )}
                </div>
            </div>

            <div className="flex flex-col items-center justify-center relative z-10">
                <div className="text-5xl font-black tracking-tighter tabular-nums drop-shadow-lg mb-4">
                    {mins}<span className="text-zinc-600 animate-pulse">:</span>{secs}
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={toggle}
                        className={`w-12 h-12 flex items-center justify-center rounded-full transition-all duration-300 ${isRunning ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-white text-black hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.1)]'}`}
                    >
                        {isRunning ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
                    </button>
                    <button 
                        onClick={reset}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                        title="Reset Timer"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </button>
                </div>

                {block && !block.completed && !isReadOnly && (
                    <button
                        onClick={() => {
                            updateBlock(selectedDay, block.id, { completed: true });
                            useScheduleStore.getState().addXP(10);
                        }}
                        className="mt-6 w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-widest rounded-xl transition-all duration-300 hover:scale-[1.02] shadow-[0_0_15px_rgba(16,185,129,0.2)] cursor-pointer"
                    >
                        <svg className="w-4.5 h-4.5 stroke-[3.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Complete Block (+10 XP)
                    </button>
                )}

                {block && block.completed && (
                    <div className="mt-6 w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 font-bold text-xs uppercase tracking-widest rounded-xl select-none">
                        <svg className="w-4.5 h-4.5 stroke-[3.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Block Completed!
                    </div>
                )}
            </div>
        </div>
    );
}
