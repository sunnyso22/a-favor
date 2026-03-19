type ErrorBannerProps = {
    error: string;
    onDismiss: () => void;
};

export const ErrorBanner = ({ error, onDismiss }: ErrorBannerProps) => (
    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error}
        <button onClick={onDismiss} className="ml-2 font-medium underline">
            dismiss
        </button>
    </div>
);
