"use server";

import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { db } from "@/drizzle";
import {
    forumReply,
    forumReplyReview,
    forumThread,
    llm,
    user,
} from "@/drizzle/schema";

import { auth } from "@/lib/auth";

type ActionResult = { error?: string };

export type ForumThreadListItem = {
    id: string;
    title: string;
    author: string | null;
    createdAt: Date;
};

export const listForumThreads = async (): Promise<ForumThreadListItem[]> =>
    db
        .select({
            id: forumThread.id,
            title: forumThread.title,
            author: user.name,
            createdAt: forumThread.createdAt,
        })
        .from(forumThread)
        .innerJoin(user, eq(forumThread.userId, user.id))
        .orderBy(desc(forumThread.createdAt));

export type ForumThreadDetail = {
    id: string;
    userId: string;
    title: string;
    author: string | null;
};

export type ForumReplyReviewListItem = {
    id: string;
    score: number;
    reviewBody: string | null;
    reviewerName: string | null;
    createdAt: Date;
};

export type ForumReplyWithAuthor = {
    id: string;
    replyUserId: string;
    body: string;
    author: string | null;
    reviewScore: number | null;
    reviews: ForumReplyReviewListItem[];
    currentUserHasReviewed: boolean;
    replyLlmId: string | null;
    llmJoinId: string | null;
    llmJoinToken: string | null;
    llmJoinUserId: string | null;
    llmJoinPrompt: string | null;
    llmJoinResponse: string | null;
    llmJoinGenerationId: string | null;
    llmJoinForumThreadId: string | null;
    llmJoinExpiresAt: Date | null;
    llmJoinCreatedAt: Date | null;
};

export const getForumThreadWithReplies = async (
    id: string,
    viewerUserId?: string
): Promise<{
    thread: ForumThreadDetail;
    replies: ForumReplyWithAuthor[];
} | null> => {
    const [t] = await db
        .select({
            id: forumThread.id,
            userId: forumThread.userId,
            title: forumThread.title,
            author: user.name,
        })
        .from(forumThread)
        .innerJoin(user, eq(forumThread.userId, user.id))
        .where(eq(forumThread.id, id))
        .limit(1);

    if (!t) return null;

    const replyRows = await db
        .select({
            id: forumReply.id,
            replyUserId: forumReply.userId,
            body: forumReply.body,
            author: user.name,
            legacyReviewScore: forumReply.reviewScore,
            legacyReviewBody: forumReply.reviewBody,
            legacyReviewedAt: forumReply.reviewedAt,
            replyLlmId: forumReply.llmId,
            llmJoinId: llm.id,
            llmJoinToken: llm.token,
            llmJoinUserId: llm.userId,
            llmJoinPrompt: llm.prompt,
            llmJoinResponse: llm.response,
            llmJoinGenerationId: llm.generationId,
            llmJoinForumThreadId: llm.forumThreadId,
            llmJoinExpiresAt: llm.expiresAt,
            llmJoinCreatedAt: llm.createdAt,
        })
        .from(forumReply)
        .innerJoin(user, eq(forumReply.userId, user.id))
        .leftJoin(llm, eq(forumReply.llmId, llm.id))
        .where(eq(forumReply.forumThreadId, id))
        .orderBy(asc(forumReply.createdAt));

    const replyIds = replyRows.map((r) => r.id);

    const aggregates =
        replyIds.length > 0
            ? await db
                  .select({
                      forumReplyId: forumReplyReview.forumReplyId,
                      avgScore: sql<number>`avg(${forumReplyReview.score}::double precision)`,
                      cnt: sql<number>`count(*)::int`,
                  })
                  .from(forumReplyReview)
                  .where(inArray(forumReplyReview.forumReplyId, replyIds))
                  .groupBy(forumReplyReview.forumReplyId)
            : [];

    const aggByReply = new Map(
        aggregates.map((a) => [a.forumReplyId, a] as const)
    );

    const allReviewRows =
        replyIds.length > 0
            ? await db
                  .select({
                      id: forumReplyReview.id,
                      forumReplyId: forumReplyReview.forumReplyId,
                      score: forumReplyReview.score,
                      reviewBody: forumReplyReview.reviewBody,
                      createdAt: forumReplyReview.createdAt,
                      reviewerName: user.name,
                  })
                  .from(forumReplyReview)
                  .innerJoin(user, eq(forumReplyReview.userId, user.id))
                  .where(inArray(forumReplyReview.forumReplyId, replyIds))
                  .orderBy(asc(forumReplyReview.createdAt))
            : [];

    const reviewsByReply = new Map<string, ForumReplyReviewListItem[]>();
    for (const r of allReviewRows) {
        const list = reviewsByReply.get(r.forumReplyId) ?? [];
        list.push({
            id: r.id,
            score: r.score,
            reviewBody: r.reviewBody?.trim() || null,
            reviewerName: r.reviewerName,
            createdAt: r.createdAt,
        });
        reviewsByReply.set(r.forumReplyId, list);
    }

    const viewerReviewedIds = new Set<string>();
    if (viewerUserId && replyIds.length > 0) {
        const mine = await db
            .select({ forumReplyId: forumReplyReview.forumReplyId })
            .from(forumReplyReview)
            .where(
                and(
                    eq(forumReplyReview.userId, viewerUserId),
                    inArray(forumReplyReview.forumReplyId, replyIds)
                )
            );
        for (const r of mine) viewerReviewedIds.add(r.forumReplyId);
    }

    const roundAvg = (x: number) => Math.round(x * 10) / 10;

    const replies: ForumReplyWithAuthor[] = replyRows.map((row) => {
        const agg = aggByReply.get(row.id);
        const tableCount = Number(agg?.cnt ?? 0);
        const tableAvg = tableCount > 0 ? Number(agg?.avgScore) : NaN;
        const legacy =
            row.legacyReviewedAt != null && row.legacyReviewScore != null;

        let reviewScore: number | null = null;
        if (tableCount > 0 && legacy) {
            reviewScore = roundAvg(
                (tableAvg * tableCount + row.legacyReviewScore!) /
                    (tableCount + 1)
            );
        } else if (tableCount > 0 && Number.isFinite(tableAvg)) {
            reviewScore = roundAvg(tableAvg);
        } else if (legacy) {
            reviewScore = row.legacyReviewScore;
        }

        let reviews = [...(reviewsByReply.get(row.id) ?? [])];
        if (legacy && tableCount === 0) {
            reviews = [
                {
                    id: `legacy:${row.id}`,
                    score: row.legacyReviewScore!,
                    reviewBody: row.legacyReviewBody?.trim() || null,
                    reviewerName: t.author,
                    createdAt: row.legacyReviewedAt!,
                },
                ...reviews,
            ];
        }

        const currentUserHasReviewed =
            viewerReviewedIds.has(row.id) ||
            (!!viewerUserId && viewerUserId === t.userId && legacy);

        return {
            id: row.id,
            replyUserId: row.replyUserId,
            body: row.body,
            author: row.author,
            reviewScore,
            reviews,
            currentUserHasReviewed,
            replyLlmId: row.replyLlmId,
            llmJoinId: row.llmJoinId,
            llmJoinToken: row.llmJoinToken,
            llmJoinUserId: row.llmJoinUserId,
            llmJoinPrompt: row.llmJoinPrompt,
            llmJoinResponse: row.llmJoinResponse,
            llmJoinGenerationId: row.llmJoinGenerationId,
            llmJoinForumThreadId: row.llmJoinForumThreadId,
            llmJoinExpiresAt: row.llmJoinExpiresAt,
            llmJoinCreatedAt: row.llmJoinCreatedAt,
        };
    });

    return { thread: t, replies };
};

