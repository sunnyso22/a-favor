export const TASK_MODEL_OPTIONS = [
    "Seedance-1.0-Pro",
    "Sora-2-Pro",
    "Veo-3.1",
] as const;

export type TaskModelId = (typeof TASK_MODEL_OPTIONS)[number];

const allowedTask = new Set<string>(TASK_MODEL_OPTIONS);

export const isAllowedTaskModel = (value: string): value is TaskModelId =>
    allowedTask.has(value);

export const LLM_MODEL_OPTIONS = [
    "nvidia/nemotron-3-super-120b-a12b:free",
    "z-ai/glm-4.5-air:free",
    "qwen/qwen3-coder:free",
    "x-ai/grok-4.1-fast",
    "openai/gpt-5.4",
] as const;

export type LlmModelId = (typeof LLM_MODEL_OPTIONS)[number];

const allowedLlm = new Set<string>(LLM_MODEL_OPTIONS);

export const isAllowedLlmModel = (value: string): value is LlmModelId =>
    allowedLlm.has(value);
