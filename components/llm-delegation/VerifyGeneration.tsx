"use client";

import { fetchGenerationMetadata } from "@/app/llm-delegation/actions";

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
                    <svg
                        className="h-3.5 w-3.5 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                    </svg>
                ) : (
                    <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
                        />
                    </svg>
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
                            href="https://openrouter.ai/docs/api/api-reference/generations/get-generation"
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
