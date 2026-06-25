import { useEffect, useState } from "react";
import DashboardLayout from "../components/common/DashboardLayout";
import LoginScreen from "../components/auth/LoginScreen";
import { useAuthStore } from "../store/useAuthStore";
import { migrateLegacyBlobIfNeeded } from "../services/migrateLegacyBlob";
import { hydrateFromCloud, setCloudUserId } from "../store/useScheduleStore";


export default function App() {
  const user = useAuthStore((s) => s.user);
  const session = useAuthStore((s) => s.session);
  const [hydratedUserId, setHydratedUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !session) {
      setCloudUserId(null);
      return;
    }

    // User is signed in — set up cloud sync and hydrate
    setCloudUserId(user.id);
    let cancelled = false;

    migrateLegacyBlobIfNeeded()
      .catch((err) => console.error("Legacy migration failed:", err))
      .finally(() => {
        hydrateFromCloud(user.id)
      .catch((err) => console.error("Cloud sync failed:", err))
      .finally(() => {
        if (!cancelled) {
          setHydratedUserId(user.id);
        }
      });
      });

    return () => {
      cancelled = true;
    };
  }, [user, session]);

  // No user → login screen
  if (!user || !session) {
    return <LoginScreen />;
  }

  // User exists but still syncing from cloud
  if (hydratedUserId !== user.id) {
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
