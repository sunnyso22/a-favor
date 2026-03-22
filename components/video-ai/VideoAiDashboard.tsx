"use client";

import { useEffect, useState, useTransition } from "react";

import { useRouter } from "next/navigation";

import {
    createVideoShare,
    disconnectPoe,
    revokeVideoShare,
    syncVideoShareStatus,
} from "@/app/video-ai/actions";

import { ErrorBanner } from "@/components/layout/ErrorBanner";
import { CreateVideoShareForm } from "@/components/video-ai/CreateVideoShareForm";
import { PoeApiKeyModal } from "@/components/video-ai/PoeApiKeyModal";
import { VideoShareList } from "@/components/video-ai/VideoShareList";
import type { VideoShare } from "@/components/video-ai/types";

import { TASK_MODEL_OPTIONS } from "@/config/ai-models";

const isPendingStatus = (status: string) =>
    status === "queued" || status === "in_progress";

export const VideoAiDashboard = ({
    shares,
    poeKeyMissing = false,
    initialPrompt,
    initialStudioTaskId,
}: {
    shares: VideoShare[];
    /** When true, a modal collects the Poe API key (stored in `poe_account`). */
    poeKeyMissing?: boolean;
    initialPrompt?: string;
    initialStudioTaskId?: string;
}) => {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [creating, setCreating] = useState(false);
    const [prompt, setPrompt] = useState(initialPrompt ?? "");
    const [model, setModel] = useState<string>(TASK_MODEL_OPTIONS[0]);
    const [expiresInHours, setExpiresInHours] = useState(24);
    const [error, setError] = useState<string | null>(null);
    const [poeKeyModalOpen, setPoeKeyModalOpen] = useState(false);

    useEffect(() => {
        if (!poeKeyMissing) setPoeKeyModalOpen(false);
    }, [poeKeyMissing]);

    useEffect(() => {
        if (poeKeyMissing) return;
        const ids = shares
            .filter((s) => isPendingStatus(s.status))
            .map((s) => s.id);
        if (ids.length === 0) return;

        const tick = () => {
            startTransition(async () => {
                await Promise.all(ids.map((id) => syncVideoShareStatus(id)));
                router.refresh();
            });
        };

        tick();
        const t = setInterval(tick, 5000);
        return () => clearInterval(t);
    }, [shares, router, startTransition, poeKeyMissing]);

    const handleCreate = () => {
        if (!prompt.trim()) {
            setError("Please enter a prompt");
            return;
        }
        setCreating(true);
        setError(null);
        startTransition(async () => {
            const result = await createVideoShare(
                prompt.trim(),
                model,
                expiresInHours,
                initialStudioTaskId?.trim() || undefined
            );
            if (result.error) {
                setError(result.error);
                setCreating(false);
            } else if (initialStudioTaskId) {
                setCreating(false);
                router.push(`/studio/${initialStudioTaskId}`);
            } else {
                setPrompt("");
                setCreating(false);
                router.refresh();
            }
        });
    };

    const handleRevoke = (id: string) => {
        startTransition(async () => {
            const result = await revokeVideoShare(id);
            if (result.error) setError(result.error);
            else router.refresh();
        });
    };

    const handleDisconnect = () => {
        startTransition(async () => {
            const result = await disconnectPoe();
            if (result.error) setError(result.error);
            else router.refresh();
        });
    };

    return (
        <div className="relative mx-auto max-w-xl px-4 py-16">
            <PoeApiKeyModal
                open={poeKeyModalOpen && poeKeyMissing}
                onDismiss={() => setPoeKeyModalOpen(false)}
            />

            <div className="mb-8 flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <h1 className="section-title text-2xl">Video AI</h1>
                    <p className="text-ink-muted mt-1 text-sm">
                        Poe-powered video generation with shareable links.
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                        {poeKeyMissing ? (
                            <>
                                <span className="text-ink-muted">
                                    Poe API key:{" "}
                                    <span className="text-amber-800">
                                        not connected
                                    </span>
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setPoeKeyModalOpen(true)}
                                    className="btn-dream cursor-pointer px-3 py-1 text-xs"
                                >
                                    Add API key
                                </button>
                            </>
                        ) : (
                            <span className="text-ink-muted">
                                Poe API key:{" "}
                                <span className="text-emerald-800">
                                    connected
                                </span>
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex shrink-0 gap-2">
                    {!poeKeyMissing && (
                        <button
                            type="button"
                            onClick={handleDisconnect}
                            disabled={isPending}
                            className="cursor-pointer rounded-sm border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                        >
                            Remove Poe key
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <ErrorBanner error={error} onDismiss={() => setError(null)} />
            )}

            <CreateVideoShareForm
                prompt={prompt}
                onPromptChange={setPrompt}
                model={model}
                onModelChange={setModel}
                expiresInHours={expiresInHours}
                onExpiresInHoursChange={setExpiresInHours}
                creating={creating}
                onSubmit={handleCreate}
            />

            <VideoShareList shares={shares} onRevoke={handleRevoke} />
        </div>
    );
};
