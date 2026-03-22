"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { LoadingState } from "@/components/layout/LoadingState";
import { consumeOpenRouterLlmReturn } from "@/lib/openrouter-llm-return-session";

export const OpenRouterCallback = ({
    code,
    prompt,
    forumThreadId,
}: {
    code: string;
    prompt?: string;
    forumThreadId?: string;
}) => {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const codeVerifier = sessionStorage.getItem("openrouter_code_verifier");
        if (!codeVerifier) {
            setError("Missing code verifier. Please try connecting again.");
            return;
        }

        sessionStorage.removeItem("openrouter_code_verifier");

        fetch("/api/openrouter-auth", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code, codeVerifier }),
        })
            .then(async (res) => {
                if (!res.ok) {
                    const data = await res.json().catch(() => null);
                    setError(data?.error || "Failed to connect OpenRouter");
                    return;
                }
                const stored = consumeOpenRouterLlmReturn();
                const resolvedPrompt = prompt ?? stored.prompt;
                const resolvedForumId = forumThreadId ?? stored.forumThreadId;
                const params = new URLSearchParams();
                if (resolvedPrompt != null && resolvedPrompt !== "")
                    params.set("prompt", resolvedPrompt);
                if (resolvedForumId != null && resolvedForumId !== "")
                    params.set("forumThreadId", resolvedForumId);
                const q = params.toString();
                router.push(`/llm${q ? `?${q}` : ""}`);
            })
            .catch(() => setError("Failed to connect OpenRouter"));
    }, [code, forumThreadId, prompt, router]);

    if (error) {
        return (
            <main className="mx-auto flex min-h-[calc(100vh-65px)] max-w-xl items-center justify-center px-4">
                <div className="flex flex-col items-center gap-4 text-center">
                    <p className="text-sm text-red-600">{error}</p>
                    <button
                        onClick={() => router.push("/llm")}
                        className="cursor-pointer text-sm text-gray-500 underline hover:text-gray-700"
                    >
                        Go back
                    </button>
                </div>
            </main>
        );
    }

    return <LoadingState message="Connecting OpenRouter account..." />;
};
