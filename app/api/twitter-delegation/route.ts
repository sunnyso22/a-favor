import { db } from "@/db";
import { account, delegation } from "@/db/schema";
import { auth } from "@/lib/auth";
import { and, desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (request: NextRequest) => {
    const session = await auth.api.getSession({
        headers: request.headers,
    });

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const delegations = await db
        .select()
        .from(delegation)
        .where(eq(delegation.userId, session.user.id))
        .orderBy(desc(delegation.createdAt));

    return NextResponse.json({ delegations });
};

export const POST = async (request: NextRequest) => {
    const session = await auth.api.getSession({
        headers: request.headers,
    });

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const twitterAccount = await db
        .select()
        .from(account)
        .where(
            and(
                eq(account.userId, session.user.id),
                eq(account.providerId, "twitter")
            )
        )
        .limit(1);

    if (twitterAccount.length === 0) {
        return NextResponse.json(
            { error: "No Twitter account connected. Please connect your X account first." },
            { status: 400 }
        );
    }

    const body = await request.json();
    const { label, expiresInHours = 24 } = body;

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

    const [created] = await db
        .insert(delegation)
        .values({
            id: crypto.randomUUID(),
            userId: session.user.id,
            token,
            expiresAt,
            label: label || null,
        })
        .returning();

    return NextResponse.json({
        delegation: created,
        shareUrl: `${process.env.BETTER_AUTH_URL}/twitter-delegatee/${token}`,
    });
};

export const DELETE = async (request: NextRequest) => {
    const session = await auth.api.getSession({
        headers: request.headers,
    });

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
        return NextResponse.json(
            { error: "Missing delegation id" },
            { status: 400 }
        );
    }

    const result = await db
        .delete(delegation)
        .where(
            and(
                eq(delegation.id, id),
                eq(delegation.userId, session.user.id)
            )
        )
        .returning();

    if (result.length === 0) {
        return NextResponse.json(
            { error: "Delegation not found" },
            { status: 404 }
        );
    }

    return NextResponse.json({ success: true });
};
