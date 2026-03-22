export type LlmShare = {
    id: string;
    token: string;
    expiresAt: Date | null;
    prompt: string | null;
    response: string | null;
    model: string | null;
    generationId: string | null;
    forumThreadId: string | null;
    createdAt: Date;
};

export type GenerationData = {
    id: string;
    model: string;
    total_cost: number;
    created_at: Date;
    provider_name: string | null;
    native_tokens_prompt: number | null;
    native_tokens_completion: number | null;
    latency: number | null;
    generation_time: number | null;
    finish_reason: string | null;
    streamed: boolean | null;
    cancelled: boolean | null;
};
