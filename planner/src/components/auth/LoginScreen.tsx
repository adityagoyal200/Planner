import { useEffect, useState } from "react";
import { supabase } from "../../services/supabase";
import { useAuthStore } from "../../store/useAuthStore";

export default function LoginScreen() {
    const { setSession } = useAuthStore();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Hydrate from existing Supabase session if present
        supabase.auth.getSession().then(({ data }) => setSession(data.session));
        const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });
        return () => sub.subscription.unsubscribe();
    }, [setSession]);

    const signInWithGoogle = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: window.location.origin,
                },
            });
            if (error) setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
            {/* Background gradient orbs */}
            <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-600/10 rounded-full blur-[128px] pointer-events-none" />
            <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-600/10 rounded-full blur-[128px] pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center gap-10 px-6">
                {/* Logo / Brand */}
                <div className="text-center">
                    <div className="text-6xl md:text-7xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-white via-zinc-300 to-zinc-600 mb-3">
                        Planner
                    </div>
                    <div className="text-zinc-500 text-xs uppercase tracking-[0.3em] font-bold">
                        Your Personal Operating System
                    </div>
                </div>

                {/* Card */}
                <div className="bg-zinc-950/80 border border-zinc-800/60 rounded-3xl p-8 md:p-10 backdrop-blur-xl shadow-2xl shadow-black/50 max-w-sm w-full">
                    <div className="text-center mb-8">
                        <h2 className="text-white font-bold text-lg mb-2">Welcome back</h2>
                        <p className="text-zinc-500 text-sm leading-relaxed">
                            Sign in to sync your schedule across all your devices.
                        </p>
                    </div>

                    <div className="flex justify-center">
                        <button
                            onClick={signInWithGoogle}
                            disabled={isLoading}
                            className="w-full rounded-xl bg-white text-black px-4 py-3 font-black shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all duration-300 disabled:opacity-50"
                        >
                            {isLoading ? "Opening Google..." : "Continue with Google"}
                        </button>
                    </div>

                    {error && (
                        <div className="mt-4 text-xs text-rose-400 font-bold text-center">
                            {error}
                        </div>
                    )}

                    <div className="mt-8 pt-6 border-t border-zinc-800/50 text-center">
                        <p className="text-zinc-600 text-[11px] leading-relaxed">
                            Your data is securely synced via cloud storage.
                            <br />
                            Only you can access your planner.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-zinc-700 text-[10px] font-bold uppercase tracking-widest">
                    Built for builders
                </div>
            </div>
        </div>
    );
}