export const createThread = async (title: string): Promise<ActionResult> => {
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    if (!session) return { error: "Unauthorized" };
    if (!title?.trim()) return { error: "Title is required" };

    await db.insert(forumThread).values({
        id: crypto.randomUUID(),
        userId: session.user.id,
        title: title.trim(),
    });

    revalidatePath("/forum");
    return {};
};

export const addReply = async (
    forumThreadId: string,
    body: string
): Promise<ActionResult> => {
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    if (!session) return { error: "Unauthorized" };
    if (!body?.trim()) return { error: "Reply body is required" };

    const [t] = await db
        .select({ id: forumThread.id })
        .from(forumThread)
        .where(eq(forumThread.id, forumThreadId))
        .limit(1);

    if (!t) return { error: "Thread not found" };

    await db.insert(forumReply).values({
        id: crypto.randomUUID(),
        forumThreadId,
        userId: session.user.id,
        body: body.trim(),
    });

    revalidatePath(`/forum/${forumThreadId}`);
    return {};
};

export const reviewReply = async (
    replyId: string,
    score: number,
    reviewText: string
): Promise<ActionResult> => {
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    if (!session) return { error: "Unauthorized" };

    const [rep] = await db
        .select()
        .from(forumReply)
        .where(eq(forumReply.id, replyId))
        .limit(1);

    if (!rep) return { error: "Reply not found" };

    const [threadRow] = await db
        .select({ userId: forumThread.userId })
        .from(forumThread)
        .where(eq(forumThread.id, rep.forumThreadId))
        .limit(1);

    if (rep.reviewedAt != null && threadRow?.userId === session.user.id) {
        return { error: "You already reviewed this reply" };
    }

    const [existing] = await db
        .select({ id: forumReplyReview.id })
        .from(forumReplyReview)
        .where(
            and(
                eq(forumReplyReview.forumReplyId, replyId),
                eq(forumReplyReview.userId, session.user.id)
            )
        )
        .limit(1);

    if (existing) return { error: "You already reviewed this reply" };

    const clampedScore = Math.min(5, Math.max(1, score));

    await db.insert(forumReplyReview).values({
        id: crypto.randomUUID(),
        forumReplyId: replyId,
        userId: session.user.id,
        score: clampedScore,
        reviewBody: reviewText.trim() || null,
    });

    revalidatePath(`/forum/${rep.forumThreadId}`);
    return {};
};
