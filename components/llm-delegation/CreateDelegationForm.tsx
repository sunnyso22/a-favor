export const CreateDelegationForm = ({
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
    <div className="mb-8 rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-medium text-gray-900">Ask the LLM</h2>

        <div className="mt-4 space-y-3">
            <div>
                <label
                    htmlFor="prompt"
                    className="block text-xs font-medium text-gray-500"
                >
                    Your prompt
                </label>
                <textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => onPromptChange(e.target.value)}
                    placeholder="e.g. Explain how photosynthesis works..."
                    rows={4}
                    className="mt-1 w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm transition-colors outline-none focus:border-gray-400"
                />
            </div>

            <div>
                <label
                    htmlFor="expires"
                    className="block text-xs font-medium text-gray-500"
                >
                    Link expires in
                </label>
                <select
                    id="expires"
                    value={expiresInHours}
                    onChange={(e) =>
                        onExpiresInHoursChange(Number(e.target.value))
                    }
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm transition-colors outline-none focus:border-gray-400"
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
                className="w-full cursor-pointer rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-gray-800 focus:ring-2 focus:ring-gray-500/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
                {creating
                    ? "Generating response..."
                    : "Generate & create shareable link"}
            </button>
        </div>
    </div>
);
