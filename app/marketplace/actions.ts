"use server";

import { and, asc, desc, eq, ne } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { db } from "@/drizzle";
import {
    marketplaceBid,
    marketplaceChatMessage,
    marketplaceListing,
    user,
} from "@/drizzle/schema";

import { auth } from "@/lib/auth";

type ActionResult = { error?: string };

const marketplaceWorkerUser = alias(user, "marketplace_worker_user");

/** All listings (any status), newest first — detail page enforces apply/chat rules per status. */
export const getMarketplaceListings = async () =>
    db
        .select({
            id: marketplaceListing.id,
            title: marketplaceListing.title,
            description: marketplaceListing.description,
            price: marketplaceListing.price,
            priceUnit: marketplaceListing.priceUnit,
            status: marketplaceListing.status,
            author: user.name,
            createdAt: marketplaceListing.createdAt,
        })
        .from(marketplaceListing)
        .innerJoin(user, eq(marketplaceListing.userId, user.id))
        .orderBy(desc(marketplaceListing.createdAt));

export const getListingWithBids = async (listingId: string) => {
    const [listing] = await db
        .select({
            id: marketplaceListing.id,
            userId: marketplaceListing.userId,
            title: marketplaceListing.title,
            description: marketplaceListing.description,
            models: marketplaceListing.models,
            price: marketplaceListing.price,
            priceUnit: marketplaceListing.priceUnit,
            status: marketplaceListing.status,
            workerId: marketplaceListing.workerId,
            workerName: marketplaceWorkerUser.name,
            finalDelivery: marketplaceListing.finalDelivery,
            finalDeliveredAt: marketplaceListing.finalDeliveredAt,
            author: user.name,
        })
        .from(marketplaceListing)
        .innerJoin(user, eq(marketplaceListing.userId, user.id))
        .leftJoin(
            marketplaceWorkerUser,
            eq(marketplaceListing.workerId, marketplaceWorkerUser.id)
        )
        .where(eq(marketplaceListing.id, listingId))
        .limit(1);

    if (!listing) return null;

    const bids = await db
        .select({
            id: marketplaceBid.id,
            bidderId: marketplaceBid.userId,
            approach: marketplaceBid.approach,
            resources: marketplaceBid.resources,
            timeline: marketplaceBid.timeline,
            proposedPrice: marketplaceBid.proposedPrice,
            status: marketplaceBid.status,
            author: user.name,
        })
        .from(marketplaceBid)
        .innerJoin(user, eq(marketplaceBid.userId, user.id))
        .where(eq(marketplaceBid.listingId, listingId))
        .orderBy(asc(marketplaceBid.createdAt));

    return { listing, bids };
};

export type MarketplaceChatMessageRow = {
    id: string;
    body: string;
    createdAt: Date | string;
    authorName: string;
    authorId: string;
};

export const getMarketplaceChatMessages = async (
    listingId: string
): Promise<MarketplaceChatMessageRow[]> => {
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    if (!session) return [];

    const [row] = await db
        .select({
            userId: marketplaceListing.userId,
            workerId: marketplaceListing.workerId,
        })
        .from(marketplaceListing)
        .where(eq(marketplaceListing.id, listingId))
        .limit(1);

    if (!row) return [];
    if (row.userId !== session.user.id && row.workerId !== session.user.id) {
        return [];
    }

    const rows = await db
        .select({
            id: marketplaceChatMessage.id,
            body: marketplaceChatMessage.body,
            createdAt: marketplaceChatMessage.createdAt,
            authorName: user.name,
            authorId: marketplaceChatMessage.userId,
        })
        .from(marketplaceChatMessage)
        .innerJoin(user, eq(marketplaceChatMessage.userId, user.id))
        .where(eq(marketplaceChatMessage.listingId, listingId))
        .orderBy(asc(marketplaceChatMessage.createdAt));

    return rows;
};

type ListingCreateInput = {
    title: string;
    description: string;
    models: string;
    price: string;
    priceUnit: string;
};

export const createListing = async (
    input: ListingCreateInput
): Promise<ActionResult> => {
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    if (!session) return { error: "Unauthorized" };

    const { title, description, models, price, priceUnit } = input;
    if (
        !title?.trim() ||
        !description?.trim() ||
        !models?.trim() ||
        !price?.trim() ||
        !priceUnit?.trim()
    ) {
        return {
            error: "Title, description, models, price, and price unit are required",
        };
    }

    await db.insert(marketplaceListing).values({
        id: crypto.randomUUID(),
        userId: session.user.id,
        title: title.trim(),
        description: description.trim(),
        models: models.trim(),
        price: price.trim(),
        priceUnit: priceUnit.trim(),
    });

    revalidatePath("/marketplace");
    return {};
};

