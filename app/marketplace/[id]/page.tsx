import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
    getListingWithBids,
    getMarketplaceChatMessages,
} from "@/app/marketplace/actions";

import { AcceptBidButton } from "@/components/marketplace/AcceptBidButton";
import { ApplyForm } from "@/components/marketplace/ApplyForm";
import { FinalDeliveryForm } from "@/components/marketplace/FinalDeliveryForm";
import { MarketplaceChat } from "@/components/marketplace/MarketplaceChat";
import { PayListingButton } from "@/components/marketplace/PayListingButton";

import { auth } from "@/lib/auth";
import { shortenDisplayName } from "@/lib/helper";

const statusLabel = (status: string) => {
    if (status === "open") return "Open";
    if (status === "closed") return "Closed";
    if (status === "in_progress") return "In progress";
    if (status === "delivered") return "Delivered";
    if (status === "paid") return "Paid";
    return status;
};

const statusBadgeClass = (status: string) => {
    if (status === "open") return "border-clay/40 text-clay bg-surface-alt";
    if (status === "in_progress")
        return "border-sun/50 text-clay-dim bg-surface-alt";
    if (status === "delivered")
        return "border-stone/50 text-ink bg-surface-alt";
    if (status === "paid")
        return "border-emerald-500/70 text-emerald-700 bg-emerald-50";
    if (status === "closed")
        return "border-border text-ink-muted bg-surface-alt";
    return "border-border text-ink-muted bg-surface-alt";
};

const bidStatusLabel = (status: string) => {
    if (status === "pending") return "Pending";
    if (status === "accepted") return "Accepted";
    if (status === "rejected") return "Declined";
    return status;
};

const bidStatusBadgeClass = (status: string) => {
    if (status === "pending")
        return "border-border text-ink-muted bg-surface-alt";
    if (status === "accepted")
        return "border-emerald-500/45 text-emerald-800 bg-emerald-50";
    if (status === "rejected")
        return "border-border text-ink-soft bg-surface-alt";
    return "border-border text-ink-muted bg-surface-alt";
};

