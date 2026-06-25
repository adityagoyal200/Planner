import { useState } from "react";
import { useScheduleStore } from "../../store/useScheduleStore";
import { computeBudgetStatuses } from "../../engine/budgetEngine";
import { formatDebtTime } from "../../engine/timeDebtEngine";
import { Edit2, Check, Plus, AlertTriangle, ShieldCheck } from "lucide-react";
import { toast } from "react-hot-toast";

export default function BudgetRings() {
    const { week, timeBudgets, categories, updateTimeBudget } = useScheduleStore();
    const [editingCatId, setEditingCatId] = useState<string | null>(null);
    const [editTargetHours, setEditTargetHours] = useState<string>("");
    const [editMaxHours, setEditMaxHours] = useState<string>("");
    const [editMinHours, setEditMinHours] = useState<string>("");
    const [addingBudget, setAddingBudget] = useState(false);
    const [selectedCatId, setSelectedCatId] = useState("");

    const statuses = computeBudgetStatuses(week, timeBudgets, categories);

    const handleStartEdit = (catId: string, currentTarget?: number, currentMax?: number, currentMin?: number) => {
        setEditingCatId(catId);
        setEditTargetHours(currentTarget ? (currentTarget / 60).toString() : "");
        setEditMaxHours(currentMax ? (currentMax / 60).toString() : "");
        setEditMinHours(currentMin ? (currentMin / 60).toString() : "");
    };

    const handleSaveEdit = (catId: string) => {
        const targetMins = editTargetHours ? Math.round(parseFloat(editTargetHours) * 60) : undefined;
        const maxMins = editMaxHours ? Math.round(parseFloat(editMaxHours) * 60) : undefined;
        const minMins = editMinHours ? Math.round(parseFloat(editMinHours) * 60) : undefined;

        updateTimeBudget(catId, { targetMins, maxMins, minMins });
        setEditingCatId(null);
        toast.success("Budget updated!", {
            style: { background: "#0a0a0f", color: "#fff", border: "1px solid rgba(255,255,255,0.05)" }
        });
    };

    const handleAddBudget = () => {
        if (!selectedCatId) return;
        const exists = timeBudgets.some(b => b.categoryId === selectedCatId);
        if (exists) {
            toast.error("Budget already exists for this category!");
            return;
        }
        updateTimeBudget(selectedCatId, { targetMins: 300 }); // Default 5 hours target
        setAddingBudget(false);
        setSelectedCatId("");
        toast.success("New budget added!");
    };

    return (
        <div className="glass-card rounded-2xl p-5 border border-white/5 relative">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                        💰 Weekly Time Budgets
                    </h3>
                    <p className="text-xs text-zinc-500 mt-0.5">Allocate hours to priorities and manage your time bank</p>
                </div>
                {!addingBudget && (
                    <button
                        onClick={() => setAddingBudget(true)}
                        className="p-1.5 rounded-lg bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer flex items-center gap-1 text-[10px] font-black uppercase tracking-wider"
                    >
                        <Plus className="w-3.5 h-3.5" /> Add Budget
                    </button>
                )}
            </div>

            {addingBudget && (
                <div className="mb-6 p-4 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row gap-3 items-end">
                    <div className="flex-1 w-full">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">Select Category</label>
                        <select
                            value={selectedCatId}
                            onChange={(e) => setSelectedCatId(e.target.value)}
                            className="w-full bg-zinc-950 border border-white/5 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-zinc-800 cursor-pointer"
                        >
                            <option value="">-- Choose Category --</option>
                            {categories.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.emoji} {c.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <button
                            onClick={handleAddBudget}
                            disabled={!selectedCatId}
                            className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-xs font-black uppercase tracking-wider text-white rounded-xl hover:opacity-90 active:scale-95 transition cursor-pointer"
                        >
                            Add
                        </button>
                        <button
                            onClick={() => setAddingBudget(false)}
                            className="flex-1 sm:flex-none px-4 py-2 bg-white/5 text-xs font-black uppercase tracking-wider text-zinc-400 hover:text-white rounded-xl transition cursor-pointer"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {statuses.length === 0 ? (
                    <div className="col-span-2 text-center py-8 text-zinc-500 text-xs font-medium">
                        No time budgets configured yet. Click "Add Budget" to start tracking.
                    </div>
                ) : (
                    statuses.map((item) => {
                        const isEditing = editingCatId === item.categoryId;
                        const limitText = item.budget.maxMins
                            ? `Max ${item.budget.maxMins / 60}h`
                            : item.budget.minMins
                            ? `Min ${item.budget.minMins / 60}h`
                            : `Target ${item.budget.targetMins ? item.budget.targetMins / 60 : 0}h`;

                        // Status Color Mapping
                        let statusColor = "bg-zinc-700 text-zinc-300";
                        let progressColor = "from-indigo-500 to-purple-500 shadow-indigo-500/20";
                        if (item.status === "over") {
                            statusColor = "bg-rose-500/10 text-rose-400 border border-rose-500/20";
                            progressColor = "from-rose-500 to-orange-500 shadow-rose-500/20";
                        } else if (item.status === "warning") {
                            statusColor = "bg-amber-500/10 text-amber-400 border border-amber-500/20";
                            progressColor = "from-amber-400 to-orange-400 shadow-amber-400/20";
                        } else if (item.status === "on_track") {
                            statusColor = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
                            progressColor = "from-emerald-500 to-teal-500 shadow-emerald-500/20";
                        }

                        return (
                            <div 
                                key={item.categoryId}
                                className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 hover:border-white/10 transition-all flex flex-col justify-between"
                            >
                                <div className="flex items-start justify-between mb-3 gap-2">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <span className="text-xl shrink-0">{item.emoji}</span>
                                        <div className="min-w-0">
                                            <div className="text-sm font-extrabold text-white truncate">{item.categoryName}</div>
                                            <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{limitText}</div>
                                        </div>
                                    </div>
                                    {!isEditing ? (
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full ${statusColor}`}>
                                                {item.status.replace("_", " ")}
                                            </span>
                                            <button
                                                onClick={() => handleStartEdit(item.categoryId, item.budget.targetMins, item.budget.maxMins, item.budget.minMins)}
                                                className="p-1 rounded bg-white/5 text-zinc-500 hover:text-white hover:bg-white/10 transition cursor-pointer"
                                            >
                                                <Edit2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handleSaveEdit(item.categoryId)}
                                            className="p-1 rounded bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500 hover:text-white transition cursor-pointer shrink-0"
                                        >
                                            <Check className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>

                                {isEditing ? (
                                    <div className="grid grid-cols-3 gap-2 mt-2 mb-3">
                                        <div>
                                            <label className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest block mb-0.5">Min (Hrs)</label>
                                            <input
                                                type="number"
                                                step="0.5"
                                                value={editMinHours}
                                                onChange={(e) => setEditMinHours(e.target.value)}
                                                className="w-full bg-zinc-950 border border-white/5 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest block mb-0.5">Target (Hrs)</label>
                                            <input
                                                type="number"
                                                step="0.5"
                                                value={editTargetHours}
                                                onChange={(e) => setEditTargetHours(e.target.value)}
                                                className="w-full bg-zinc-950 border border-white/5 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest block mb-0.5">Max (Hrs)</label>
                                            <input
                                                type="number"
                                                step="0.5"
                                                value={editMaxHours}
                                                onChange={(e) => setEditMaxHours(e.target.value)}
                                                className="w-full bg-zinc-950 border border-white/5 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-2 mt-1">
                                        <div className="flex justify-between items-baseline text-xs">
                                            <div className="text-zinc-500">
                                                Spent: <span className="font-black text-zinc-300 tabular-nums">{formatDebtTime(item.spentMins)}</span>
                                            </div>
                                            <div className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-widest tabular-nums">
                                                {Math.round(item.percentage * 100)}%
                                            </div>
                                        </div>
                                        {/* Progress bar */}
                                        <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden p-0.5 border border-white/5">
                                            <div
                                                className={`h-full bg-gradient-to-r ${progressColor} rounded-full transition-all duration-700 shadow-sm`}
                                                style={{ width: `${Math.min(item.percentage * 100, 100)}%` }}
                                            />
                                        </div>
                                        {/* Quick Warnings / Overdraft Alerts */}
                                        {item.status === "over" && (
                                            <div className="flex items-center gap-1 text-[9px] font-bold text-rose-400 mt-1 uppercase tracking-wider">
                                                <AlertTriangle className="w-3 h-3" /> Overdraft Limit Reached
                                            </div>
                                        )}
                                        {item.status === "on_track" && item.budget.minMins && item.spentMins >= item.budget.minMins && (
                                            <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-400 mt-1 uppercase tracking-wider">
                                                <ShieldCheck className="w-3 h-3" /> Minimum Target Met
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
