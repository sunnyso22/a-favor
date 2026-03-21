"use client";

import { Loader2, ShieldCheck } from "lucide-react";

import { useState } from "react";

import { fetchGenerationMetadata } from "@/app/llm/actions";

import type { GenerationData } from "@/components/llm/types";

export const VerifyGeneration = ({ token }: { token: string }) => {
    const [metadata, setMetadata] = useState<GenerationData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [open, setOpen] = useState(false);

    const handleVerify = async () => {
        if (metadata) {
            setOpen(!open);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const result = await fetchGenerationMetadata(token);
            if (result.error) {
                setError(result.error);
                return;
            }
            if (result.data) {
                setMetadata(result.data);
                setOpen(true);
            }
        } catch {
            setError("Failed to fetch metadata");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mt-4 flex flex-col items-end">
            <button
                onClick={handleVerify}
                disabled={loading}
                className="btn-dream inline-flex cursor-pointer items-center gap-1.5 px-3 py-1.5 text-xs disabled:opacity-50"
            >
                {loading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                    <ShieldCheck className="h-3.5 w-3.5" />
                )}
                {loading
                    ? "Verifying..."
                    : open
                      ? "Hide verification"
                      : "Verify on OpenRouter"}
            </button>

            {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

            {open && metadata && (
                <div className="poster-card mt-3 rounded-sm p-4">
                    <h3 className="section-title mb-3 text-xs tracking-wide uppercase">
                        OpenRouter Generation Metadata
                    </h3>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                        <dt className="text-ink-soft">Generation ID</dt>
                        <dd className="text-ink font-mono break-all">
                            {metadata.id}
                        </dd>

                        <dt className="text-ink-soft">Model</dt>
                        <dd className="text-ink">{metadata.model}</dd>

                        <dt className="text-ink-soft">Provider</dt>
                        <dd className="text-ink">
                            {metadata.provider_name ?? "\u2014"}
                        </dd>

                        <dt className="text-ink-soft">Created</dt>
                        <dd className="text-ink">
                            {new Date(metadata.created_at).toLocaleString()}
                        </dd>

                        <dt className="text-ink-soft">Total Cost</dt>
                        <dd className="text-ink">
                            ${metadata.total_cost.toFixed(6)}
                        </dd>

                        <dt className="text-ink-soft">Prompt Tokens</dt>
                        <dd className="text-ink">
                            {metadata.native_tokens_prompt ?? "\u2014"}
                        </dd>

                        <dt className="text-ink-soft">Completion Tokens</dt>
                        <dd className="text-ink">
                            {metadata.native_tokens_completion ?? "\u2014"}
                        </dd>

                        <dt className="text-ink-soft">First Token Latency</dt>
                        <dd className="text-ink">
                            {metadata.latency
                                ? `${metadata.latency.toFixed(0)}ms`
                                : "\u2014"}
                        </dd>

                        <dt className="text-ink-soft">Generation Time</dt>
                        <dd className="text-ink">
                            {metadata.generation_time
                                ? `${metadata.generation_time.toFixed(0)}ms`
                                : "\u2014"}
                        </dd>

                        <dt className="text-ink-soft">Finish Reason</dt>
                        <dd className="text-ink">
                            {metadata.finish_reason ?? "\u2014"}
                        </dd>
                    </dl>
                    <p className="text-ink-soft mt-3 text-[10px]">
                        Fetched live from{" "}
                        <a
                            href={`/api/generation?token=${encodeURIComponent(token)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-ink underline"
                        >
                            OpenRouter Generation API
                        </a>
                    </p>
                </div>
            )}
        </div>
    );
};
