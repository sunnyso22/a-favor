"use client";

import { useState, useTransition } from "react";

import { reviewReply } from "@/app/forum/actions";

export const ReviewReplyForm = ({ forumReplyId }: { forumReplyId: string }) => {
    const [isPending, startTransition] = useTransition();
    const [open, setOpen] = useState(false);
    const [score, setScore] = useState(5);
    const [reviewText, setReviewText] = useState("");
    const [err, setErr] = useState("");

    const handleSubmit = () => {
        setErr("");
        startTransition(async () => {
            const result = await reviewReply(forumReplyId, score, reviewText);
            if (result.error) {
                setErr(result.error);
            } else {
                setOpen(false);
            }
        });
    };

    if (!open) {
        return (
            <button
                onClick={() => setOpen(true)}
                className="text-clay text-sm hover:underline"
            >
                Review &amp; score
            </button>
        );
    }

    return (
        <div className="space-y-2">
            {err && <div className="text-sm text-red-400">{err}</div>}
            <div className="flex flex-wrap items-center gap-2">
                <input
                    type="number"
                    min="1"
                    max="5"
                    value={score}
                    onChange={(e) => setScore(Number(e.target.value))}
                    className="border-border bg-surface text-ink w-16 rounded border px-2 py-1"
                />
                <input
                    placeholder="Review (optional)"
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    className="border-border bg-surface text-ink placeholder:text-ink-soft flex-1 rounded border px-3 py-1 text-sm"
                />
                <button
                    onClick={handleSubmit}
                    disabled={isPending}
                    className="btn-dream btn-dream-primary rounded px-3 py-1 text-sm disabled:opacity-50"
                >
                    {isPending ? "..." : "Submit"}
                </button>
                <button
                    onClick={() => setOpen(false)}
                    className="text-ink-muted text-sm"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};
