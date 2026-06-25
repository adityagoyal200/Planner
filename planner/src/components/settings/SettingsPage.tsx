import { useScheduleStore } from "../../store/useScheduleStore";
import { useAuthStore } from "../../store/useAuthStore";
import { setCloudUserId, forcePushToCloud } from "../../store/useScheduleStore";
import { useState } from "react";
import type { DayKey } from "../../store/useScheduleStore";
import { toLocalISODate } from "../../utils/dateUtils";
import { parseTimeInput } from "../../utils/timeUtils";
import { requestNotificationPermission, getNotificationPermission, isNotificationSupported } from "../../services/notificationService";

const ACCENT_COLORS = [
    { id: "indigo", color: "#6366f1", label: "Indigo" },
    { id: "rose", color: "#f43f5e", label: "Rose" },
    { id: "emerald", color: "#10b981", label: "Emerald" },
    { id: "violet", color: "#8b5cf6", label: "Violet" },
    { id: "amber", color: "#f59e0b", label: "Amber" },
    { id: "cyan", color: "#06b6d4", label: "Cyan" },
];

function minsToTime(mins: number) {
    const positiveMins = ((mins % 1440) + 1440) % 1440;
    const h = Math.floor(positiveMins / 60).toString().padStart(2, "0");
    const m = (positiveMins % 60).toString().padStart(2, "0");
    return `${h}:${m}`;
}

