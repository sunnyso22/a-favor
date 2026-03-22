"use client";

import Link from "next/link";

import type { LlmShare } from "@/components/llm/types";

const isExpired = (expiresAt: Date | null): boolean =>
    expiresAt != null && new Date() > new Date(expiresAt);

export const LlmCard = ({
    share,
    onRevoke,
    showRevoke = true,
    showModelUnderPrompt = true,
}: {
    share: LlmShare;
    onRevoke: (id: string) => void;
    /** When false, remove is hidden (e.g. viewers who do not own the LLM link). */
    showRevoke?: boolean;
    /** When false, omit model under the prompt (e.g. forum shows it on the reply byline). */
    showModelUnderPrompt?: boolean;
}) => {
    const expired = isExpired(share.expiresAt);

    return (
        <div
            className={`poster-card rounded-sm p-4 ${expired ? "opacity-60" : ""}`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <p className="text-ink line-clamp-2 text-sm font-medium">
                        {share.prompt || "Untitled"}
                    </p>
                    {showModelUnderPrompt && share.model?.trim() && (
                        <p className="text-ink-muted mt-1 text-xs">
                            {share.model.trim()}
                        </p>
                    )}
                    {share.response && (
                        <p className="text-ink-muted mt-1 line-clamp-2 text-xs">
                            {share.response}
                        </p>
                    )}
                </div>
                <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${
                        expired
                            ? "border-border text-ink-soft"
                            : "border-clay/30 text-clay"
                    }`}
                >
                    {expired ? "Expired" : "Active"}
                </span>
            </div>

            <p className="text-ink-soft mt-2 text-xs">
                {share.expiresAt == null
                    ? "Never expires"
                    : `Expires ${share.expiresAt.toLocaleString("en-GB", {
                          dateStyle: "medium",
                          timeStyle: "short",
                      })}`}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
                {!expired && (
                    <Link
                        href={`/llm/${share.token}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-dream inline-flex cursor-pointer items-center justify-center px-3 py-1.5 text-xs no-underline"
                    >
                        Open link
                    </Link>
                )}
                {showRevoke && (
                    <button
                        type="button"
                        onClick={() => onRevoke(share.id)}
                        className="cursor-pointer rounded-sm border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                    >
                        Remove
                    </button>
                )}
            </div>
        </div>
    );
};
