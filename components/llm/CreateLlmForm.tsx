export const CreateLlmForm = ({
    prompt,
    onPromptChange,
    expiresInHours,
    onExpiresInHoursChange,
    creating,
    onSubmit,
}: {
    prompt: string;
    onPromptChange: (value: string) => void;
    expiresInHours: number;
    onExpiresInHoursChange: (value: number) => void;
    creating: boolean;
    onSubmit: () => void;
}) => (
    <div className="poster-card mb-8 rounded-sm p-5">
        <h2 className="section-title text-base">Ask the LLM</h2>

        <div className="mt-4 space-y-3">
            <div>
                <label
                    htmlFor="prompt"
                    className="text-ink-soft block text-xs font-medium"
                >
                    Your prompt
                </label>
                <textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => onPromptChange(e.target.value)}
                    placeholder="e.g. Explain how photosynthesis works..."
                    rows={4}
                    className="border-border bg-surface placeholder:text-ink-soft focus:border-clay mt-1 w-full resize-none rounded-lg border px-3 py-2 text-sm transition-colors outline-none"
                />
            </div>

            <div>
                <label
                    htmlFor="expires"
                    className="text-ink-soft block text-xs font-medium"
                >
                    Link expires in
                </label>
                <select
                    id="expires"
                    value={expiresInHours}
                    onChange={(e) =>
                        onExpiresInHoursChange(Number(e.target.value))
                    }
                    className="border-border bg-surface focus:border-clay mt-1 w-full rounded-lg border px-3 py-2 text-sm transition-colors outline-none"
                >
                    <option value={1}>1 hour</option>
                    <option value={6}>6 hours</option>
                    <option value={24}>24 hours</option>
                    <option value={72}>3 days</option>
                    <option value={168}>7 days</option>
                    <option value={720}>30 days</option>
                </select>
            </div>

            <button
                onClick={onSubmit}
                disabled={creating || !prompt.trim()}
                className="btn-dream btn-dream-primary w-full cursor-pointer text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
                {creating
                    ? "Generating response..."
                    : "Generate & create shareable link"}
            </button>
        </div>
    </div>
);
