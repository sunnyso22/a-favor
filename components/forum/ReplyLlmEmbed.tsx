"use client";

import { useTransition } from "react";

import { useRouter } from "next/navigation";

import { revokeLlm } from "@/app/llm/actions";

import { LlmCard } from "@/components/llm/LlmCard";
import type { LlmShare } from "@/components/llm/types";

/** Serialized LLM row from RSC (dates as ISO strings). */
export type ReplyLlmEmbedRow = {
    id: string;
    token: string;
    userId: string;
    expiresAt: string;
    prompt: string | null;
    response: string | null;
    generationId: string | null;
    forumThreadId: string | null;
    createdAt: string;
};

const toLlmShare = (row: ReplyLlmEmbedRow): LlmShare => ({
    id: row.id,
    token: row.token,
    expiresAt: new Date(row.expiresAt),
    prompt: row.prompt,
    response: row.response,
    generationId: row.generationId,
    forumThreadId: row.forumThreadId,
    createdAt: new Date(row.createdAt),
});

/** Same LLM card UI as the /llm dashboard, embedded in a forum reply. */
export const ReplyLlmEmbed = ({
    row,
    currentUserId,
}: {
    row: ReplyLlmEmbedRow;
    currentUserId: string | null | undefined;
}) => {
    const router = useRouter();
    const [, startTransition] = useTransition();

    const handleRevoke = (llmId: string) => {
        startTransition(async () => {
            const result = await revokeLlm(llmId);
            if (!result?.error) router.refresh();
        });
    };

    return (
        <LlmCard
            share={toLlmShare(row)}
            onRevoke={handleRevoke}
            showRevoke={!!currentUserId && currentUserId === row.userId}
        />
    );
};
