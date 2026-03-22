"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { submitFinalDelivery } from "@/app/marketplace/actions";

export const FinalDeliveryForm = ({
    listingId,
    initialBody,
}: {
    listingId: string;
    initialBody: string;
}) => {
    const router = useRouter();
    const [body, setBody] = useState(initialBody);
    const [isPending, startTransition] = useTransition();
    const [err, setErr] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErr("");
        startTransition(async () => {
            const res = await submitFinalDelivery(listingId, body);
            if (res.error) {
                setErr(res.error);
            } else {
                router.refresh();
            }
        });
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {err && (
                <div className="text-sm text-red-400" role="alert">
                    {err}
                </div>
            )}
            <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Describe or link the final deliverable (text, URLs, attachments you have hosted elsewhere)…"
                rows={8}
                disabled={isPending}
                required
                className="border-border bg-surface text-ink placeholder:text-ink-soft focus:border-clay w-full resize-y rounded-lg border px-4 py-3 text-sm outline-none disabled:opacity-50"
            />
            <button
                type="submit"
                disabled={isPending || !body.trim()}
                className="btn-dream btn-dream-primary w-fit rounded-lg px-4 py-2 text-sm disabled:opacity-50"
            >
                {isPending
                    ? "Saving…"
                    : initialBody
                      ? "Update final delivery"
                      : "Submit final delivery"}
            </button>
        </form>
    );
};
