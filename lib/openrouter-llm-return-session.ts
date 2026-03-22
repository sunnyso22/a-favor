const STORAGE_KEY = "openrouter_llm_return";

export type OpenRouterLlmReturn = {
    prompt?: string;
    forumThreadId?: string;
};

export const saveOpenRouterLlmReturn = (payload: OpenRouterLlmReturn) => {
    const trimmed: OpenRouterLlmReturn = {};
    if (payload.prompt) trimmed.prompt = payload.prompt;
    if (payload.forumThreadId) trimmed.forumThreadId = payload.forumThreadId;
    if (Object.keys(trimmed).length === 0) {
        sessionStorage.removeItem(STORAGE_KEY);
        return;
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
};

export const consumeOpenRouterLlmReturn = (): OpenRouterLlmReturn => {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    if (!raw) return {};
    try {
        const parsed = JSON.parse(raw) as OpenRouterLlmReturn;
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
        return {};
    }
};
