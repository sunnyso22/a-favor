import { VideoShareCard } from "@/components/video-ai/VideoShareCard";
import type { VideoShare } from "@/components/video-ai/types";

export const VideoShareList = ({
    shares,
    onRevoke,
}: {
    shares: VideoShare[];
    onRevoke: (id: string) => void;
}) => (
    <div>
        <h2 className="section-title mb-3 text-base">Your shared videos</h2>

        {shares.length === 0 ? (
            <p className="text-ink-soft py-8 text-center text-sm">
                No shares yet.
            </p>
        ) : (
            <div className="space-y-3">
                {shares.map((share) => (
                    <VideoShareCard
                        key={share.id}
                        share={share}
                        onRevoke={onRevoke}
                    />
                ))}
            </div>
        )}
    </div>
);
