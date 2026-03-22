"use client";

import { useState, useTransition } from "react";

import { createStudioTask } from "@/app/studio/actions";

import { TASK_MODEL_OPTIONS } from "@/config/ai-models";

export const StudioTaskForm = () => {
    const [isPending, startTransition] = useTransition();
    const [showForm, setShowForm] = useState(false);
    const [title, setTitle] = useState("");
    const [model, setModel] = useState("");
    const [err, setErr] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErr("");
        startTransition(async () => {
            const result = await createStudioTask(title, model);
            if (result.error) {
                setErr(result.error);
            } else {
                setTitle("");
                setModel("");
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
                    New task
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
                    <label className="text-ink-soft mb-1 block text-sm font-medium">
                        Brief
                    </label>
                    <input
                        placeholder="Make a short video..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="border-border bg-surface text-ink placeholder:text-ink-soft focus:border-clay mb-4 w-full rounded-lg border px-4 py-2.5 outline-none"
                        required
                    />
                    <label className="text-ink-soft mb-1 block text-sm font-medium">
                        Models
                    </label>
                    <select
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        className="border-border bg-surface text-ink focus:border-clay mb-4 w-full rounded-lg border px-4 py-2.5 outline-none"
                        required
                    >
                        <option value="">Select a model…</option>
                        {TASK_MODEL_OPTIONS.map((m) => (
                            <option key={m} value={m}>
                                {m}
                            </option>
                        ))}
                    </select>
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
                                setModel("");
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
