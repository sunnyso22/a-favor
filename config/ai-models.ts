export const TASK_MODEL_OPTIONS = [
    "Seedance-1.0-Pro",
    "Sora-2-Pro",
    "Veo-3.1",
] as const;

export type TaskModelId = (typeof TASK_MODEL_OPTIONS)[number];

const allowed = new Set<string>(TASK_MODEL_OPTIONS);

export const isAllowedTaskModel = (value: string): value is TaskModelId =>
    allowed.has(value);
