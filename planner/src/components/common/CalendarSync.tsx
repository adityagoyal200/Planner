import { useEffect, useState } from "react";
import { useScheduleStore } from "../../store/useScheduleStore";
import { initGoogleAuth, requestGoogleAccess, revokeGoogleAccess, fetchTodayEvents } from "../../services/googleCalendar";

function minsToTimeStr(mins: number) {
    const h = Math.floor(mins / 60) % 24;
    const m = mins % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

export default function CalendarSync() {
    const { googleToken, setGoogleToken, calendarEvents, setCalendarEvents, clearGoogle } = useScheduleStore();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Initialize GIS
        initGoogleAuth((token) => {
            setGoogleToken(token);
        });
    }, [setGoogleToken]);

    useEffect(() => {
        if (googleToken) {
            handleFetchEvents(googleToken);
        }
    }, [googleToken]);

    const handleFetchEvents = async (token: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const events = await fetchTodayEvents(token);
            setCalendarEvents(events);
        } catch (err: any) {
            console.error(err);
            if (err.message === "TOKEN_EXPIRED") {
                clearGoogle();
                setError("Session expired. Please reconnect.");
            } else {
                setError("Failed to fetch events.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleConnect = () => {
        requestGoogleAccess();
    };

    const handleDisconnect = () => {
        if (googleToken) {
            revokeGoogleAccess(googleToken);
            clearGoogle();
        }
    };

    return (
        <div className="bg-[#0a0a0a] border border-zinc-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-zinc-300 flex items-center gap-2">
                    <svg className="w-4 h-4 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    Google Calendar
                </h3>
                {googleToken && (
                    <button 
                        onClick={handleDisconnect}
                        className="text-[10px] text-zinc-500 hover:text-rose-400 font-bold uppercase tracking-widest transition-colors"
                    >
                        Disconnect
                    </button>
                )}
            </div>

            {!googleToken ? (
                <div className="text-center py-4">
                    <p className="text-xs text-zinc-500 mb-4">Connect to see your daily events interleaved in your timeline.</p>
                    <button 
                        onClick={handleConnect}
                        className="bg-zinc-100 hover:bg-white text-zinc-900 font-bold text-sm px-4 py-2 rounded-xl transition-all"
                    >
                        Connect Calendar
                    </button>
                    {error && <p className="text-xs text-rose-500 mt-2">{error}</p>}
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-emerald-500 font-bold bg-emerald-500/10 px-2 py-1 rounded-md">Connected</span>
                        <button 
                            onClick={() => handleFetchEvents(googleToken)}
                            className="text-[10px] text-zinc-500 hover:text-white font-bold uppercase tracking-widest transition-colors flex items-center gap-1"
                            disabled={isLoading}
                        >
                            {isLoading ? "Syncing..." : "Refresh"}
                        </button>
                    </div>

                    {error && <p className="text-xs text-rose-500">{error}</p>}

                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                        {calendarEvents.length === 0 ? (
                            <p className="text-xs text-zinc-500 italic text-center py-2">No events today</p>
                        ) : (
                            calendarEvents.map(ev => (
                                <div key={ev.id} className="flex flex-col bg-zinc-900/50 p-2 rounded-lg border border-zinc-800/50">
                                    <span className="text-sm font-bold text-zinc-300 truncate">{ev.title}</span>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div 
                                            className="w-2 h-2 rounded-full" 
                                            style={{ backgroundColor: ev.color }}
                                        />
                                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                            {ev.allDay ? "All Day" : `${minsToTimeStr(ev.startMins)} - ${minsToTimeStr(ev.endMins)}`}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
