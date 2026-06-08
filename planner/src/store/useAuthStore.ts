import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface GoogleUser {
    sub: string;       // unique Google user ID
    email: string;
    name: string;
    picture: string;
}

interface AuthStore {
    user: GoogleUser | null;
    setUser: (user: GoogleUser | null) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
    persist(
        (set) => ({
            user: null,
            setUser: (user) => set({ user }),
            logout: () => {
                set({ user: null });
                localStorage.removeItem("planner-storage");
                window.location.reload();
            },
        }),
        {
            name: "planner-auth",
        }
    )
);

/**
 * Decode a Google ID token (JWT) to extract user info.
 * We only need the payload (middle segment), no signature verification needed
 * since we trust Google's endpoint.
 */
export function decodeGoogleJwt(credential: string): GoogleUser {
    const payload = credential.split(".")[1];
    const decoded = JSON.parse(atob(payload));
    return {
        sub: decoded.sub,
        email: decoded.email,
        name: decoded.name,
        picture: decoded.picture,
    };
}
