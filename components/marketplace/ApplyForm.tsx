"use client";

import { useState, useTransition } from "react";

import { applyForListing } from "@/app/marketplace/actions";

export const ApplyForm = ({
    listingId,
    className,
}: {
    listingId: string;
    className?: string;
}) => {
    const [isPending, startTransition] = useTransition();
    const [approach, setApproach] = useState("");
    const [resources, setResources] = useState("");
    const [timeline, setTimeline] = useState("");
    const [proposedPrice, setProposedPrice] = useState("");
    const [err, setErr] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErr("");
        startTransition(async () => {
            const res = await applyForListing(
                listingId,
                approach,
                resources,
                timeline,
                proposedPrice
            );
            if (res.error) {
                setErr(res.error);
            } else {
                setApproach("");
                setResources("");
                setTimeline("");
                setProposedPrice("");
            }
        });
    };

    return (
        <form
            onSubmit={handleSubmit}
            className={className ?? "poster-card mt-6 rounded-2xl p-6"}
        >
            {err && <div className="mb-4 text-sm text-red-400">{err}</div>}
            <textarea
                placeholder="Your approach..."
                value={approach}
                onChange={(e) => setApproach(e.target.value)}
                rows={4}
                className="border-border bg-surface text-ink placeholder:text-ink-soft focus:border-clay mb-3 w-full resize-none rounded-lg border px-4 py-2.5 outline-none"
                required
            />
            <input
                placeholder="Resources / links (optional)"
                value={resources}
                onChange={(e) => setResources(e.target.value)}
                className="border-border bg-surface text-ink placeholder:text-ink-soft focus:border-clay mb-3 w-full rounded-lg border px-4 py-2.5 outline-none"
            />
            <input
                placeholder="Timeline"
                value={timeline}
                onChange={(e) => setTimeline(e.target.value)}
                className="border-border bg-surface text-ink placeholder:text-ink-soft focus:border-clay mb-3 w-full rounded-lg border px-4 py-2.5 outline-none"
                required
            />
            <input
                placeholder="Proposed price"
                value={proposedPrice}
                onChange={(e) => setProposedPrice(e.target.value)}
                className="border-border bg-surface text-ink placeholder:text-ink-soft focus:border-clay mb-4 w-full rounded-lg border px-4 py-2.5 outline-none"
                required
            />
            <button
                type="submit"
                disabled={isPending}
                className="btn-dream btn-dream-primary rounded-lg px-4 py-2 text-sm disabled:opacity-50"
            >
                {isPending ? "Applying..." : "Apply"}
            </button>
        </form>
    );
};
