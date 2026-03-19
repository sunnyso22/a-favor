"use server";

import { db } from "@/db";
import { and, eq, gt } from "drizzle-orm";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import type { GenerationData } from "@/components/llm-delegation/types";

import { delegation, openrouterAccount } from "@/db/schema";

import { auth } from "@/lib/auth";

type ActionResult = { error?: string };

export const createDelegation = async (
    prompt: string,
    expiresInHours: number
): Promise<ActionResult> => {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) return { error: "Unauthorized" };

    if (!prompt || prompt.trim().length === 0) {
        return { error: "Prompt is required" };
    }

    const orAccount = await db
        .select()
        .from(openrouterAccount)
        .where(eq(openrouterAccount.userId, session.user.id))
        .limit(1);

    if (orAccount.length === 0) {
        return { error: "No OpenRouter account connected" };
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
        return { error: "Failed to get LLM response" };
    }

    const llmData = await openRouterResponse.json();
    const responseContent =
        llmData.choices?.[0]?.message?.content ?? "No response";
    const generationId: string | null = llmData.id ?? null;

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

    await db.insert(delegation).values({
        id: crypto.randomUUID(),
        userId: session.user.id,
        token,
        expiresAt,
        prompt: prompt.trim(),
        response: responseContent,
        generationId,
    });

    revalidatePath("/llm-delegation");
    return {};
};

export const revokeDelegation = async (id: string): Promise<ActionResult> => {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) return { error: "Unauthorized" };

    const result = await db
        .delete(delegation)
        .where(
            and(eq(delegation.id, id), eq(delegation.userId, session.user.id))
        )
        .returning();

    if (result.length === 0) {
        return { error: "Delegation not found" };
    }

    revalidatePath("/llm-delegation");
    return {};
};

export const disconnectOpenRouter = async (): Promise<ActionResult> => {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) return { error: "Unauthorized" };

    const result = await db
        .delete(openrouterAccount)
        .where(eq(openrouterAccount.userId, session.user.id))
        .returning();

    if (result.length === 0) {
        return { error: "No OpenRouter account connected" };
    }

    revalidatePath("/llm-delegation");
    return {};
};

export const fetchGenerationMetadata = async (
    token: string
): Promise<{ data?: GenerationData; error?: string }> => {
    if (!token) return { error: "Missing token" };

    const [record] = await db
        .select({
            generationId: delegation.generationId,
            userId: delegation.userId,
        })
        .from(delegation)
        .where(
            and(
                eq(delegation.token, token),
                gt(delegation.expiresAt, new Date())
            )
        )
        .limit(1);

    if (!record) return { error: "Delegation not found or expired" };
    if (!record.generationId) {
        return { error: "No generation ID associated with this delegation" };
    }

    const [orAccount] = await db
        .select({ apiKey: openrouterAccount.apiKey })
        .from(openrouterAccount)
        .where(eq(openrouterAccount.userId, record.userId))
        .limit(1);

    if (!orAccount) {
        return { error: "OpenRouter account no longer connected" };
    }

    const orResponse = await fetch(
        `https://openrouter.ai/api/v1/generation?id=${encodeURIComponent(record.generationId)}`,
        {
            headers: { Authorization: `Bearer ${orAccount.apiKey}` },
        }
    );

    if (!orResponse.ok) {
        return { error: "Failed to fetch generation metadata" };
    }

    const metadata = await orResponse.json();
    return { data: metadata.data };
};
