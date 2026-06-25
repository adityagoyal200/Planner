import { useScheduleStore } from "../../store/useScheduleStore";
import { computeTimeDebt, formatDebtTime } from "../../engine/timeDebtEngine";
import { TrendingUp, AlertTriangle, AlertCircle, CheckCircle2 } from "lucide-react";

export default function TimeDebtLedger() {
    const { week, weekHistory, categories } = useScheduleStore();

    const debts = computeTimeDebt(week, weekHistory, categories);

    return (
        <div className="glass-card rounded-2xl p-5 border border-white/5 relative">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                        ⚖️ Time Debt Ledger
                    </h3>
                    <p className="text-xs text-zinc-500 mt-0.5">Time skipped from planned blocks that you owe to yourself</p>
                </div>
            </div>

            {debts.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-10 bg-white/[0.01] border border-white/5 border-dashed rounded-2xl p-6">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400 mb-2 animate-bounce" />
                    <h4 className="text-sm font-extrabold text-white mb-1">Zero Time Debt!</h4>
                    <p className="text-zinc-500 text-[11px] max-w-xs leading-relaxed">
                        You have completed all of your scheduled blocks. Your time accounts are perfectly balanced. Keep it up!
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="grid gap-3">
                        {debts.map((item) => {
                            const isHighSeverity = item.debtMins >= 240; // 4 hours or more
                            const isMediumSeverity = item.debtMins >= 120; // 2 hours or more

                            let severityColor = "text-zinc-400 bg-zinc-900 border-zinc-800";
                            let icon = <TrendingUp className="w-3.5 h-3.5" />;
                            if (isHighSeverity) {
                                severityColor = "text-rose-400 bg-rose-950/15 border-rose-900/30";
                                icon = <AlertTriangle className="w-3.5 h-3.5" />;
                            } else if (isMediumSeverity) {
                                severityColor = "text-amber-400 bg-amber-950/15 border-amber-900/30";
                                icon = <AlertCircle className="w-3.5 h-3.5" />;
                            }

                            return (
                                <div
                                    key={item.categoryId}
                                    className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all hover:bg-white/[0.02] ${severityColor}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl shrink-0">{item.emoji}</span>
                                        <div>
                                            <div className="text-sm font-extrabold text-white flex items-center gap-1.5">
                                                {item.categoryName}
                                                <span className="inline-flex text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/40 border border-white/5 text-zinc-400">
                                                    {item.weeksAccumulated} week{item.weeksAccumulated > 1 ? "s" : ""} active
                                                </span>
                                            </div>
                                            <div className="text-[10px] text-zinc-500 font-medium mt-0.5">
                                                Compounding skipped block durations over past 4 weeks
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                                        <div className="text-right">
                                            <div className="text-lg font-black text-white tabular-nums flex items-center gap-1 justify-end">
                                                {icon} {formatDebtTime(item.debtMins)}
                                            </div>
                                            <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Accumulated Debt</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Payoff suggestion notice */}
                    <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-900/30 text-[11px] text-indigo-300 leading-relaxed">
                        💡 <span className="font-bold">Debt payoff advice</span>: To clear your time debt in a category, schedule an extra block of that type (e.g. Exercise or Study) and complete it. The system will reduce your accumulated debt automatically as you log completed blocks.
                    </div>
                </div>
            )}
        </div>
    );
}
