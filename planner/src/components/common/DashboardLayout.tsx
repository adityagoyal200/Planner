import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import Timeline from "../schedule/Timeline";
import SleepAnalysis from "../schedule/SleepAnalysis";
import SettingsPanel from "../settings/SettingsPanel";
import WeeklyAnalysis from "../analytics/WeeklyAnalysis";

export default function DashboardLayout() {
    return (
        <div className="flex min-h-screen bg-black text-white selection:bg-zinc-800">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <Topbar />
                <main className="flex-1 overflow-auto p-8 relative">
                    <div className="max-w-6xl mx-auto grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-8">
                        <div>
                            <Timeline />
                        </div>
                        <div className="space-y-6">
                            <SleepAnalysis />
                            <WeeklyAnalysis />
                            <SettingsPanel />
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}