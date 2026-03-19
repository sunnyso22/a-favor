"use client";

import { fetchGenerationMetadata } from "@/app/llm-delegation/actions";
import { Loader2, ShieldCheck } from "lucide-react";

import { useState } from "react";

import type { GenerationData } from "./types";

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
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-700 transition-colors hover:bg-purple-100 disabled:opacity-50"
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
                <div className="mt-3 rounded-lg border border-purple-100 bg-purple-50/50 p-4">
                    <h3 className="mb-3 text-xs font-semibold tracking-wide text-purple-800 uppercase">
                        OpenRouter Generation Metadata
                    </h3>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                        <dt className="text-gray-500">Generation ID</dt>
                        <dd className="font-mono break-all text-gray-800">
                            {metadata.id}
                        </dd>

                        <dt className="text-gray-500">Model</dt>
                        <dd className="text-gray-800">{metadata.model}</dd>

                        <dt className="text-gray-500">Provider</dt>
                        <dd className="text-gray-800">
                            {metadata.provider_name ?? "—"}
                        </dd>

                        <dt className="text-gray-500">Created</dt>
                        <dd className="text-gray-800">
                            {new Date(metadata.created_at).toLocaleString()}
                        </dd>

                        <dt className="text-gray-500">Total Cost</dt>
                        <dd className="text-gray-800">
                            ${metadata.total_cost.toFixed(6)}
                        </dd>

                        <dt className="text-gray-500">Prompt Tokens</dt>
                        <dd className="text-gray-800">
                            {metadata.native_tokens_prompt ?? "—"}
                        </dd>

                        <dt className="text-gray-500">Completion Tokens</dt>
                        <dd className="text-gray-800">
                            {metadata.native_tokens_completion ?? "—"}
                        </dd>

                        <dt className="text-gray-500">First Token Latency</dt>
                        <dd className="text-gray-800">
                            {metadata.latency
                                ? `${metadata.latency.toFixed(0)}ms`
                                : "—"}
                        </dd>

                        <dt className="text-gray-500">Generation Time</dt>
                        <dd className="text-gray-800">
                            {metadata.generation_time
                                ? `${metadata.generation_time.toFixed(0)}ms`
                                : "—"}
                        </dd>

                        <dt className="text-gray-500">Finish Reason</dt>
                        <dd className="text-gray-800">
                            {metadata.finish_reason ?? "—"}
                        </dd>
                    </dl>
                    <p className="mt-3 text-[10px] text-gray-400">
                        Fetched live from{" "}
                        <a
                            href={`/api/generation?token=${encodeURIComponent(token)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline hover:text-gray-600"
                        >
                            OpenRouter Generation API
                        </a>
                    </p>
                </div>
            )}
        </div>
    );
};
