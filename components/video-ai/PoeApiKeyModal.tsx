"use client";

import { KeyRound, X } from "lucide-react";

import { useEffect, useId, useRef, useState, useTransition } from "react";

import { useRouter } from "next/navigation";

import { savePoeApiKey } from "@/app/video-ai/actions";

import { SignInButton } from "@/components/SignInButton";
import { ErrorBanner } from "@/components/layout/ErrorBanner";

export const PoeApiKeyModal = ({
    open,
    onDismiss,
}: {
    open: boolean;
    /** Called when user closes without saving (optional escape hatch). */
    onDismiss?: () => void;
}) => {
    const router = useRouter();
    const titleId = useId();
    const inputRef = useRef<HTMLInputElement>(null);
    const [key, setKey] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        if (!open) return;
        document.body.style.overflow = "hidden";
        const t = requestAnimationFrame(() => inputRef.current?.focus());
        return () => {
            cancelAnimationFrame(t);
            document.body.style.overflow = "";
        };
    }, [open]);

    useEffect(() => {
        if (!open || !onDismiss) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                e.preventDefault();
                onDismiss();
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open, onDismiss]);

    const handleSubmit = () => {
        setError(null);
        startTransition(async () => {
            const result = await savePoeApiKey(key);
            if (result.error === "Unauthorized") {
                setError("SIGN_IN_REQUIRED");
            } else if (result.error) {
                setError(result.error);
            } else {
                setKey("");
                router.refresh();
            }
        });
    };

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            role="presentation"
        >
            <div
                className="bg-ink/40 absolute inset-0 backdrop-blur-[2px]"
                aria-hidden
                onClick={onDismiss ? () => onDismiss() : undefined}
            />

            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className="poster-card border-border relative z-10 w-full max-w-md rounded-sm border p-6 shadow-lg"
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                        <KeyRound className="text-clay h-5 w-5 shrink-0" />
                        <h2 id={titleId} className="section-title text-xl">
                            Poe API key
                        </h2>
                    </div>
                    {onDismiss ? (
                        <button
                            type="button"
                            onClick={() => onDismiss()}
                            className="text-ink-soft hover:text-ink -mt-1 -mr-1 shrink-0 cursor-pointer rounded-sm p-1 transition-colors"
                            aria-label="Close"
                        >
                            <X className="h-5 w-5 text-black" />
                        </button>
                    ) : null}
                </div>
                <p className="text-ink-muted mt-2 text-sm">
                    Keys are stored for your account and used to call{" "}
                    <code className="text-ink-soft text-xs">api.poe.com</code>.
                    Create one at{" "}
                    <a
                        href="https://poe.com/api/keys"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-clay hover:underline"
                    >
                        poe.com/api/keys
                    </a>
                    .
                </p>

                {error === "SIGN_IN_REQUIRED" ? (
                    <div className="mt-4 space-y-3">
                        <p className="text-ink-muted text-sm">
                            Connect your wallet to save your Poe API key to your
                            account.
                        </p>
                        <SignInButton callbackURL="/video-ai" />
                    </div>
                ) : error ? (
                    <div className="mt-4">
                        <ErrorBanner
                            error={error}
                            onDismiss={() => setError(null)}
                        />
                    </div>
                ) : null}

                <div className="mt-4">
                    <label
                        htmlFor="poe-api-key-modal"
                        className="text-ink-soft text-xs font-medium"
                    >
                        API key
                    </label>
                    <input
                        ref={inputRef}
                        id="poe-api-key-modal"
                        type="password"
                        autoComplete="off"
                        value={key}
                        onChange={(e) => setKey(e.target.value)}
                        placeholder="sk-..."
                        className="border-border bg-surface placeholder:text-ink-soft focus:border-clay mt-1 w-full rounded-lg border px-3 py-2 text-sm transition-colors outline-none"
                    />
                </div>

                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isPending || !key.trim()}
                    className="btn-dream btn-dream-primary mt-4 w-full cursor-pointer text-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {isPending ? "Saving…" : "Save key"}
                </button>
            </div>
        </div>
    );
};
