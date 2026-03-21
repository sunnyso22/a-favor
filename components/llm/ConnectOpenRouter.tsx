"use client";

import { Link } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { computeCodeChallenge, generateCodeVerifier } from "@/lib/pkce";

export const ConnectOpenRouter = () => {
    const handleConnect = async () => {
        const verifier = generateCodeVerifier();
        const challenge = await computeCodeChallenge(verifier);
        sessionStorage.setItem("openrouter_code_verifier", verifier);

        const callbackUrl = `${window.location.origin}/llm`;
        window.location.href = `https://openrouter.ai/auth?callback_url=${encodeURIComponent(callbackUrl)}&code_challenge=${challenge}&code_challenge_method=S256`;
    };

    const handleSignOut = async () => {
        await authClient.signOut();
    };

    return (
        <div className="mx-auto flex min-h-[calc(100vh-12rem)] max-w-xl items-center justify-center px-4">
            <div className="flex flex-col items-center gap-6 text-center">
                <div className="bg-surface flex h-14 w-14 items-center justify-center rounded-full">
                    <Link className="text-clay h-6 w-6" />
                </div>
                <div>
                    <h1 className="section-title text-2xl">
                        Connect your OpenRouter account
                    </h1>
                    <p className="text-ink-muted mt-2 text-sm">
                        Link your OpenRouter account to use LLM sharing. This
                        allows others to use your LLM access via shareable
                        links.
                    </p>
                </div>
                <button
                    onClick={handleConnect}
                    className="btn-dream btn-dream-primary cursor-pointer text-sm"
                >
                    Connect OpenRouter
                </button>
                <button
                    onClick={handleSignOut}
                    className="text-ink-soft hover:text-ink cursor-pointer text-xs underline transition-colors"
                >
                    Sign out
                </button>
            </div>
        </div>
    );
};
