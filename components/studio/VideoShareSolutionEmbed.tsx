"use client";

import { useTransition } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { revokeVideoShare } from "@/app/video-ai/actions";

const isExpired = (expiresAt: Date) => new Date() > expiresAt;

/** Serialized `video_share` row for RSC → client embed. */
export type VideoShareEmbedRow = {
    id: string;
    token: string;
    userId: string;
    expiresAt: Date;
    prompt: string | null;
    model: string;
    status: string;
    metadataJson: string | null;
    errorMessage: string | null;
    createdAt: Date;
};

export const VideoShareSolutionEmbed = ({
    videoShare,
    currentUserId,
}: {
    videoShare: VideoShareEmbedRow;
    currentUserId: string | null | undefined;
}) => {
    const router = useRouter();
    const [, startTransition] = useTransition();

    const handleRevoke = () => {
        startTransition(async () => {
            const result = await revokeVideoShare(videoShare.id);
            if (!result?.error) router.refresh();
        });
    };

    const canRevoke = !!currentUserId && currentUserId === videoShare.userId;
    const expired = isExpired(new Date(videoShare.expiresAt));
    const mp4Url =
        JSON.parse(videoShare.metadataJson ?? "{}").choices?.[0]?.message
            .content ?? undefined;

    return (
        <div className={`w-full space-y-3 ${expired ? "opacity-60" : ""}`}>
            {videoShare.prompt && (
                <p className="text-ink line-clamp-3 text-sm">
                    {videoShare.prompt}
                </p>
            )}
            <p className="text-ink-muted text-xs">Model: {videoShare.model}</p>

            <p className="text-ink-soft text-xs">
                {expired ? "Expired" : "Expires"}{" "}
                {new Date(videoShare.expiresAt).toLocaleString("en-GB", {
                    dateStyle: "medium",
                    timeStyle: "short",
                })}
            </p>

            {videoShare.errorMessage && (
                <p className="text-xs text-red-600">
                    {videoShare.errorMessage}
                </p>
            )}

            <div className="flex flex-wrap gap-2">
                {!expired && (
                    <Link
                        href={`/video-ai/${videoShare.token}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-dream inline-flex cursor-pointer items-center justify-center px-3 py-1.5 text-xs no-underline"
                    >
                        Open share page
                    </Link>
                )}

                {!expired && mp4Url && (
                    <a
                        href={mp4Url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-dream inline-flex cursor-pointer items-center justify-center px-3 py-1.5 text-xs no-underline"
                    >
                        Download MP4
                    </a>
                )}

                {canRevoke && (
                    <button
                        type="button"
                        onClick={handleRevoke}
                        className="cursor-pointer rounded-sm border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                    >
                        Delete
                    </button>
                )}
            </div>
        </div>
    );
};
