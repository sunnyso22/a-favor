"use client";

import { useRouter } from "next/navigation";

export const StudioSolutionForm = ({
    studioTaskId,
    studioTaskTitle,
}: {
    studioTaskId: string;
    studioTaskTitle: string;
}) => {
    const router = useRouter();

    const handleCompleteWithAi = () => {
        const prompt = `Studio task: ${studioTaskTitle}`;
        const params = new URLSearchParams({
            prompt,
            studioTaskId,
        });
        router.push(`/video-ai?${params.toString()}`);
    };

    return (
        <div className="poster-card mt-6 rounded-2xl p-6">
            <button
                type="button"
                onClick={handleCompleteWithAi}
                className="btn-dream btn-dream-primary rounded-lg px-4 py-2 text-sm"
            >
                Complete with AI
            </button>
        </div>
    );
};
