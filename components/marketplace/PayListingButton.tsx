"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { confirmListingPayment } from "@/app/marketplace/actions";

type PayListingButtonProps = {
    listingId: string;
    price: string;
    priceUnit: string;
};

export const PayListingButton = ({
    listingId,
    price,
    priceUnit,
}: PayListingButtonProps) => {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [err, setErr] = useState("");

    const handleClick = () => {
        setErr("");
        startTransition(async () => {
            const res = await confirmListingPayment(listingId);
            if (res.error) {
                setErr(res.error);
            } else {
                router.refresh();
            }
        });
    };

    return (
        <div className="mt-4">
            {err && (
                <div className="mb-2 text-xs text-red-400" role="alert">
                    {err}
                </div>
            )}
            <button
                type="button"
                onClick={handleClick}
                disabled={isPending}
                className="btn-dream btn-dream-primary rounded-lg px-4 py-2.5 text-sm disabled:opacity-50"
            >
                {isPending
                    ? "Confirming…"
                    : `Pay ${price} ${priceUnit} (placeholder)`}
            </button>
            <p className="text-ink-muted mt-2 text-xs leading-relaxed">
                On-chain payment is not wired yet; this only marks the listing
                as paid in Trexe.
            </p>
        </div>
    );
};
