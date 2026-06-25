import { useState } from "react";
import { useScheduleStore } from "../../store/useScheduleStore";
import { parseTimeInput } from "../../utils/timeUtils";

function minsToTime(mins: number) {
    const positiveMins = ((mins % 1440) + 1440) % 1440;
    const h = Math.floor(positiveMins / 60).toString().padStart(2, "0");
    const m = (positiveMins % 60).toString().padStart(2, "0");
    return `${h}:${m}`;
}

export default function OnboardingWizard() {
    const { onboardingComplete, completeOnboarding } = useScheduleStore();
    const [step, setStep] = useState(0);
    const [wakeTime, setWakeTime] = useState(420);
    const [withWork, setWithWork] = useState(true);
    const [workStart, setWorkStart] = useState(540);
    const [commuteMins, setCommuteMins] = useState(30);

    if (onboardingComplete) return null;

    const finish = () => {
        completeOnboarding({
            wakeTime,
            workStart,
            commuteMins,
            withWork,
        });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="glass-card w-full max-w-md rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
                <h2 className="text-xl font-black text-white mb-1">Welcome to Planner</h2>
                <p className="text-xs text-zinc-500 mb-6">Set up your week in a few quick steps.</p>

                {step === 0 && (
                    <div className="space-y-4">
                        <label className="block">
                            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Wake time</span>
                            <input
                                type="text"
                                inputMode="numeric"
                                placeholder="HH:MM"
                                defaultValue={minsToTime(wakeTime)}
                                onBlur={(e) => {
                                    const mins = parseTimeInput(e.target.value, 23);
                                    if (mins !== null) setWakeTime(mins);
                                }}
                                className="mt-1 w-full rounded-xl border border-zinc-800 bg-[#050505] p-3 text-white focus:border-zinc-600 focus:outline-none"
                            />
                        </label>
                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="w-full py-3 rounded-xl bg-indigo-500 text-white text-sm font-bold hover:bg-indigo-400 transition cursor-pointer"
                        >
                            Next
                        </button>
                    </div>
                )}

                {step === 1 && (
                    <div className="space-y-4">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={withWork}
                                onChange={(e) => setWithWork(e.target.checked)}
                                className="rounded border-zinc-700"
                            />
                            <span className="text-sm text-zinc-300">I commute to work on weekdays</span>
                        </label>
                        {withWork && (
                            <>
                                <label className="block">
                                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Work start</span>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="HH:MM"
                                        defaultValue={minsToTime(workStart)}
                                        onBlur={(e) => {
                                            const mins = parseTimeInput(e.target.value, 23);
                                            if (mins !== null) setWorkStart(mins);
                                        }}
                                        className="mt-1 w-full rounded-xl border border-zinc-800 bg-[#050505] p-3 text-white focus:border-zinc-600 focus:outline-none"
                                    />
                                </label>
                                <label className="block">
                                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Commute</span>
                                    <select
                                        value={commuteMins}
                                        onChange={(e) => setCommuteMins(Number(e.target.value))}
                                        className="mt-1 w-full rounded-xl border border-zinc-800 bg-[#050505] p-3 text-white focus:border-zinc-600 focus:outline-none"
                                    >
                                        <option value={15}>15 mins</option>
                                        <option value={30}>30 mins</option>
                                        <option value={45}>45 mins</option>
                                        <option value={60}>60 mins</option>
                                    </select>
                                </label>
                            </>
                        )}
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setStep(0)}
                                className="flex-1 py-3 rounded-xl border border-zinc-700 text-zinc-400 text-sm font-bold hover:bg-zinc-800 transition cursor-pointer"
                            >
                                Back
                            </button>
                            <button
                                type="button"
                                onClick={() => setStep(2)}
                                className="flex-1 py-3 rounded-xl bg-indigo-500 text-white text-sm font-bold hover:bg-indigo-400 transition cursor-pointer"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-4">
                        <p className="text-sm text-zinc-400">
                            We&apos;ll apply your wake time{withWork ? ", work schedule, and commute blocks" : ""} to every day this week. You can fine-tune each day later in Settings.
                        </p>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="flex-1 py-3 rounded-xl border border-zinc-700 text-zinc-400 text-sm font-bold hover:bg-zinc-800 transition cursor-pointer"
                            >
                                Back
                            </button>
                            <button
                                type="button"
                                onClick={finish}
                                className="flex-1 py-3 rounded-xl bg-emerald-500 text-black text-sm font-bold hover:bg-emerald-400 transition cursor-pointer"
                            >
                                Get started
                            </button>
                        </div>
                    </div>
                )}

                <div className="flex justify-center gap-2 mt-6">
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            className={`w-2 h-2 rounded-full transition-colors ${i === step ? "bg-indigo-500" : "bg-zinc-700"}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