const MarketplaceListingPage = async ({
    params,
}: {
    params: Promise<{ id: string }>;
}) => {
    const { id } = await params;

    const session = await auth.api.getSession({
        headers: await headers(),
    });

    const data = await getListingWithBids(id);
    if (!data) notFound();
    const { listing, bids } = data;

    const chatMessages = await getMarketplaceChatMessages(id);

    const authorDisplay = shortenDisplayName(listing.author ?? "").text;
    const workerDisplay = listing.workerName
        ? shortenDisplayName(listing.workerName).text
        : null;
    const isOwner = session?.user.id === listing.userId;
    const isWorker = Boolean(
        session?.user.id &&
        listing.workerId &&
        session.user.id === listing.workerId
    );
    const canApply = session && listing.status === "open" && !isOwner;
    const canCollaborate =
        (isOwner || isWorker) &&
        (listing.status === "in_progress" ||
            listing.status === "delivered" ||
            listing.status === "paid");

    return (
        <div className="mx-auto max-w-6xl px-6 py-10">
            <Link
                href="/marketplace"
                className="text-ink-muted hover:text-clay mb-8 inline-flex items-center gap-2 text-sm transition-colors"
            >
                <span aria-hidden>←</span>
                Back to marketplace
            </Link>

            <header className="poster-card mb-8 rounded-sm p-6 md:p-8">
                <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                    <div className="flex min-w-0 flex-row flex-wrap items-center gap-2 md:gap-3">
                        <h1 className="section-title text-ink min-w-0 text-3xl md:text-4xl">
                            {listing.title}
                        </h1>
                        <span
                            className={`shrink-0 rounded-sm border px-3 py-1 text-xs font-semibold tracking-wide whitespace-nowrap ${statusBadgeClass(listing.status)}`}
                        >
                            {statusLabel(listing.status)}
                        </span>
                    </div>
                    <div className="poster-card border-clay/25 bg-surface-alt shrink-0 rounded-sm border px-5 py-4 md:text-right">
                        <p className="text-clay font-mono text-2xl font-semibold tracking-tight">
                            {listing.price}{" "}
                            <span className="text-2xl">
                                {listing.priceUnit}
                            </span>
                        </p>
                    </div>
                </div>
            </header>

            <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
                <aside className="flex flex-col gap-6 lg:col-span-4">
                    <div className="poster-card rounded-sm p-6">
                        <h2 className="text-ink-muted mb-3 text-xs font-semibold tracking-wider uppercase">
                            At a glance
                        </h2>
                        <ul className="text-ink-soft space-y-3 text-sm">
                            <li className="border-border flex justify-between gap-4 border-b pb-3">
                                <span>Budget</span>
                                <span className="text-clay font-mono font-medium">
                                    {listing.price} {listing.priceUnit}
                                </span>
                            </li>
                            <li className="border-border flex justify-between gap-4 border-b pb-3">
                                <span>Author</span>
                                <span className="text-ink text-right">
                                    {authorDisplay}
                                </span>
                            </li>
                            {workerDisplay && (
                                <li className="border-border flex justify-between gap-4 border-b pb-3">
                                    <span>Worker</span>
                                    <span className="text-ink text-right">
                                        {workerDisplay}
                                    </span>
                                </li>
                            )}
                            <li className="flex justify-between gap-4">
                                <span>Status</span>
                                <span className="text-ink text-right">
                                    {statusLabel(listing.status)}
                                </span>
                            </li>
                        </ul>
                    </div>

                    {session && listing.status === "open" && isOwner && (
                        <div className="poster-card text-ink-muted rounded-sm p-6 text-sm leading-relaxed">
                            This is your listing. Accept a bid below to start a
                            private chat and track delivery.
                        </div>
                    )}

                    {session &&
                        (listing.status === "in_progress" ||
                            listing.status === "delivered") &&
                        isOwner && (
                            <div className="poster-card text-ink-muted rounded-sm p-6 text-sm leading-relaxed">
                                You&apos;re working with{" "}
                                <span className="text-ink">
                                    {workerDisplay ?? "the worker"}
                                </span>
                                . Use Collaboration to discuss progress; the
                                worker submits the final product there.
                            </div>
                        )}

                    {session && listing.status === "paid" && isOwner && (
                        <div className="poster-card text-ink-muted rounded-sm p-6 text-sm leading-relaxed">
                            You&apos;ve confirmed payment for this job. The
                            listing is marked{" "}
                            <span className="text-ink">Paid</span>.
                        </div>
                    )}

                    {session &&
                        listing.status === "delivered" &&
                        isOwner &&
                        listing.finalDelivery && (
                            <div className="poster-card rounded-sm p-6">
                                <h2 className="text-ink-muted mb-2 text-xs font-semibold tracking-wider uppercase">
                                    Payment
                                </h2>
                                <p className="text-ink-soft text-sm leading-relaxed">
                                    The worker has submitted the final delivery.
                                    When you&apos;re satisfied, confirm payment
                                    to close out the job.
                                </p>
                                <PayListingButton
                                    listingId={id}
                                    price={listing.price}
                                    priceUnit={listing.priceUnit}
                                />
                            </div>
                        )}

                    {session && isWorker && canCollaborate && (
                        <div className="poster-card text-ink-muted rounded-sm p-6 text-sm leading-relaxed">
                            {listing.status === "paid" ? (
                                <>
                                    The client has confirmed payment for this
                                    job.
                                </>
                            ) : (
                                <>
                                    You&apos;re assigned to this job. Chat with
                                    the client in Collaboration and submit your
                                    final delivery when ready.
                                </>
                            )}
                        </div>
                    )}

                    {canApply && (
                        <ApplyForm
                            listingId={id}
                            className="poster-card rounded-sm p-6"
                        />
                    )}
                    {!session && listing.status === "open" && (
                        <div className="poster-card text-ink-muted rounded-sm p-6 text-sm leading-relaxed">
                            Connect your wallet from the site header to submit a
                            bid.
                        </div>
                    )}
                </aside>

                <div className="flex flex-col gap-6 lg:col-span-8">
                    <article className="poster-card rounded-sm p-6 md:p-7">
                        <h2 className="text-ink-muted mb-4 text-xs font-semibold tracking-wider uppercase">
                            Description
                        </h2>
                        <div className="text-ink leading-relaxed whitespace-pre-wrap">
                            {listing.description}
                        </div>
                    </article>

                    <article className="poster-card rounded-sm p-6 md:p-7">
                        <h2 className="text-ink-muted mb-4 text-xs font-semibold tracking-wider uppercase">
                            Models
                        </h2>
                        <div className="text-ink-soft text-sm leading-relaxed whitespace-pre-wrap">
                            {listing.models}
                        </div>
                    </article>

                    {canCollaborate && session && (
                        <section className="poster-card min-w-0 rounded-sm p-6 md:p-7">
                            <h2 className="section-title text-ink mb-2 text-xl">
                                Collaboration
                            </h2>
                            <p className="text-ink-muted mb-6 text-sm leading-relaxed">
                                Private thread between you and your counterpart.
                                Only the listing author and the accepted worker
                                can read or post here.
                            </p>
                            <div className="grid min-w-0 gap-8 lg:grid-cols-2">
                                <div className="min-w-0">
                                    <h3 className="text-ink-muted mb-3 text-xs font-semibold tracking-wider uppercase">
                                        Progress chat
                                    </h3>
                                    <MarketplaceChat
                                        listingId={id}
                                        initialMessages={chatMessages}
                                        currentUserId={session.user.id}
                                    />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-ink-muted mb-3 text-xs font-semibold tracking-wider uppercase">
                                        Final delivery
                                    </h3>
                                    {isWorker && listing.status !== "paid" ? (
                                        <FinalDeliveryForm
                                            key={String(
                                                listing.finalDeliveredAt ?? ""
                                            )}
                                            listingId={id}
                                            initialBody={
                                                listing.finalDelivery ?? ""
                                            }
                                        />
                                    ) : listing.finalDelivery ? (
                                        <div className="border-border bg-surface-alt text-ink rounded-sm border p-4 text-sm leading-relaxed whitespace-pre-wrap">
                                            {listing.finalDelivery}
                                        </div>
                                    ) : (
                                        <p className="text-ink-muted text-sm leading-relaxed">
                                            The worker has not submitted a final
                                            delivery yet.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </section>
                    )}

                    <section>
                        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                            <h2 className="section-title text-ink text-xl">
                                Bids
                            </h2>
                            <span className="text-ink-muted border-border bg-surface-alt rounded-sm border px-2.5 py-1 font-mono text-xs tabular-nums">
                                {bids.length}{" "}
                                {bids.length === 1 ? "bid" : "bids"}
                            </span>
                        </div>
                        {bids.length === 0 ? (
                            <div className="bg-surface text-ink-muted rounded-sm border border-dashed border-clay/25 py-14 text-center text-sm">
                                No bids yet.
                            </div>
                        ) : (
                            <div className="grid gap-5 sm:grid-cols-2">
                                {bids.map((b) => (
                                    <article
                                        key={b.id}
                                        className="poster-card flex flex-col overflow-hidden rounded-sm"
                                    >
                                        <div className="border-border bg-surface-alt/70 flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3 sm:px-5">
                                            <p className="text-ink-soft min-w-0 text-xs">
                                                <span className="text-ink-muted">
                                                    From
                                                </span>{" "}
                                                <span className="text-ink font-medium">
                                                    {
                                                        shortenDisplayName(
                                                            b.author
                                                        ).text
                                                    }
                                                </span>
                                            </p>
                                            <div className="flex flex-wrap items-center gap-2">
                                                {session?.user.id ===
                                                    b.bidderId && (
                                                    <span className="border-clay/35 text-clay rounded-sm border bg-surface px-2 py-0.5 text-[10px] font-semibold tracking-wide">
                                                        Your bid
                                                    </span>
                                                )}
                                                <span
                                                    className={`rounded-sm border px-2 py-0.5 text-[10px] font-semibold tracking-wide whitespace-nowrap ${bidStatusBadgeClass(b.status)}`}
                                                >
                                                    {bidStatusLabel(b.status)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex flex-1 flex-col gap-4 p-4 sm:p-5">
                                            <div>
                                                <h3 className="text-ink-muted mb-2 text-[10px] font-semibold tracking-wider uppercase">
                                                    Approach
                                                </h3>
                                                <p className="text-ink text-sm leading-relaxed whitespace-pre-wrap">
                                                    {b.approach}
                                                </p>
                                            </div>
                                            <div className="grid gap-2 sm:grid-cols-2">
                                                <div className="border-border bg-surface-alt rounded-sm border p-3">
                                                    <p className="text-ink-muted mb-1 text-[10px] font-semibold tracking-wider uppercase">
                                                        Proposed price
                                                    </p>
                                                    <p className="text-clay font-mono text-sm font-medium">
                                                        {b.proposedPrice}
                                                    </p>
                                                </div>
                                                <div className="border-border bg-surface-alt rounded-sm border p-3">
                                                    <p className="text-ink-muted mb-1 text-[10px] font-semibold tracking-wider uppercase">
                                                        Timeline
                                                    </p>
                                                    <p className="text-ink text-sm leading-snug">
                                                        {b.timeline}
                                                    </p>
                                                </div>
                                            </div>
                                            {b.resources && (
                                                <div>
                                                    <h3 className="text-ink-muted mb-2 text-[10px] font-semibold tracking-wider uppercase">
                                                        Resources
                                                    </h3>
                                                    <div className="border-border bg-surface-alt text-ink-soft rounded-sm border p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap">
                                                        {b.resources}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        {isOwner &&
                                            listing.status === "open" &&
                                            b.status === "pending" && (
                                                <AcceptBidButton bidId={b.id} />
                                            )}
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
};

export default MarketplaceListingPage;
