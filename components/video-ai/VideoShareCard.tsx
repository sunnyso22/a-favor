"use client";

import Link from "next/link";

import { VideoMetadataBlock } from "@/components/video-ai/VideoMetadataBlock";
import type { VideoShare } from "@/components/video-ai/types";

import { isPoeVideoJobMetadata } from "@/lib/poe-video-share";

const isExpired = (expiresAt: Date): boolean =>
    new Date() > new Date(expiresAt);

const statusLabel = (status: string) => {
    if (status === "queued" || status === "in_progress") return "Rendering";
    if (status === "completed") return "Ready";
    if (status === "failed") return "Failed";
    return status;
};

export const VideoShareCard = ({
    share,
    onRevoke,
}: {
    share: VideoShare;
    onRevoke: (id: string) => void;
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
                    <p className="text-ink-muted mt-1 text-xs">{share.model}</p>
                </div>
                <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${
                        expired
                            ? "border-border text-ink-soft"
                            : share.status === "failed"
                              ? "border-red-300 text-red-600"
                              : share.status === "completed"
                                ? "border-clay/30 text-clay"
                                : "border-amber-300 text-amber-800"
                    }`}
                >
                    {expired ? "Expired" : statusLabel(share.status)}
                </span>
            </div>

            {share.errorMessage && (
                <p className="mt-2 text-xs text-red-600">
                    {share.errorMessage}
                </p>
            )}

            <p className="text-ink-soft mt-2 text-xs">
                Expires{" "}
                {share.expiresAt.toLocaleString("en-GB", {
                    dateStyle: "medium",
                    timeStyle: "short",
                })}
            </p>

            <VideoMetadataBlock metadataJson={share.metadataJson} />

            <div className="mt-3 flex flex-wrap gap-2">
                {!expired && (
                    <Link
                        href={`/video-ai/${share.token}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-dream inline-flex cursor-pointer items-center justify-center px-3 py-1.5 text-xs no-underline"
                    >
                        Open share page
                    </Link>
                )}
                {!expired &&
                    share.status === "completed" &&
                    isPoeVideoJobMetadata(share.metadataJson) && (
                        <a
                            href={`/api/video-ai/content/${share.token}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="border-border text-ink hover:bg-bg cursor-pointer rounded-sm border px-3 py-1.5 text-xs font-medium transition-colors"
                        >
                            Raw MP4
                        </a>
                    )}
                <button
                    type="button"
                    onClick={() => onRevoke(share.id)}
                    className="cursor-pointer rounded-sm border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                >
                    Delete
                </button>
            </div>
        </div>
    );
};
