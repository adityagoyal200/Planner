import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import Timeline from "../schedule/Timeline";
import SleepAnalysis from "../schedule/SleepAnalysis";
import CalendarSync from "./CalendarSync";
import AnalyticsDashboard from "../analytics/AnalyticsDashboard";
import JournalPage from "../journal/JournalPage";
import HabitTracker from "../habits/HabitTracker";
import SettingsPage from "../settings/SettingsPage";
import WeekNavigator from "../schedule/WeekNavigator";
import NewWeekBanner from "../schedule/NewWeekBanner";
import { useScheduleStore } from "../../store/useScheduleStore";
import { useGoogleCalendarSession } from "../../hooks/useGoogleCalendarSession";
import { Toaster } from "react-hot-toast";
import LevelUpModal from "./LevelUpModal";
import { startNotificationScheduler, stopNotificationScheduler } from "../../services/notificationService";
import { startWeekRolloverScheduler } from "../../services/weekRolloverService";

const ACCENT_MAP: Record<string, string> = {
    indigo: "#6366f1",
    rose: "#f43f5e",
    emerald: "#10b981",
    violet: "#8b5cf6",
    amber: "#f59e0b",
    cyan: "#06b6d4",
};

export default function DashboardLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { currentTab, accentColor, compactMode, notificationPrefs } = useScheduleStore();

    useGoogleCalendarSession();

    useEffect(() => startWeekRolloverScheduler(), []);

    // Notification scheduler lifecycle
    useEffect(() => {
        if (notificationPrefs.enabled) {
            startNotificationScheduler();
        } else {
            stopNotificationScheduler();
        }
        return () => stopNotificationScheduler();
    }, [notificationPrefs.enabled]);

    const accentHex = ACCENT_MAP[accentColor] || ACCENT_MAP.indigo;

    const renderTabContent = () => {
        switch (currentTab) {
            case "schedule":
                return (
                    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_minmax(0,380px)] gap-6 lg:gap-8">
                        <div>
                            <NewWeekBanner />
                            <Timeline />
                        </div>
                        <div className="space-y-6">
                            <SleepAnalysis />
                            <CalendarSync />
                        </div>
                    </div>
                );
            case "analytics":
                return <AnalyticsDashboard />;
            case "journal":
                return <JournalPage />;
            case "habits":
                return <HabitTracker />;
            case "settings":
                return <SettingsPage />;
            default:
                return null;
        }
    };

    return (
        <div
            className={`flex min-h-screen text-white selection:bg-white/20 relative font-sans ${compactMode ? 'compact-mode' : ''}`}
            style={{ '--accent': accentHex, '--accent-light': `${accentHex}33` } as React.CSSProperties}
        >
            <div className="glass-bg" />
            
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-md"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar with Mobile Transform */}
            <div className={`fixed lg:static inset-y-0 left-0 z-50 h-full w-[min(100vw,20rem)] max-w-[85vw] sm:max-w-none sm:w-80 transform transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <Sidebar onClose={() => setIsSidebarOpen(false)} />
            </div>

            <div className="flex-1 flex flex-col min-w-0 relative w-full">
                <Topbar onMenuClick={() => setIsSidebarOpen(true)} />
                <main className="flex-1 overflow-x-hidden overflow-y-auto app-main pt-4 md:pt-6 relative">
                    <div className="max-w-6xl mx-auto">
                        <WeekNavigator />
                    </div>
                    {renderTabContent()}
                </main>
            </div>
            <Toaster position="top-center" containerClassName="safe-pt" toastOptions={{ className: "max-w-[calc(100vw-2rem)]" }} />
            <LevelUpModal />
        </div>
    );
}