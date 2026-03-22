"use client";

import { useState, useTransition } from "react";

import { useRouter } from "next/navigation";

import { acceptBid } from "@/app/marketplace/actions";

export const AcceptBidButton = ({ bidId }: { bidId: string }) => {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [err, setErr] = useState("");

    const handleClick = () => {
        setErr("");
        startTransition(async () => {
            const res = await acceptBid(bidId);
            if (res.error) {
                setErr(res.error);
            } else {
                router.refresh();
            }
        });
    };

    return (
        <div className="border-border border-t px-4 pt-4 pb-4 sm:px-5 sm:pt-5 sm:pb-5">
            {err && (
                <div className="mb-3 text-xs text-red-400" role="alert">
                    {err}
                </div>
            )}
            <button
                type="button"
                onClick={handleClick}
                disabled={isPending}
                className="btn-dream btn-dream-primary rounded-lg px-4 py-2 text-sm disabled:opacity-50"
            >
                {isPending ? "Accepting…" : "Accept bid"}
            </button>
        </div>
    );
};
