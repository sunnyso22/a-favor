"use client";

import { useState, useTransition } from "react";

import { useRouter } from "next/navigation";

import {
    sendMarketplaceChatMessage,
    type MarketplaceChatMessageRow,
} from "@/app/marketplace/actions";

import { shortenDisplayName } from "@/lib/helper";

export const MarketplaceChat = ({
    listingId,
    initialMessages,
    currentUserId,
}: {
    listingId: string;
    initialMessages: MarketplaceChatMessageRow[];
    currentUserId: string;
}) => {
    const router = useRouter();
    const [text, setText] = useState("");
    const [isPending, startTransition] = useTransition();
    const [err, setErr] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErr("");
        const trimmed = text.trim();
        if (!trimmed) return;
        startTransition(async () => {
            const res = await sendMarketplaceChatMessage(listingId, trimmed);
            if (res.error) {
                setErr(res.error);
            } else {
                setText("");
                router.refresh();
            }
        });
    };

    return (
        <div className="border-border bg-surface-alt/40 flex w-full max-w-full min-w-0 flex-col rounded-sm border border-dashed p-4">
            <div className="mb-3 h-[min(220px,40dvh)] min-h-[120px] w-full min-w-0 space-y-3 overflow-x-hidden overflow-y-auto overscroll-y-contain">
                {initialMessages.length === 0 ? (
                    <p className="text-ink-muted px-1 py-6 text-center text-sm">
                        No messages yet. Say hello and share progress updates
                        here.
                    </p>
                ) : (
                    initialMessages.map((m) => {
                        const mine = m.authorId === currentUserId;
                        const label = shortenDisplayName(m.authorName).text;
                        return (
                            <div
                                key={m.id}
                                className={`flex min-w-0 flex-col gap-0.5 ${mine ? "items-end" : "items-start"}`}
                            >
                                <div
                                    className={`text-ink-muted max-w-full rounded-sm px-3 py-2 text-sm wrap-break-word whitespace-pre-wrap sm:max-w-[95%] ${
                                        mine
                                            ? "bg-clay/15 border-clay/25 border"
                                            : "border-border bg-surface border"
                                    }`}
                                >
                                    {m.body}
                                </div>
                                <span className="text-ink-soft max-w-full truncate px-1 text-[10px]">
                                    {label}
                                </span>
                            </div>
                        );
                    })
                )}
            </div>
            <form
                onSubmit={handleSubmit}
                className="border-border flex max-w-full min-w-0 shrink-0 flex-col gap-3 border-t pt-3"
            >
                {err && (
                    <div className="text-xs text-red-400" role="alert">
                        {err}
                    </div>
                )}
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Message about progress…"
                    rows={3}
                    disabled={isPending}
                    className="border-border bg-surface text-ink placeholder:text-ink-soft focus:border-clay box-border min-h-0 w-full max-w-full min-w-0 resize-none rounded-lg border px-3 py-2 text-sm outline-none disabled:opacity-50"
                />
                <button
                    type="submit"
                    disabled={isPending || !text.trim()}
                    className="btn-dream btn-dream-primary box-border max-w-full self-start rounded-lg px-4 py-2 text-sm disabled:opacity-50"
                >
                    {isPending ? "Sending…" : "Send"}
                </button>
            </form>
        </div>
    );
};
