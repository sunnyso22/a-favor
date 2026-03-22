import { headers } from "next/headers";
import Link from "next/link";

import { getMarketplaceListings } from "@/app/marketplace/actions";

import { JobForm } from "@/components/marketplace/JobForm";

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

const MarketplacePage = async () => {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    const listings = await getMarketplaceListings();

    return (
        <div className="mx-auto max-w-5xl px-6 py-12">
            <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
                <h1 className="section-title text-ink shrink-0 text-3xl md:text-4xl">
                    Marketplace
                </h1>
                {session && <JobForm />}
            </div>

            <div className="space-y-3">
                {listings.map(
                    ({
                        id,
                        title,
                        description,
                        price,
                        priceUnit,
                        status,
                        author,
                    }) => (
                        <Link
                            key={id}
                            href={`/marketplace/${id}`}
                            className="poster-card hover:border-clay/50 block rounded-sm p-6 transition-colors duration-200"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <div className="text-ink font-semibold">
                                            {title}
                                        </div>
                                        <span
                                            className={`shrink-0 rounded-sm border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide whitespace-nowrap ${statusBadgeClass(status)}`}
                                        >
                                            {statusLabel(status)}
                                        </span>
                                    </div>
                                    <div className="text-ink-muted mt-1 line-clamp-2 text-sm">
                                        {description}
                                    </div>
                                </div>
                                <span className="text-clay shrink-0 font-mono text-sm whitespace-nowrap">
                                    {price} {priceUnit}
                                </span>
                            </div>
                            <div className="mt-2">
                                <span className="text-ink-muted text-xs">
                                    by {shortenDisplayName(author!).text}
                                </span>
                            </div>
                        </Link>
                    )
                )}
                {listings.length === 0 && (
                    <div className="text-ink-muted py-8 text-center">
                        No listings yet. Sign in and post a job to add one.
                    </div>
                )}
            </div>
        </div>
    );
};

export default MarketplacePage;
