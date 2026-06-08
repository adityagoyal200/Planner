import { useEffect, useRef } from "react";
import { useAuthStore, decodeGoogleJwt } from "../../store/useAuthStore";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function LoginScreen() {
    const { setUser } = useAuthStore();
    const buttonRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const initGoogle = () => {
            const google = (window as any).google;
            if (!google?.accounts?.id) {
                setTimeout(initGoogle, 300);
                return;
            }

            google.accounts.id.initialize({
                client_id: CLIENT_ID,
                callback: (response: { credential: string }) => {
                    const user = decodeGoogleJwt(response.credential);
                    setUser(user);
                },
            });

            if (buttonRef.current) {
                google.accounts.id.renderButton(buttonRef.current, {
                    theme: "filled_black",
                    size: "large",
                    shape: "pill",
                    text: "signin_with",
                    width: 300,
                });
            }
        };
        initGoogle();
    }, [setUser]);

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

                    {/* Google Sign-In Button */}
                    <div className="flex justify-center">
                        <div ref={buttonRef} />
                    </div>

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
