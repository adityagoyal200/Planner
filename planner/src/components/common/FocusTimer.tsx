import { useState, useEffect } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { useScheduleStore } from "../../store/useScheduleStore";

export default function FocusTimer() {
    const { focusBlockId, week, selectedDay } = useScheduleStore();
    const day = week[selectedDay];
    
    const block = day?.blocks.find(b => b.id === focusBlockId);
    
    // Default 25 minutes
    const DEFAULT_TIME = 25 * 60;
    const [timeLeft, setTimeLeft] = useState(DEFAULT_TIME);
    const [isRunning, setIsRunning] = useState(false);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isRunning && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsRunning(false);
            // Could play a sound here
        }
        return () => clearInterval(interval);
    }, [isRunning, timeLeft]);

    const toggle = () => setIsRunning(!isRunning);
    const reset = () => {
        setIsRunning(false);
        setTimeLeft(DEFAULT_TIME);
    };

    const mins = Math.floor(timeLeft / 60).toString().padStart(2, "0");
    const secs = (timeLeft % 60).toString().padStart(2, "0");
    const progress = ((DEFAULT_TIME - timeLeft) / DEFAULT_TIME) * 100;

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
            </div>
        </div>
    );
}
