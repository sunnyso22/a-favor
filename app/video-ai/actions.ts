"use server";

import { and, desc, eq } from "drizzle-orm";
import OpenAI, { APIError } from "openai";
import type { Video } from "openai/resources/videos";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { db } from "@/drizzle";
import {
    poeAccount,
    studioSolution,
    studioTask,
    user,
    videoShare,
} from "@/drizzle/schema";

import { auth } from "@/lib/auth";
import { parsePoeVideoIdFromMetadata } from "@/lib/poe-video-share";
import { isAllowedTaskModel } from "@/lib/task-models";

const POE_BASE_URL = "https://api.poe.com/v1";

type ActionResult = { error?: string };

export type VideoAiDashboardShare = {
    id: string;
    token: string;
    expiresAt: Date;
    prompt: string | null;
    model: string;
    status: string;
    metadataJson: string | null;
    errorMessage: string | null;
    createdAt: Date;
};

export const loadVideoAiDashboard = async (): Promise<{
    poeKeyMissing: boolean;
    shares: VideoAiDashboardShare[];
}> => {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) return { poeKeyMissing: true, shares: [] };

    const account = await db
        .select()
        .from(poeAccount)
        .where(eq(poeAccount.userId, session.user.id))
        .limit(1);

    const poeKeyMissing = account.length === 0;

    const rows = await db
        .select()
        .from(videoShare)
        .where(eq(videoShare.userId, session.user.id))
        .orderBy(desc(videoShare.createdAt));

    const shares: VideoAiDashboardShare[] = rows.map((r) => ({
        id: r.id,
        token: r.token,
        expiresAt: r.expiresAt,
        prompt: r.prompt,
        model: r.model,
        status: r.status,
        metadataJson: r.metadataJson,
        errorMessage: r.errorMessage,
        createdAt: r.createdAt,
    }));

    return { poeKeyMissing, shares };
};

export type VideoSharePublicView = {
    token: string;
    expiresAt: Date;
    prompt: string | null;
    model: string;
    status: string;
    metadataJson: string | null;
    errorMessage: string | null;
    userName: string | null;
};

export const getVideoShareByToken = async (
    token: string
): Promise<VideoSharePublicView | null> => {
    const [record] = await db
        .select({
            token: videoShare.token,
            expiresAt: videoShare.expiresAt,
            prompt: videoShare.prompt,
            model: videoShare.model,
            status: videoShare.status,
            metadataJson: videoShare.metadataJson,
            errorMessage: videoShare.errorMessage,
            userName: user.name,
        })
        .from(videoShare)
        .innerJoin(user, eq(videoShare.userId, user.id))
        .where(eq(videoShare.token, token))
        .limit(1);

    return record ?? null;
};

const poeOpenAI = (apiKey: string) =>
    new OpenAI({
        apiKey,
        baseURL: POE_BASE_URL,
    });

const poeSdkErrorMessage = (err: unknown): string => {
    if (err instanceof APIError) return err.message;
    if (err instanceof Error) return err.message;
    return "Unexpected error";
};

export const savePoeApiKey = async (apiKey: string): Promise<ActionResult> => {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) return { error: "Unauthorized" };

    const trimmed = apiKey.trim();
    if (!trimmed) return { error: "API key is required" };

    await db
        .insert(poeAccount)
        .values({
            id: crypto.randomUUID(),
            userId: session.user.id,
            apiKey: trimmed,
        })
        .onConflictDoUpdate({
            target: poeAccount.userId,
            set: { apiKey: trimmed, updatedAt: new Date() },
        });

    revalidatePath("/video-ai");
    return {};
};

export const disconnectPoe = async (): Promise<ActionResult> => {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) return { error: "Unauthorized" };

    const result = await db
        .delete(poeAccount)
        .where(eq(poeAccount.userId, session.user.id))
        .returning();

    if (result.length === 0) {
        return { error: "No Poe API key saved" };
    }

    revalidatePath("/video-ai");
    return {};
};

