"use client";

import { Link } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { computeCodeChallenge, generateCodeVerifier } from "@/lib/pkce";

export const ConnectOpenRouter = () => {
    const handleConnect = async () => {
        const verifier = generateCodeVerifier();
        const challenge = await computeCodeChallenge(verifier);
        sessionStorage.setItem("openrouter_code_verifier", verifier);

        const callbackUrl = `${window.location.origin}/llm-delegation`;
        window.location.href = `https://openrouter.ai/auth?callback_url=${encodeURIComponent(callbackUrl)}&code_challenge=${challenge}&code_challenge_method=S256`;
    };

    const handleSignOut = async () => {
        await authClient.signOut();
    };

    return (
        <main className="mx-auto flex min-h-[calc(100vh-65px)] max-w-xl items-center justify-center px-4">
            <div className="flex flex-col items-center gap-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-50">
                    <Link className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Connect your OpenRouter account
                    </h1>
                    <p className="mt-2 text-sm text-gray-500">
                        Link your OpenRouter account to enable LLM delegation.
                        This allows others to use your LLM access via shareable
                        links.
                    </p>
                </div>
                <button
                    onClick={handleConnect}
                    className="cursor-pointer rounded-lg bg-purple-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-purple-700 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
                >
                    Connect OpenRouter
                </button>
                <button
                    onClick={handleSignOut}
                    className="cursor-pointer text-xs text-gray-400 underline transition-colors hover:text-gray-600"
                >
                    Sign out
                </button>
            </div>
        </main>
    );
};
