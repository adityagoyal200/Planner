import { useEffect, useState } from "react";
import DashboardLayout from "../components/common/DashboardLayout";
import LoginScreen from "../components/auth/LoginScreen";
import { useAuthStore } from "../store/useAuthStore";
import { hydrateFromCloud, setCloudUserId } from "../store/useScheduleStore";

export default function App() {
  const user = useAuthStore((s) => s.user);
  const [syncing, setSyncing] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!user) {
      setCloudUserId(null);
      setHydrated(false);
      return;
    }

    // User is signed in — set up cloud sync and hydrate
    setCloudUserId(user.sub);
    setSyncing(true);

    hydrateFromCloud(user.sub)
      .catch((err) => console.error("Cloud sync failed:", err))
      .finally(() => {
        setSyncing(false);
        setHydrated(true);
      });
  }, [user]);

  // No user → login screen
  if (!user) {
    return <LoginScreen />;
  }

  // User exists but still syncing from cloud
  if (syncing || !hydrated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-zinc-700 border-t-white rounded-full animate-spin" />
          <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">
            Syncing your plan...
          </p>
        </div>
      </div>
    );
  }

  return <DashboardLayout />;
}