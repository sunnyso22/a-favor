/**
 * Editorial divider: quiet rule with a small colored accent (Trexe style).
 */
export const DecoBandTop = () => {
    return (
        <div className="w-full overflow-hidden py-2" aria-hidden="true">
            <svg
                viewBox="0 0 1200 16"
                fill="none"
                className="text-stone/50 h-4 w-full"
            >
                <path
                    d="M0 8 L1200 8"
                    stroke="currentColor"
                    strokeWidth="1"
                    fill="none"
                />
                <rect x="180" y="4" width="7" height="7" fill="#e782a9" />
            </svg>
        </div>
    );
};

export const DecoBandBottom = () => {
    return (
        <div
            className="w-full overflow-hidden py-2"
            aria-hidden="true"
            style={{ transform: "rotate(180deg)" }}
        >
            <svg
                viewBox="0 0 1200 16"
                fill="none"
                className="text-stone/50 h-4 w-full"
            >
                <path
                    d="M0 8 L1200 8"
                    stroke="currentColor"
                    strokeWidth="1"
                    fill="none"
                />
                <rect x="980" y="4" width="7" height="7" fill="#f2c84b" />
            </svg>
        </div>
    );
};
