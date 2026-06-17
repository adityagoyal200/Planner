import { useScheduleStore } from "../../store/useScheduleStore";
import { getWeekLabel } from "../../utils/dateUtils";
import XPCard from "./XPCard";
import SleepLineChart from "./SleepLineChart";
import TimeDonut from "./TimeDonut";
import FocusSparkline from "./FocusSparkline";
import DayScoreHeatmap from "./DayScoreHeatmap";
import BadgeGrid from "./BadgeGrid";
import InsightsPanel from "./InsightsPanel";
import WeeklyHistory from "./WeeklyHistory";

export default function AnalyticsDashboard() {
    const { currentWeekKey, browsingWeekKey } = useScheduleStore();
    const weekLabel = getWeekLabel(browsingWeekKey || currentWeekKey);

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="page-header mb-2">
                <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-500">
                    Analytics
                </h1>
                <span className="page-header-sub text-[10px] uppercase font-bold tracking-widest text-zinc-600">
                    Weekly Performance — {weekLabel}
                </span>
            </div>

            {/* XP & Level */}
            <XPCard />

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SleepLineChart />
                <TimeDonut />
            </div>

            {/* Focus + Heatmap */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FocusSparkline />
                <DayScoreHeatmap />
            </div>

            {/* Insights */}
            <InsightsPanel />

            {/* Badges */}
            <BadgeGrid />

            {/* Weekly History */}
            <WeeklyHistory />
        </div>
    );
}