export const createVideoShare = async (
    prompt: string,
    model: string,
    expiresInHours: number,
    studioTaskId?: string
): Promise<ActionResult & { token?: string }> => {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) return { error: "Unauthorized" };

    if (!prompt?.trim()) return { error: "Prompt is required" };
    if (!model?.trim()) return { error: "Model is required" };
    if (!isAllowedTaskModel(model.trim())) {
        return { error: "Invalid model" };
    }

    if (studioTaskId) {
        const [t] = await db
            .select({ id: studioTask.id })
            .from(studioTask)
            .where(eq(studioTask.id, studioTaskId))
            .limit(1);
        if (!t) return { error: "Studio task not found" };
    }

    const [account] = await db
        .select({ apiKey: poeAccount.apiKey })
        .from(poeAccount)
        .where(eq(poeAccount.userId, session.user.id))
        .limit(1);

    if (!account) {
        return { error: "Add your Poe API key first" };
    }

    let chat: OpenAI.ChatCompletion;
    try {
        const client = poeOpenAI(account.apiKey);
        chat = await client.chat.completions.create({
            model: model.trim(),
            messages: [
                {
                    role: "user",
                    content: prompt.trim(),
                },
            ],
        });
    } catch (err) {
        return { error: poeSdkErrorMessage(err) };
    }

    const token = crypto.randomUUID();
    const shareId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

    await db.transaction(async (tx) => {
        await tx.insert(videoShare).values({
            id: shareId,
            userId: session.user.id,
            token,
            expiresAt,
            prompt: prompt.trim(),
            model: model.trim(),
            status: "completed",
            metadataJson: JSON.stringify(chat),
            errorMessage: null,
        });

        if (studioTaskId) {
            await tx.insert(studioSolution).values({
                id: crypto.randomUUID(),
                studioTaskId,
                userId: session.user.id,
                videoShareId: shareId,
            });
        }
    });

    revalidatePath("/video-ai");
    if (studioTaskId) revalidatePath(`/studio/${studioTaskId}`);
    return { token };
};

export const syncVideoShareStatus = async (
    shareId: string
): Promise<
    ActionResult & { status?: string; metadataJson?: string | null }
> => {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) return { error: "Unauthorized" };

    const [row] = await db
        .select({
            token: videoShare.token,
            metadataJson: videoShare.metadataJson,
        })
        .from(videoShare)
        .where(
            and(
                eq(videoShare.id, shareId),
                eq(videoShare.userId, session.user.id)
            )
        )
        .limit(1);

    if (!row) return { error: "Share not found" };

    const [account] = await db
        .select({ apiKey: poeAccount.apiKey })
        .from(poeAccount)
        .where(eq(poeAccount.userId, session.user.id))
        .limit(1);

    if (!account) return { error: "Poe API key missing" };

    const poeVideoId = parsePoeVideoIdFromMetadata(row.metadataJson);
    if (!poeVideoId) {
        const [current] = await db
            .select({
                status: videoShare.status,
                metadataJson: videoShare.metadataJson,
            })
            .from(videoShare)
            .where(eq(videoShare.id, shareId))
            .limit(1);
        return {
            status: current?.status,
            metadataJson: current?.metadataJson ?? null,
        };
    }

    let data: Video;
    try {
        const client = poeOpenAI(account.apiKey);
        data = await client.videos.retrieve(poeVideoId);
    } catch (err) {
        return { error: poeSdkErrorMessage(err) };
    }

    const status = data.status;
    const metadataJson = JSON.stringify(data);
    const errorMessage =
        status === "failed"
            ? (data.error?.message ?? "Video generation failed")
            : null;

    await db
        .update(videoShare)
        .set({
            status,
            metadataJson,
            errorMessage,
            updatedAt: new Date(),
        })
        .where(eq(videoShare.id, shareId));

    revalidatePath("/video-ai");
    revalidatePath(`/video-ai/${row.token}`);

    const taskLinks = await db
        .select({ studioTaskId: studioSolution.studioTaskId })
        .from(studioSolution)
        .where(eq(studioSolution.videoShareId, shareId));
    for (const { studioTaskId: sid } of taskLinks) {
        revalidatePath(`/studio/${sid}`);
    }

    return { status, metadataJson };
};

export const revokeVideoShare = async (id: string): Promise<ActionResult> => {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) return { error: "Unauthorized" };

    const [owned] = await db
        .select({ id: videoShare.id })
        .from(videoShare)
        .where(
            and(eq(videoShare.id, id), eq(videoShare.userId, session.user.id))
        )
        .limit(1);

    if (!owned) {
        return { error: "Share not found" };
    }

    const taskLinks = await db
        .select({ studioTaskId: studioSolution.studioTaskId })
        .from(studioSolution)
        .where(eq(studioSolution.videoShareId, id));

    await db.delete(videoShare).where(eq(videoShare.id, id));

    for (const { studioTaskId: sid } of taskLinks) {
        revalidatePath(`/studio/${sid}`);
    }
    revalidatePath("/video-ai");
    return {};
};
