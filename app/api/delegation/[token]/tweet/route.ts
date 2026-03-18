import { db } from "@/db";
import { eq } from "drizzle-orm";

import { NextRequest, NextResponse } from "next/server";

import { delegation } from "@/db/schema";

import { auth } from "@/lib/auth";

export const POST = async (
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) => {
    const { token } = await params;

    const [record] = await db
        .select()
        .from(delegation)
        .where(eq(delegation.token, token))
        .limit(1);

    if (!record) {
        return NextResponse.json(
            { error: "Invalid delegation link" },
            { status: 404 }
        );
    }

    if (new Date() > record.expiresAt) {
        return NextResponse.json(
            { error: "This delegation link has expired" },
            { status: 410 }
        );
    }

    const body = await request.json();
    const { text } = body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
        return NextResponse.json(
            { error: "Tweet text is required" },
            { status: 400 }
        );
    }

    if (text.length > 280) {
        return NextResponse.json(
            { error: "Tweet text must be 280 characters or less" },
            { status: 400 }
        );
    }

    let accessToken: string;
    try {
        const tokenResult = await auth.api.getAccessToken({
            body: {
                providerId: "twitter",
                userId: record.userId,
            },
        });
        accessToken = tokenResult.accessToken!;
    } catch {
        return NextResponse.json(
            {
                error: "Failed to retrieve Twitter access token. The delegator may need to reconnect their X account.",
            },
            { status: 500 }
        );
    }

    const twitterResponse = await fetch("https://api.x.com/2/tweets", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: text.trim() }),
    });

    if (!twitterResponse.ok) {
        const error = await twitterResponse.json().catch(() => null);
        return NextResponse.json(
            {
                error: "Failed to post tweet",
                details: error,
            },
            { status: twitterResponse.status }
        );
    }

    const tweetData = await twitterResponse.json();
    return NextResponse.json({ success: true, tweet: tweetData.data });
};
