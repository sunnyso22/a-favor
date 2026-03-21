"use client";

import { useRouter } from "next/navigation";

export const ReplyForm = ({
    forumThreadId,
    threadTitle,
}: {
    forumThreadId: string;
    threadTitle: string;
}) => {
    const router = useRouter();

    const handleAskLlm = () => {
        const prompt = `${threadTitle}`;
        const params = new URLSearchParams({ prompt, forumThreadId });
        router.push(`/llm?${params.toString()}`);
    };

    return (
        <div className="poster-card mt-6 rounded-2xl p-6">
            <button
                type="button"
                onClick={handleAskLlm}
                className="btn-dream btn-dream-primary border-clay/30 text-clay hover:bg-clay/5 rounded-lg border px-4 py-2 text-sm transition-colors"
            >
                Ask LLM to help
            </button>
        </div>
    );
};
