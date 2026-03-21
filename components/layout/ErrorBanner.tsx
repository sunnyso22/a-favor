export const ErrorBanner = ({
    error,
    onDismiss,
}: {
    error: string;
    onDismiss: () => void;
}) => (
    <div className="mb-6 rounded-sm border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error}
        <button onClick={onDismiss} className="ml-2 font-medium underline">
            dismiss
        </button>
    </div>
);
