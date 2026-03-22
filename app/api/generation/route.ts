import { and, eq, gt, isNull, or } from "drizzle-orm";

import { NextRequest, NextResponse } from "next/server";

import { db } from "@/drizzle";
import { llm, openrouterAccount } from "@/drizzle/schema";

export const GET = async (request: NextRequest) => {
    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
        return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    const [record] = await db
        .select({
            generationId: llm.generationId,
            userId: llm.userId,
        })
        .from(llm)
        .where(
            and(
                eq(llm.token, token),
                or(isNull(llm.expiresAt), gt(llm.expiresAt, new Date()))
            )
        )
        .limit(1);

    if (!record?.generationId) {
        return NextResponse.json(
            { error: "LLM share not found, expired, or has no generation ID" },
            { status: 404 }
        );
    }

    const [orAccount] = await db
        .select({ apiKey: openrouterAccount.apiKey })
        .from(openrouterAccount)
        .where(eq(openrouterAccount.userId, record.userId))
        .limit(1);

    if (!orAccount) {
        return NextResponse.json(
            { error: "OpenRouter account no longer connected" },
            { status: 404 }
        );
    }

    const orResponse = await fetch(
        `https://openrouter.ai/api/v1/generation?id=${encodeURIComponent(record.generationId)}`,
        { headers: { Authorization: `Bearer ${orAccount.apiKey}` } }
    );

    if (!orResponse.ok) {
        return NextResponse.json(
            { error: "Failed to fetch generation metadata from OpenRouter" },
            { status: orResponse.status }
        );
    }

    const data = await orResponse.json();
    return NextResponse.json(data);
};
