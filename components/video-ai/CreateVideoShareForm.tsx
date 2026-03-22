import { Loader2 } from "lucide-react";

import { TASK_MODEL_OPTIONS } from "@/config/ai-models";

export const CreateVideoShareForm = ({
    prompt,
    onPromptChange,
    model,
    onModelChange,
    expiresInHours,
    onExpiresInHoursChange,
    creating,
    onSubmit,
}: {
    prompt: string;
    onPromptChange: (value: string) => void;
    model: string;
    onModelChange: (value: string) => void;
    expiresInHours: number | null;
    onExpiresInHoursChange: (value: number | null) => void;
    creating: boolean;
    onSubmit: () => void;
}) => (
    <div className="poster-card mb-8 space-y-4 rounded-sm p-5">
        <div>
            <label
                htmlFor="video-prompt"
                className="text-ink-soft block text-xs font-medium"
            >
                Prompt
            </label>
            <textarea
                id="video-prompt"
                value={prompt}
                onChange={(e) => onPromptChange(e.target.value)}
                placeholder="e.g. A golden retriever running through a sunflower field at sunset"
                rows={4}
                className="border-border bg-surface placeholder:text-ink-soft focus:border-clay mt-1 w-full resize-none rounded-lg border px-3 py-2 text-sm transition-colors outline-none"
            />
        </div>

        <div>
            <label
                htmlFor="video-model"
                className="text-ink-soft block text-xs font-medium"
            >
                Model
            </label>
            <select
                id="video-model"
                value={model}
                onChange={(e) => onModelChange(e.target.value)}
                className="border-border bg-surface focus:border-clay mt-1 w-full rounded-lg border px-3 py-2 text-sm transition-colors outline-none"
            >
                {TASK_MODEL_OPTIONS.map((m) => (
                    <option key={m} value={m}>
                        {m}
                    </option>
                ))}
            </select>
        </div>

        <div>
            <label
                htmlFor="video-expires"
                className="text-ink-soft block text-xs font-medium"
            >
                Link expires in
            </label>
            <select
                id="video-expires"
                value={expiresInHours === null ? "never" : String(expiresInHours)}
                onChange={(e) => {
                    const v = e.target.value;
                    onExpiresInHoursChange(
                        v === "never" ? null : Number(v)
                    );
                }}
                className="border-border bg-surface focus:border-clay mt-1 w-full rounded-lg border px-3 py-2 text-sm transition-colors outline-none"
            >
                <option value="never">Never expire</option>
                <option value={1}>1 hour</option>
                <option value={6}>6 hours</option>
                <option value={24}>24 hours</option>
                <option value={72}>3 days</option>
                <option value={168}>7 days</option>
            </select>
        </div>

        <button
            type="button"
            onClick={onSubmit}
            disabled={creating || !prompt.trim()}
            className="btn-dream btn-dream-primary w-full cursor-pointer text-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
            {creating ? (
                <>
                    <Loader2
                        className="h-4 w-4 shrink-0 animate-spin"
                        aria-hidden
                    />
                    Generating...
                </>
            ) : (
                "Generate"
            )}
        </button>
    </div>
);
