import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import Timeline from "../schedule/Timeline";
import SleepAnalysis from "../schedule/SleepAnalysis";
import CalendarSync from "./CalendarSync";
import SettingsPanel from "../settings/SettingsPanel";
import WeeklyAnalysis from "../analytics/WeeklyAnalysis";

export default function DashboardLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-black text-white selection:bg-zinc-800 relative">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/80 z-40 lg:hidden backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar with Mobile Transform */}
            <div className={`fixed lg:static inset-y-0 left-0 z-50 h-full transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <Sidebar onClose={() => setIsSidebarOpen(false)} />
            </div>

            <div className="flex-1 flex flex-col min-w-0">
                <Topbar onMenuClick={() => setIsSidebarOpen(true)} />
                <main className="flex-1 overflow-auto p-4 md:p-8 relative">
                    <div className="max-w-6xl mx-auto grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-8">
                        <div>
                            <Timeline />
                        </div>
                        <div className="space-y-6">
                            <SleepAnalysis />
                            <CalendarSync />
                            <WeeklyAnalysis />
                            <SettingsPanel />
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}