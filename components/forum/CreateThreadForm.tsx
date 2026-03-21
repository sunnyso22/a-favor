"use client";

import { useState, useTransition } from "react";

import { createThread } from "@/app/forum/actions";

export const CreateThreadForm = () => {
    const [isPending, startTransition] = useTransition();
    const [showForm, setShowForm] = useState(false);
    const [title, setTitle] = useState("");
    const [err, setErr] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErr("");
        startTransition(async () => {
            const result = await createThread(title);
            if (result.error) {
                setErr(result.error);
            } else {
                setTitle("");
                setShowForm(false);
            }
        });
    };

    return (
        <div className={showForm ? "w-full" : "flex w-full justify-end"}>
            {!showForm && (
                <button
                    type="button"
                    onClick={() => setShowForm(true)}
                    className="btn-dream btn-dream-primary rounded px-4 py-2 text-sm"
                >
                    New thread
                </button>
            )}

            {showForm && (
                <form
                    onSubmit={handleSubmit}
                    className="poster-card mt-6 w-full rounded-2xl p-6 lg:mt-0"
                >
                    {err && (
                        <div className="mb-4 text-sm text-red-400">{err}</div>
                    )}
                    <input
                        placeholder="What is the top 3 Hong Kong movies of all time?"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="border-border bg-surface text-ink placeholder:text-ink-soft focus:border-clay mb-4 w-full rounded-lg border px-4 py-2.5 outline-none"
                        required
                    />
                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            type="submit"
                            disabled={isPending}
                            className="btn-dream btn-dream-primary rounded px-4 py-2 text-sm disabled:opacity-50"
                        >
                            {isPending ? "Posting..." : "Post"}
                        </button>
                        <button
                            type="button"
                            disabled={isPending}
                            onClick={() => {
                                setShowForm(false);
                                setErr("");
                                setTitle("");
                            }}
                            className="text-ink-muted hover:text-ink rounded px-4 py-2 text-sm transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};
