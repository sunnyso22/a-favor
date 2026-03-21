"use client";

import { useState, useTransition } from "react";

import { useRouter } from "next/navigation";

import { createLlm, disconnectOpenRouter, revokeLlm } from "@/app/llm/actions";

import { ErrorBanner } from "@/components/layout/ErrorBanner";
import { CreateLlmForm } from "@/components/llm/CreateLlmForm";
import { LlmList } from "@/components/llm/LlmList";
import type { LlmShare } from "@/components/llm/types";

export const LlmDashboard = ({
    shares,
    initialPrompt,
    initialForumThreadId,
}: {
    shares: LlmShare[];
    initialPrompt?: string;
    initialForumThreadId?: string;
}) => {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [creating, setCreating] = useState(false);
    const [prompt, setPrompt] = useState(initialPrompt ?? "");
    const [expiresInHours, setExpiresInHours] = useState(24);
    const [error, setError] = useState<string | null>(null);

    const handleCreate = () => {
        if (!prompt.trim()) {
            setError("Please enter a prompt");
            return;
        }
        setCreating(true);
        setError(null);
        startTransition(async () => {
            const result = await createLlm(
                prompt.trim(),
                expiresInHours,
                initialForumThreadId
            );
            if (result?.error) {
                setError(result.error);
                setCreating(false);
            } else if (initialForumThreadId) {
                router.push(`/forum/${initialForumThreadId}`);
            } else {
                setPrompt("");
                setCreating(false);
            }
        });
    };

    const handleRevoke = (id: string) => {
        startTransition(async () => {
            const result = await revokeLlm(id);
            if (result?.error) setError(result.error);
            else router.refresh();
        });
    };

    const handleDisconnect = () => {
        startTransition(async () => {
            const result = await disconnectOpenRouter();
            if (result?.error) setError(result.error);
        });
    };

    return (
        <div className="mx-auto max-w-xl px-4 py-16">
            <div className="mb-8 flex items-start justify-between">
                <div>
                    <h1 className="section-title text-2xl">LLM</h1>
                    <p className="text-ink-muted mt-1 text-sm">
                        Ask the LLM and share the response with a link.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleDisconnect}
                        disabled={isPending}
                        className="cursor-pointer rounded-sm border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                    >
                        Disconnect OpenRouter
                    </button>
                </div>
            </div>

            {error && (
                <ErrorBanner error={error} onDismiss={() => setError(null)} />
            )}

            <CreateLlmForm
                prompt={prompt}
                onPromptChange={setPrompt}
                expiresInHours={expiresInHours}
                onExpiresInHoursChange={setExpiresInHours}
                creating={creating}
                onSubmit={handleCreate}
            />

            <LlmList shares={shares} onRevoke={handleRevoke} />
        </div>
    );
};