export const applyForListing = async (
    listingId: string,
    approach: string,
    resources: string,
    timeline: string,
    proposedPrice: string
): Promise<ActionResult> => {
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    if (!session) return { error: "Unauthorized" };
    if (!approach?.trim()) return { error: "Approach is required" };
    if (!timeline?.trim()) return { error: "Timeline is required" };
    if (!proposedPrice?.trim()) return { error: "Proposed price is required" };

    const [listing] = await db
        .select()
        .from(marketplaceListing)
        .where(eq(marketplaceListing.id, listingId))
        .limit(1);

    if (!listing) return { error: "Listing not found" };
    if (listing.status !== "open") return { error: "Listing is not open" };

    await db.insert(marketplaceBid).values({
        id: crypto.randomUUID(),
        listingId,
        userId: session.user.id,
        approach: approach.trim(),
        resources: resources?.trim() || null,
        timeline: timeline.trim(),
        proposedPrice: proposedPrice.trim(),
    });

    revalidatePath(`/marketplace/${listingId}`);
    return {};
};

export const acceptBid = async (bidId: string): Promise<ActionResult> => {
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    if (!session) return { error: "Unauthorized" };

    const [bid] = await db
        .select()
        .from(marketplaceBid)
        .where(eq(marketplaceBid.id, bidId))
        .limit(1);

    if (!bid) return { error: "Bid not found" };

    try {
        await db.transaction(async (tx) => {
            const [listing] = await tx
                .select()
                .from(marketplaceListing)
                .where(eq(marketplaceListing.id, bid.listingId))
                .limit(1);

            if (!listing) throw new Error("Listing not found");
            if (listing.userId !== session.user.id) {
                throw new Error("Only the listing author can accept a bid");
            }
            if (listing.status !== "open") {
                throw new Error("Listing is not open for bids");
            }
            if (bid.status !== "pending") {
                throw new Error("This bid can no longer be accepted");
            }

            await tx
                .update(marketplaceListing)
                .set({ workerId: bid.userId, status: "in_progress" })
                .where(eq(marketplaceListing.id, listing.id));

            await tx
                .update(marketplaceBid)
                .set({ status: "accepted" })
                .where(eq(marketplaceBid.id, bidId));

            await tx
                .update(marketplaceBid)
                .set({ status: "rejected" })
                .where(
                    and(
                        eq(marketplaceBid.listingId, listing.id),
                        ne(marketplaceBid.id, bidId),
                        eq(marketplaceBid.status, "pending")
                    )
                );
        });
    } catch (e) {
        return {
            error: e instanceof Error ? e.message : "Failed to accept bid",
        };
    }

    revalidatePath(`/marketplace/${bid.listingId}`);
    revalidatePath("/marketplace");
    return {};
};

export const sendMarketplaceChatMessage = async (
    listingId: string,
    body: string
): Promise<ActionResult> => {
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    if (!session) return { error: "Unauthorized" };
    if (!body?.trim()) return { error: "Message is required" };

    const [listing] = await db
        .select()
        .from(marketplaceListing)
        .where(eq(marketplaceListing.id, listingId))
        .limit(1);

    if (!listing) return { error: "Listing not found" };
    if (
        listing.status !== "in_progress" &&
        listing.status !== "delivered" &&
        listing.status !== "paid"
    ) {
        return { error: "Chat is not available for this listing" };
    }

    const uid = session.user.id;
    if (listing.userId !== uid && listing.workerId !== uid) {
        return { error: "Forbidden" };
    }

    await db.insert(marketplaceChatMessage).values({
        id: crypto.randomUUID(),
        listingId,
        userId: uid,
        body: body.trim(),
    });

    revalidatePath(`/marketplace/${listingId}`);
    return {};
};

/** Author confirms payment after final delivery (no on-chain transfer yet). */
export const confirmListingPayment = async (
    listingId: string
): Promise<ActionResult> => {
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    if (!session) return { error: "Unauthorized" };

    const [listing] = await db
        .select()
        .from(marketplaceListing)
        .where(eq(marketplaceListing.id, listingId))
        .limit(1);

    if (!listing) return { error: "Listing not found" };
    if (listing.userId !== session.user.id) {
        return { error: "Only the listing author can confirm payment" };
    }
    if (listing.status !== "delivered") {
        return { error: "Payment can only be confirmed after delivery" };
    }
    if (!listing.finalDelivery?.trim()) {
        return { error: "No final delivery to pay against" };
    }

    await db
        .update(marketplaceListing)
        .set({ status: "paid" })
        .where(eq(marketplaceListing.id, listingId));

    revalidatePath(`/marketplace/${listingId}`);
    revalidatePath("/marketplace");
    return {};
};

export const submitFinalDelivery = async (
    listingId: string,
    body: string
): Promise<ActionResult> => {
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    if (!session) return { error: "Unauthorized" };
    if (!body?.trim()) return { error: "Final delivery text is required" };

    const [listing] = await db
        .select()
        .from(marketplaceListing)
        .where(eq(marketplaceListing.id, listingId))
        .limit(1);

    if (!listing) return { error: "Listing not found" };
    if (listing.workerId !== session.user.id) {
        return { error: "Only the assigned worker can submit delivery" };
    }
    if (listing.status !== "in_progress" && listing.status !== "delivered") {
        return { error: "Listing is not in an active work state" };
    }

    await db
        .update(marketplaceListing)
        .set({
            finalDelivery: body.trim(),
            finalDeliveredAt: new Date(),
            status: "delivered",
        })
        .where(eq(marketplaceListing.id, listingId));

    revalidatePath(`/marketplace/${listingId}`);
    return {};
};
