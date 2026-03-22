import { Clock } from "lucide-react";

import { notFound } from "next/navigation";

import { getVideoShareByToken } from "@/app/video-ai/actions";

import { VideoMetadataBlock } from "@/components/video-ai/VideoMetadataBlock";

import { shortenDisplayName } from "@/lib/helper";
import { parseChatCompletionContent } from "@/lib/poe-video-share";

const VideoAiSharePage = async ({
    params,
}: {
    params: Promise<{ token: string }>;
}) => {
    const { token } = await params;

    const record = await getVideoShareByToken(token);

    if (!record) notFound();

    const expired =
        record.expiresAt != null && new Date() > record.expiresAt;

    if (expired) {
        return (
            <div className="mx-auto max-w-xl px-4 py-16">
                <div className="flex flex-col items-center gap-4 py-24 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
                        <Clock className="h-6 w-6 text-red-500" />
                    </div>
                    <h1 className="section-title text-xl">Link expired</h1>
                    <p className="text-ink-muted text-sm">
                        This shared video link is no longer available.
                    </p>
                </div>
            </div>
        );
    }

    const assistantContent = parseChatCompletionContent(record.metadataJson);

    return (
        <div className="mx-auto max-w-xl px-4 py-16">
            <div className="mb-8">
                <h1 className="section-title text-2xl">Video</h1>
                <p className="text-ink-muted mt-1 text-sm">
                    Shared by{" "}
                    <span className="text-ink font-medium">
                        {shortenDisplayName(record.userName!).text}
                    </span>
                </p>
                <p className="text-ink-soft mt-0.5 text-xs">
                    {record.expiresAt == null
                        ? "Does not expire"
                        : `Available until ${record.expiresAt.toLocaleString("en-GB", {
                              dateStyle: "medium",
                              timeStyle: "short",
                          })}`}
                </p>
            </div>

            {record.prompt && (
                <div className="poster-card mb-6 rounded-sm p-5">
                    <h2 className="text-ink-soft mb-2 text-xs font-medium tracking-wide uppercase">
                        Prompt
                    </h2>
                    <p className="text-ink text-sm whitespace-pre-wrap">
                        {record.prompt}
                    </p>
                    <p className="text-ink-muted mt-2 text-xs">
                        Model: {record.model}
                    </p>
                </div>
            )}

            {record.errorMessage && (
                <div className="mb-6 rounded-sm border border-red-200 bg-red-50/50 p-4 text-sm text-red-800">
                    {record.errorMessage}
                </div>
            )}

            <div className="poster-card mb-6 overflow-hidden rounded-sm p-0">
                <h2 className="text-ink-soft border-border border-b px-5 py-3 text-xs font-medium tracking-wide uppercase">
                    Video
                </h2>
                <video
                    className="bg-bg w-full"
                    controls
                    playsInline
                    preload="metadata"
                    src={assistantContent ?? undefined}
                >
                    Your browser does not support video playback.
                </video>
                <div className="border-border flex flex-wrap gap-2 border-t px-5 py-3">
                    <a
                        href={assistantContent ?? undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-dream inline-flex cursor-pointer items-center justify-center px-3 py-1.5 text-xs no-underline"
                    >
                        Download MP4
                    </a>
                </div>
            </div>

            <div className="poster-card bg-bg rounded-sm p-5">
                <VideoMetadataBlock
                    metadataJson={record.metadataJson}
                    title="Poe API response (JSON)"
                    defaultOpen
                />
            </div>
        </div>
    );
};

export default VideoAiSharePage;