export default function SettingsPage() {
    const store = useScheduleStore();
    const { user, logout } = useAuthStore();
    const [syncStatus, setSyncStatus] = useState<string | null>(null);

    const {
        selectedDay, week, updateWakeTime, updateCommute, updateWorkStart,
        pomodoroWork, pomodoroBreak, pomodoroLongBreak, pomodoroSessions,
        accentColor, compactMode, gamificationEnabled, durationDisplayUnit,
        updateSettings, resetStore, xp,
        streakFreezes, copyDayScheduleToWeek,
    } = store;

    const day = week[selectedDay];

    const DAY_LABELS: Record<DayKey, string> = {
        mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday",
        fri: "Friday", sat: "Saturday", sun: "Sunday"
    };

    const applyToAllDays = () => {
        const allDays: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
        for (const d of allDays) {
            if (d !== selectedDay) {
                updateWakeTime(d, day.wakeTime);
                updateCommute(d, day.commuteMins);
                updateWorkStart(d, day.workStart);
                useScheduleStore.setState((state) => ({
                    week: { ...state.week, [d]: { ...state.week[d], sleepTarget: day.sleepTarget }}
                }));
            }
        }
    };

    const handleExport = () => {
        const data = JSON.stringify(useScheduleStore.getState(), null, 2);
        const blob = new Blob([data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `planner-backup-${toLocalISODate()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImport = () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    const data = JSON.parse(ev.target?.result as string);
                    if (data.week) {
                        useScheduleStore.setState(data);
                        alert("Data imported successfully!");
                    } else {
                        alert("Invalid backup file.");
                    }
                } catch {
                    alert("Failed to parse file.");
                }
            };
            reader.readAsText(file);
        };
        input.click();
    };

    const handleSync = async () => {
        setSyncStatus("Syncing...");
        await forcePushToCloud();
        setSyncStatus("Synced!");
        setTimeout(() => setSyncStatus(null), 2000);
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div className="page-header mb-2">
                <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-500">
                    Settings
                </h1>
            </div>

            {/* Account */}
            {user && (
                <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <h2 className="text-sm font-bold text-zinc-300 mb-4">Account</h2>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <img src={user.picture || undefined} alt={user.name || undefined} className="w-12 h-12 rounded-full border-2 border-zinc-800 shrink-0" referrerPolicy="no-referrer" />
                        <div className="min-w-0">
                            <div className="text-sm font-bold text-white truncate">{user.name}</div>
                            <div className="text-xs text-zinc-500 truncate">{user.email}</div>
                        </div>
                        <button
                            onClick={() => { setCloudUserId(null); logout(); }}
                            className="sm:ml-auto w-full sm:w-auto text-xs font-bold text-zinc-500 hover:text-rose-400 bg-zinc-900 hover:bg-rose-950 px-3 py-2 rounded-lg transition-colors cursor-pointer text-center"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            )}

            {/* Schedule Defaults */}
            <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
                <h2 className="text-sm font-bold text-zinc-300 mb-1">Schedule — {DAY_LABELS[selectedDay]}</h2>
                <p className="text-[10px] text-zinc-600 mb-4">These settings apply to the currently selected day. Use the button below to copy to all days.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Wake Time (24h)</label>
                        <input
                            type="text"
                            inputMode="numeric"
                            placeholder="HH:MM"
                            defaultValue={minsToTime(day.wakeTime)}
                            key={`wake-${selectedDay}-${day.wakeTime}`}
                            onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                            onBlur={(e) => {
                                const mins = parseTimeInput(e.target.value, 23);
                                if (mins !== null) {
                                    updateWakeTime(selectedDay, mins);
                                } else {
                                    e.target.value = minsToTime(day.wakeTime);
                                }
                            }}
                            className="mt-1 w-full rounded-xl border border-zinc-800 bg-[#050505] p-3 text-white focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30 focus:outline-none transition shadow-inner tabular-nums"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Work Start (24h)</label>
                        <input
                            type="text"
                            inputMode="numeric"
                            placeholder="HH:MM"
                            defaultValue={day.workStart > 0 ? minsToTime(day.workStart) : ""}
                            key={`work-${selectedDay}-${day.workStart}`}
                            disabled={day.workStart <= 0 && day.commuteMins <= 0}
                            onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                            onBlur={(e) => {
                                const mins = parseTimeInput(e.target.value, 23);
                                if (mins !== null) {
                                    updateWorkStart(selectedDay, mins);
                                } else {
                                    e.target.value = day.workStart > 0 ? minsToTime(day.workStart) : "";
                                }
                            }}
                            className="mt-1 w-full rounded-xl border border-zinc-800 bg-[#050505] p-3 text-white focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30 focus:outline-none transition shadow-inner tabular-nums disabled:opacity-40"
                        />
                        <p className="text-[10px] text-zinc-600 mt-1">Anchors the work block start time on the timeline.</p>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Commute</label>
                        <select
                            value={day.commuteMins}
                            onChange={(e) => updateCommute(selectedDay, Number(e.target.value))}
                            className="mt-1 w-full rounded-xl border border-zinc-800 bg-[#050505] p-3 text-white focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30 focus:outline-none transition shadow-inner cursor-pointer"
                        >
                            <option value={0}>None (WFH)</option>
                            <option value={15}>15 mins</option>
                            <option value={30}>30 mins</option>
                            <option value={45}>45 mins</option>
                            <option value={60}>60 mins</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Sleep Target</label>
                        <select
                            value={day.sleepTarget}
                            onChange={(e) => {
                                useScheduleStore.setState((state) => ({
                                    week: { ...state.week, [selectedDay]: { ...state.week[selectedDay], sleepTarget: Number(e.target.value) }}
                                }));
                            }}
                            className="mt-1 w-full rounded-xl border border-zinc-800 bg-[#050505] p-3 text-white focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30 focus:outline-none transition shadow-inner cursor-pointer"
                        >
                            {[5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10].map(h => (
                                <option key={h} value={h * 60}>{h} hours</option>
                            ))}
                        </select>
                    </div>
                </div>
                <button
                    onClick={applyToAllDays}
                    className="mt-4 w-full p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-xs font-bold text-indigo-400 hover:bg-indigo-500 hover:text-white transition-colors cursor-pointer"
                >
                    Apply wake / work / sleep to all days
                </button>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={() => copyDayScheduleToWeek(selectedDay, false)}
                        className="p-2.5 rounded-xl bg-zinc-800/50 border border-zinc-700 text-xs font-bold text-zinc-300 hover:bg-zinc-700 transition-colors cursor-pointer"
                    >
                        Copy {DAY_LABELS[selectedDay]} to weekdays
                    </button>
                    <button
                        type="button"
                        onClick={() => copyDayScheduleToWeek(selectedDay, true)}
                        className="p-2.5 rounded-xl bg-zinc-800/50 border border-zinc-700 text-xs font-bold text-zinc-300 hover:bg-zinc-700 transition-colors cursor-pointer"
                    >
                        Copy {DAY_LABELS[selectedDay]} to all days
                    </button>
                </div>
                <p className="text-[10px] text-zinc-600 mt-2">Week template copies blocks plus wake, work, commute, and sleep settings.</p>
            </div>

            {/* Pomodoro */}
            <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-red-500/20 to-transparent" />
                <h2 className="text-sm font-bold text-zinc-300 mb-4">Focus Timer</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Work (min)</label>
                        <input type="number" value={pomodoroWork} min={5} max={90}
                            onChange={(e) => updateSettings({ pomodoroWork: Number(e.target.value) })}
                            className="mt-1 w-full rounded-xl border border-zinc-800 bg-[#050505] p-3 text-white focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30 focus:outline-none transition shadow-inner tabular-nums"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Break (min)</label>
                        <input type="number" value={pomodoroBreak} min={1} max={30}
                            onChange={(e) => updateSettings({ pomodoroBreak: Number(e.target.value) })}
                            className="mt-1 w-full rounded-xl border border-zinc-800 bg-[#050505] p-3 text-white focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30 focus:outline-none transition shadow-inner tabular-nums"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Long Break (min)</label>
                        <input type="number" value={pomodoroLongBreak} min={5} max={60}
                            onChange={(e) => updateSettings({ pomodoroLongBreak: Number(e.target.value) })}
                            className="mt-1 w-full rounded-xl border border-zinc-800 bg-[#050505] p-3 text-white focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30 focus:outline-none transition shadow-inner tabular-nums"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Sessions</label>
                        <input type="number" value={pomodoroSessions} min={1} max={10}
                            onChange={(e) => updateSettings({ pomodoroSessions: Number(e.target.value) })}
                            className="mt-1 w-full rounded-xl border border-zinc-800 bg-[#050505] p-3 text-white focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30 focus:outline-none transition shadow-inner tabular-nums"
                        />
                    </div>
                </div>
            </div>

            {/* Gamification */}
            <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
                <h2 className="text-sm font-bold text-zinc-300 mb-4">Gamification</h2>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm text-zinc-300 font-medium">Enable XP System</div>
                            <div className="text-[10px] text-zinc-600">Earn XP and level up by completing blocks</div>
                        </div>
                        <button
                            onClick={() => updateSettings({ gamificationEnabled: !gamificationEnabled })}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${gamificationEnabled ? 'bg-amber-500' : 'bg-zinc-800'}`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${gamificationEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm text-zinc-300 font-medium">Streak Freezes</div>
                            <div className="text-[10px] text-zinc-600">Available: {streakFreezes} (resets weekly)</div>
                        </div>
                        <span className="text-lg">❄️ × {streakFreezes}</span>
                    </div>

                    {gamificationEnabled && (
                        <div className="pt-3 border-t border-zinc-800/50">
                            <div className="text-xs text-zinc-500 mb-2">Current XP: <span className="text-amber-400 font-bold">{xp.toLocaleString()}</span></div>
                            <button
                                onClick={() => {
                                    if (window.confirm("Reset all XP and badges? This cannot be undone.")) {
                                        useScheduleStore.setState({ xp: 0, earnedBadges: [] });
                                    }
                                }}
                                className="text-xs font-bold text-zinc-600 hover:text-rose-400 bg-zinc-900 hover:bg-rose-950 px-3 py-2 rounded-lg transition-colors cursor-pointer"
                            >
                                Reset XP & Badges
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Appearance */}
            <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />
                <h2 className="text-sm font-bold text-zinc-300 mb-4">Appearance</h2>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Accent Color</label>
                        <div className="flex gap-3">
                            {ACCENT_COLORS.map((c) => (
                                <button
                                    key={c.id}
                                    onClick={() => updateSettings({ accentColor: c.id })}
                                    className={`w-8 h-8 rounded-full transition-all cursor-pointer ${accentColor === c.id ? 'ring-2 ring-offset-2 ring-offset-black scale-110' : 'hover:scale-105'}`}
                                    style={{ backgroundColor: c.color, boxShadow: accentColor === c.id ? `0 0 12px ${c.color}40` : undefined }}
                                    title={c.label}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm text-zinc-300 font-medium">Block duration display</div>
                            <div className="text-[10px] text-zinc-600">Show block lengths as minutes or hours on the timeline</div>
                        </div>
                        <div className="flex rounded-xl border border-zinc-800 bg-zinc-950 p-1">
                            {(["minutes", "hours"] as const).map((unit) => (
                                <button
                                    key={unit}
                                    type="button"
                                    onClick={() => updateSettings({ durationDisplayUnit: unit })}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                                        durationDisplayUnit === unit
                                            ? "bg-white text-black shadow-sm"
                                            : "text-zinc-500 hover:text-zinc-300"
                                    }`}
                                >
                                    {unit}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm text-zinc-300 font-medium">Compact Mode</div>
                            <div className="text-[10px] text-zinc-600">Denser timeline with smaller blocks</div>
                        </div>
                        <button
                            onClick={() => updateSettings({ compactMode: !compactMode })}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${compactMode ? 'bg-violet-500' : 'bg-zinc-800'}`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${compactMode ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Notifications */}
            <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
                <h2 className="text-sm font-bold text-zinc-300 mb-4">🔔 Notifications</h2>
                <div className="space-y-4">
                    {!isNotificationSupported() ? (
                        <div className="text-xs text-zinc-500 p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/50">
                            Notifications are not supported in this browser.
                        </div>
                    ) : (
                        <>
                            {/* Master Toggle */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm font-bold text-zinc-300">Enable Notifications</div>
                                    <div className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                                        {getNotificationPermission() === "denied" ? "Blocked by browser" : "Block reminders, streak alerts & more"}
                                    </div>
                                </div>
                                <button
                                    onClick={async () => {
                                        const prefs = useScheduleStore.getState().notificationPrefs;
                                        if (!prefs.enabled) {
                                            const granted = await requestNotificationPermission();
                                            if (granted) {
                                                useScheduleStore.getState().updateNotificationPrefs({ enabled: true });
                                            }
                                        } else {
                                            useScheduleStore.getState().updateNotificationPrefs({ enabled: false });
                                        }
                                    }}
                                    disabled={getNotificationPermission() === "denied"}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                                        store.notificationPrefs.enabled ? 'bg-amber-500' : 'bg-zinc-700'
                                    }`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${store.notificationPrefs.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>

                            {store.notificationPrefs.enabled && (
                                <div className="space-y-3 pt-2 border-t border-zinc-800/50">
                                    {/* Block Reminders */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-zinc-400">Block start reminders</span>
                                        <button
                                            onClick={() => store.updateNotificationPrefs({ blockReminders: !store.notificationPrefs.blockReminders })}
                                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${store.notificationPrefs.blockReminders ? 'bg-indigo-500' : 'bg-zinc-700'}`}
                                        >
                                            <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${store.notificationPrefs.blockReminders ? 'translate-x-5' : 'translate-x-1'}`} />
                                        </button>
                                    </div>

                                    {/* Reminder Minutes Before */}
                                    {store.notificationPrefs.blockReminders && (
                                        <div className="flex items-center justify-between pl-4">
                                            <span className="text-xs text-zinc-500">Remind me before</span>
                                            <div className="flex items-center gap-1">
                                                {[3, 5, 10, 15].map(mins => (
                                                    <button
                                                        key={mins}
                                                        onClick={() => store.updateNotificationPrefs({ reminderMinsBefore: mins })}
                                                        className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                                                            store.notificationPrefs.reminderMinsBefore === mins
                                                                ? 'bg-white text-black'
                                                                : 'text-zinc-500 hover:text-zinc-300 bg-zinc-900'
                                                        }`}
                                                    >
                                                        {mins}m
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Sleep Reminder */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-zinc-400">Sleep reminder (30 min before)</span>
                                        <button
                                            onClick={() => store.updateNotificationPrefs({ sleepReminder: !store.notificationPrefs.sleepReminder })}
                                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${store.notificationPrefs.sleepReminder ? 'bg-indigo-500' : 'bg-zinc-700'}`}
                                        >
                                            <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${store.notificationPrefs.sleepReminder ? 'translate-x-5' : 'translate-x-1'}`} />
                                        </button>
                                    </div>

                                    {/* Streak Alert */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-zinc-400">Streak at-risk alert (8 PM)</span>
                                        <button
                                            onClick={() => store.updateNotificationPrefs({ streakAlert: !store.notificationPrefs.streakAlert })}
                                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${store.notificationPrefs.streakAlert ? 'bg-indigo-500' : 'bg-zinc-700'}`}
                                        >
                                            <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${store.notificationPrefs.streakAlert ? 'translate-x-5' : 'translate-x-1'}`} />
                                        </button>
                                    </div>

                                    {/* Focus Timer Done */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-zinc-400">Focus timer completion</span>
                                        <button
                                            onClick={() => store.updateNotificationPrefs({ focusTimerDone: !store.notificationPrefs.focusTimerDone })}
                                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${store.notificationPrefs.focusTimerDone ? 'bg-indigo-500' : 'bg-zinc-700'}`}
                                        >
                                            <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${store.notificationPrefs.focusTimerDone ? 'translate-x-5' : 'translate-x-1'}`} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Data Management */}
            <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
                <h2 className="text-sm font-bold text-zinc-300 mb-4">Data Management</h2>
                <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button onClick={handleExport} className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/50 text-sm font-bold text-zinc-300 hover:bg-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer">
                            📥 Export JSON
                        </button>
                        <button onClick={handleImport} className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/50 text-sm font-bold text-zinc-300 hover:bg-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer">
                            📤 Import JSON
                        </button>
                    </div>
                    <button onClick={handleSync} className="w-full p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/50 text-sm font-bold text-zinc-300 hover:bg-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer">
                        {syncStatus || "☁️ Force Sync to Cloud"}
                    </button>
                    <button
                        onClick={() => {
                            if (window.confirm("Archive the current week? This saves a snapshot to history.")) {
                                useScheduleStore.getState().archiveCurrentWeek();
                            }
                        }}
                        className="w-full p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-sm font-bold text-indigo-400 hover:bg-indigo-500 hover:text-white transition-colors cursor-pointer"
                    >
                        📦 Archive Current Week
                    </button>

                    <div className="pt-3 border-t border-zinc-800/50">
                        <button
                            onClick={() => {
                                if (window.confirm("This will DELETE ALL your data. Are you absolutely sure?")) {
                                    if (window.confirm("Last chance — this action is irreversible!")) {
                                        resetStore();
                                    }
                                }
                            }}
                            className="w-full p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-sm font-bold text-rose-400 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer"
                        >
                            ⚠️ Reset All Data
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
