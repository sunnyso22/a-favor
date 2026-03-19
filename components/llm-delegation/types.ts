export type Delegation = {
    id: string;
    token: string;
    expiresAt: string;
    prompt: string | null;
    response: string | null;
    generationId: string | null;
    createdAt: string;
};

export type GenerationData = {
    id: string;
    model: string;
    total_cost: number;
    created_at: string;
    provider_name: string | null;
    native_tokens_prompt: number | null;
    native_tokens_completion: number | null;
    latency: number | null;
    generation_time: number | null;
    finish_reason: string | null;
    streamed: boolean | null;
    cancelled: boolean | null;
};
