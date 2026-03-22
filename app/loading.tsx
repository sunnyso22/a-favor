import { Logo } from "@/components/layout/Logo";

const Loading = () => {
    return (
        <div
            className="mx-auto flex min-h-[60vh] max-w-5xl flex-col items-center justify-center gap-8 px-6 py-24"
            role="status"
            aria-live="polite"
            aria-busy="true"
        >
            <div className="border-border border-t-clay h-9 w-9 animate-spin rounded-full border-2" />
            <p className="text-ink-muted text-sm">Loading…</p>
        </div>
    );
};

export default Loading;
