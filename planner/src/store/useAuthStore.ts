import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Session, User } from "@supabase/supabase-js";

export interface AuthUser {
    id: string; // Supabase auth.uid()
    email: string | null;
    name: string | null;
    picture: string | null;
}

interface AuthStore {
    user: AuthUser | null;
    session: Session | null;
    setSession: (session: Session | null) => void;
    logout: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
    persist(
        (set) => ({
            user: null,
            session: null,
            setSession: (session) => {
                const u: User | null = session?.user ?? null;
                const meta = (u?.user_metadata || {}) as Record<string, unknown>;
                set({
                    session,
                    user: u ? {
                        id: u.id,
                        email: u.email ?? null,
                        name: typeof meta.full_name === "string" ? meta.full_name : (typeof meta.name === "string" ? meta.name : null),
                        picture: typeof meta.avatar_url === "string" ? meta.avatar_url : (typeof meta.picture === "string" ? meta.picture : null),
                    } : null,
                });
            },
            logout: async () => {
                const { supabase } = await import("../services/supabase");
                await supabase.auth.signOut();
                set({ user: null, session: null });
                localStorage.removeItem("planner-storage");
                window.location.reload();
            },
        }),
        {
            name: "planner-auth",
        }
    )
);
