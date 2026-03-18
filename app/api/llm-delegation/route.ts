import { db } from "@/db";
import { delegation, openrouterAccount } from "@/db/schema";
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

    const orAccount = await db
        .select()
        .from(openrouterAccount)
        .where(eq(openrouterAccount.userId, session.user.id))
        .limit(1);

    if (orAccount.length === 0) {
        return NextResponse.json(
            { error: "No OpenRouter account connected. Please connect your OpenRouter account first." },
            { status: 400 }
        );
    }

    const body = await request.json();
    const { prompt, label, expiresInHours = 24 } = body;

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
        return NextResponse.json(
            { error: "Prompt is required" },
            { status: 400 }
        );
    }

    const apiKey = orAccount[0].apiKey;
    const openRouterResponse = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "openrouter/free",
                messages: [{ role: "user", content: prompt.trim() }],
            }),
        }
    );

    if (!openRouterResponse.ok) {
        const err = await openRouterResponse.json().catch(() => null);
        return NextResponse.json(
            { error: "Failed to get LLM response", details: err },
            { status: openRouterResponse.status }
        );
    }

    const llmData = await openRouterResponse.json();
    const responseContent =
        llmData.choices?.[0]?.message?.content ?? "No response";

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
            prompt: prompt.trim(),
            response: responseContent,
        })
        .returning();

    return NextResponse.json({
        delegation: created,
        shareUrl: `${process.env.BETTER_AUTH_URL}/llm-delegatee/${token}`,
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
