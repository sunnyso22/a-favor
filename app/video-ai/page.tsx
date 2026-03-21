import { loadVideoAiDashboard } from "@/app/video-ai/actions";

import { VideoAiDashboard } from "@/components/video-ai/VideoAiDashboard";

const VideoAiPage = async ({
    searchParams,
}: {
    searchParams: Promise<{ prompt?: string; studioTaskId?: string }>;
}) => {
    const { prompt: initialPrompt, studioTaskId: initialStudioTaskId } =
        await searchParams;

    const data = await loadVideoAiDashboard();

    return (
        <VideoAiDashboard
            shares={data.shares}
            poeKeyMissing={data.poeKeyMissing}
            initialPrompt={initialPrompt}
            initialStudioTaskId={initialStudioTaskId}
        />
    );
};

export default VideoAiPage;
