"use server";

import { and, desc, eq, gt } from "drizzle-orm";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import type { GenerationData, LlmShare } from "@/components/llm/types";

import { db } from "@/drizzle";
import { forumReply, llm, openrouterAccount, user } from "@/drizzle/schema";

import { auth } from "@/lib/auth";

type ActionResult = { error?: string };

export type LlmDashboardData =
    | { status: "unauthenticated" }
    | { status: "needs_openrouter" }
    | { status: "ready"; shares: LlmShare[] };

export const getLlmDashboardData = async (): Promise<LlmDashboardData> => {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) return { status: "unauthenticated" };

    const orAccount = await db
        .select()
        .from(openrouterAccount)
        .where(eq(openrouterAccount.userId, session.user.id))
        .limit(1);

    if (orAccount.length === 0) return { status: "needs_openrouter" };

    const rows = await db
        .select()
        .from(llm)
        .where(eq(llm.userId, session.user.id))
        .orderBy(desc(llm.createdAt));

    const shares: LlmShare[] = rows.map((d) => ({
        id: d.id,
        token: d.token,
        expiresAt: d.expiresAt,
        prompt: d.prompt,
        response: d.response,
        generationId: d.generationId,
        forumThreadId: d.forumThreadId,
        createdAt: d.createdAt,
    }));

    return { status: "ready", shares };
};

export type LlmSharePublic = {
    id: string;
    token: string;
    expiresAt: Date;
    prompt: string | null;
    response: string | null;
    generationId: string | null;
    userName: string | null;
};

export const getLlmShareByToken = async (
    token: string
): Promise<LlmSharePublic | null> => {
    const [record] = await db
        .select({
            id: llm.id,
            token: llm.token,
            expiresAt: llm.expiresAt,
            prompt: llm.prompt,
            response: llm.response,
            generationId: llm.generationId,
            userName: user.name,
        })
        .from(llm)
        .innerJoin(user, eq(llm.userId, user.id))
        .where(eq(llm.token, token))
        .limit(1);

    return record ?? null;
};

export const createLlm = async (
    prompt: string,
    expiresInHours: number,
    forumThreadId?: string
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
    const llmRowId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

    await db.transaction(async (tx) => {
        await tx.insert(llm).values({
            id: llmRowId,
            userId: session.user.id,
            token,
            expiresAt,
            prompt: prompt.trim(),
            response: responseContent,
            generationId,
            forumThreadId: forumThreadId || null,
        });

        if (forumThreadId) {
            await tx.insert(forumReply).values({
                id: crypto.randomUUID(),
                forumThreadId,
                userId: session.user.id,
                body: responseContent.trim(),
                llmId: llmRowId,
            });
        }
    });

    revalidatePath("/llm");
    if (forumThreadId) revalidatePath(`/forum/${forumThreadId}`);
    return {};
};

export const revokeLlm = async (id: string): Promise<ActionResult> => {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) return { error: "Unauthorized" };

    const result = await db
        .delete(llm)
        .where(and(eq(llm.id, id), eq(llm.userId, session.user.id)))
        .returning({
            forumThreadId: llm.forumThreadId,
        });

    if (result.length === 0) {
        return { error: "LLM share not found" };
    }

    revalidatePath("/llm");
    const { forumThreadId: ftid } = result[0];
    if (ftid) revalidatePath(`/forum/${ftid}`);
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

    revalidatePath("/llm");
    return {};
};

export const fetchGenerationMetadata = async (
    token: string
): Promise<{ data?: GenerationData; error?: string }> => {
    if (!token) return { error: "Missing token" };

    const [record] = await db
        .select({
            generationId: llm.generationId,
            userId: llm.userId,
        })
        .from(llm)
        .where(and(eq(llm.token, token), gt(llm.expiresAt, new Date())))
        .limit(1);

    if (!record) return { error: "LLM share not found or expired" };
    if (!record.generationId) {
        return { error: "No generation ID for this LLM share" };
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
