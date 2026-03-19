"use client";

import {
    createDelegation,
    disconnectOpenRouter,
    revokeDelegation,
} from "@/app/llm-delegation/actions";

import { useState, useTransition } from "react";

import { ErrorBanner } from "@/components/layout/ErrorBanner";
import { CreateDelegationForm } from "@/components/llm-delegation/CreateDelegationForm";
import { DelegationList } from "@/components/llm-delegation/DelegationList";
import type { Delegation } from "@/components/llm-delegation/types";

import { authClient } from "@/lib/auth-client";

export const DelegationDashboard = ({
    delegations,
}: {
    delegations: Delegation[];
}) => {
    const [isPending, startTransition] = useTransition();
    const [creating, setCreating] = useState(false);
    const [prompt, setPrompt] = useState("");
    const [expiresInHours, setExpiresInHours] = useState(24);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleCreate = () => {
        if (!prompt.trim()) {
            setError("Please enter a prompt");
            return;
        }
        setCreating(true);
        setError(null);
        startTransition(async () => {
            const result = await createDelegation(
                prompt.trim(),
                expiresInHours
            );
            if (result?.error) {
                setError(result.error);
            } else {
                setPrompt("");
            }
            setCreating(false);
        });
    };

    const handleRevoke = (id: string) => {
        startTransition(async () => {
            const result = await revokeDelegation(id);
            if (result?.error) setError(result.error);
        });
    };

    const handleDisconnect = () => {
        startTransition(async () => {
            const result = await disconnectOpenRouter();
            if (result?.error) setError(result.error);
        });
    };

    const handleSignOut = async () => {
        await authClient.signOut();
    };

    const copyLink = (token: string, id: string) => {
        const url = `${window.location.origin}/llm-delegatee/${token}`;
        navigator.clipboard.writeText(url);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-xl px-4 py-16">
            <div className="mb-8 flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        LLM Delegation
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Ask the LLM a question and share the response via a
                        link.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleDisconnect}
                        disabled={isPending}
                        className="cursor-pointer rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                    >
                        Disconnect OpenRouter
                    </button>
                    <button
                        onClick={handleSignOut}
                        className="cursor-pointer rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
                    >
                        Sign out
                    </button>
                </div>
            </div>

            {error && (
                <ErrorBanner error={error} onDismiss={() => setError(null)} />
            )}

            <CreateDelegationForm
                prompt={prompt}
                onPromptChange={setPrompt}
                expiresInHours={expiresInHours}
                onExpiresInHoursChange={setExpiresInHours}
                creating={creating}
                onSubmit={handleCreate}
            />

            <DelegationList
                delegations={delegations}
                copiedId={copiedId}
                onCopyLink={copyLink}
                onRevoke={handleRevoke}
            />
        </main>
    );
};
