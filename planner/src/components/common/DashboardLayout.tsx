import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import Timeline from "../schedule/Timeline";
import SleepAnalysis from "../schedule/SleepAnalysis";
import CalendarSync from "./CalendarSync";
import AnalyticsDashboard from "../analytics/AnalyticsDashboard";
import JournalPage from "../journal/JournalPage";
import SettingsPage from "../settings/SettingsPage";
import { useScheduleStore } from "../../store/useScheduleStore";

export default function DashboardLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { currentTab } = useScheduleStore();

    const renderTabContent = () => {
        switch (currentTab) {
            case "schedule":
                return (
                    <div className="max-w-6xl mx-auto grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-8">
                        <div>
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
            case "settings":
                return <SettingsPage />;
            default:
                return null;
        }
    };

    return (
        <div className="flex min-h-screen text-white selection:bg-white/20 relative font-sans">
            <div className="glass-bg" />
            
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-md"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar with Mobile Transform */}
            <div className={`fixed lg:static inset-y-0 left-0 z-50 h-full transform transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <Sidebar onClose={() => setIsSidebarOpen(false)} />
            </div>

            <div className="flex-1 flex flex-col min-w-0 relative">
                <Topbar onMenuClick={() => setIsSidebarOpen(true)} />
                <main className="flex-1 overflow-auto p-4 md:p-8 pt-6 pb-24 relative">
                    {renderTabContent()}
                </main>
            </div>
        </div>
    );
}