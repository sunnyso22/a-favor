"use server";

import { and, asc, desc, eq, inArray } from "drizzle-orm";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import type { VideoShareEmbedRow } from "@/components/studio/VideoShareSolutionEmbed";

import { isAllowedTaskModel } from "@/config/ai-models";

import { db } from "@/drizzle";
import {
    studioSolution,
    studioSolutionReview,
    studioTask,
    user,
    videoShare,
} from "@/drizzle/schema";

import { auth } from "@/lib/auth";

type ActionResult = { error?: string };

export type StudioTaskListItem = {
    id: string;
    title: string;
    author: string | null;
    createdAt: Date;
};

export const listStudioTasks = async (): Promise<StudioTaskListItem[]> =>
    db
        .select({
            id: studioTask.id,
            title: studioTask.title,
            author: user.name,
            createdAt: studioTask.createdAt,
        })
        .from(studioTask)
        .innerJoin(user, eq(studioTask.userId, user.id))
        .orderBy(desc(studioTask.createdAt));

export type StudioTaskDetail = {
    id: string;
    userId: string;
    title: string;
    models: string;
    author: string | null;
};

export type StudioSolutionReviewListItem = {
    id: string;
    score: number;
    reviewBody: string | null;
    reviewerName: string | null;
    createdAt: Date;
};

export type StudioSolutionForTask = {
    id: string;
    author: string | null;
    reviewScore: number | null;
    reviews: StudioSolutionReviewListItem[];
    /** True when the task author has left a review for this solution. */
    authorHasReviewed: boolean;
    videoShare: VideoShareEmbedRow | null;
};

export const getStudioTaskWithSolutions = async (
    id: string
): Promise<{
    task: StudioTaskDetail;
    solutions: StudioSolutionForTask[];
} | null> => {
    const [t] = await db
        .select({
            id: studioTask.id,
            userId: studioTask.userId,
            title: studioTask.title,
            models: studioTask.models,
            author: user.name,
        })
        .from(studioTask)
        .innerJoin(user, eq(studioTask.userId, user.id))
        .where(eq(studioTask.id, id))
        .limit(1);

    if (!t) return null;

    const solutionRows = await db
        .select({
            id: studioSolution.id,
            author: user.name,
            legacyReviewScore: studioSolution.reviewScore,
            legacyReviewBody: studioSolution.reviewBody,
            legacyReviewedAt: studioSolution.reviewedAt,
            videoShareId: studioSolution.videoShareId,
            vsId: videoShare.id,
            vsToken: videoShare.token,
            vsUserId: videoShare.userId,
            vsExpiresAt: videoShare.expiresAt,
            vsPrompt: videoShare.prompt,
            vsModel: videoShare.model,
            vsStatus: videoShare.status,
            vsMetadataJson: videoShare.metadataJson,
            vsErrorMessage: videoShare.errorMessage,
            vsCreatedAt: videoShare.createdAt,
        })
        .from(studioSolution)
        .innerJoin(user, eq(studioSolution.userId, user.id))
        .leftJoin(videoShare, eq(studioSolution.videoShareId, videoShare.id))
        .where(eq(studioSolution.studioTaskId, id))
        .orderBy(asc(studioSolution.createdAt));

    const solutionIds = solutionRows.map((s) => s.id);

    const authorReviewRows =
        solutionIds.length > 0
            ? await db
                  .select({
                      id: studioSolutionReview.id,
                      studioSolutionId: studioSolutionReview.studioSolutionId,
                      score: studioSolutionReview.score,
                      reviewBody: studioSolutionReview.reviewBody,
                      createdAt: studioSolutionReview.createdAt,
                      reviewerName: user.name,
                  })
                  .from(studioSolutionReview)
                  .innerJoin(user, eq(studioSolutionReview.userId, user.id))
                  .where(
                      and(
                          eq(studioSolutionReview.userId, t.userId),
                          inArray(
                              studioSolutionReview.studioSolutionId,
                              solutionIds
                          )
                      )
                  )
                  .orderBy(asc(studioSolutionReview.createdAt))
            : [];

    const authorReviewBySolution = new Map<
        string,
        StudioSolutionReviewListItem
    >();
    for (const r of authorReviewRows) {
        authorReviewBySolution.set(r.studioSolutionId, {
            id: r.id,
            score: r.score,
            reviewBody: r.reviewBody?.trim() || null,
            reviewerName: r.reviewerName,
            createdAt: r.createdAt,
        });
    }

    const solutions: StudioSolutionForTask[] = solutionRows.map((s) => {
        const hasVideoShare =
            s.videoShareId != null &&
            s.vsId != null &&
            s.vsToken != null &&
            s.vsCreatedAt != null;

        const videoShareEmbed: VideoShareEmbedRow | null = hasVideoShare
            ? {
                  id: s.vsId!,
                  token: s.vsToken!,
                  userId: s.vsUserId!,
                  expiresAt: s.vsExpiresAt,
                  prompt: s.vsPrompt,
                  model: s.vsModel!,
                  status: s.vsStatus!,
                  metadataJson: s.vsMetadataJson,
                  errorMessage: s.vsErrorMessage,
                  createdAt: s.vsCreatedAt!,
              }
            : null;

        const authorTableReview = authorReviewBySolution.get(s.id);
        const legacy =
            s.legacyReviewedAt != null && s.legacyReviewScore != null;

        const reviewScore: number | null = authorTableReview
            ? authorTableReview.score
            : legacy
              ? s.legacyReviewScore
              : null;

        const reviews: StudioSolutionReviewListItem[] = [];
        if (authorTableReview) {
            reviews.push(authorTableReview);
        } else if (legacy) {
            reviews.push({
                id: `legacy:${s.id}`,
                score: s.legacyReviewScore!,
                reviewBody: s.legacyReviewBody?.trim() || null,
                reviewerName: t.author,
                createdAt: s.legacyReviewedAt!,
            });
        }

        const authorHasReviewed = authorTableReview != null || legacy;

        return {
            id: s.id,
            author: s.author,
            reviewScore,
            reviews,
            authorHasReviewed,
            videoShare: videoShareEmbed,
        };
    });

    return { task: t, solutions };
};

export const createStudioTask = async (
    title: string,
    model: string
): Promise<ActionResult> => {
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    if (!session) return { error: "Unauthorized" };
    const trimmed = model?.trim() ?? "";
    if (!title?.trim() || !isAllowedTaskModel(trimmed)) {
        return { error: "Title and a valid model are required" };
    }

    await db.insert(studioTask).values({
        id: crypto.randomUUID(),
        userId: session.user.id,
        title: title.trim(),
        models: trimmed,
    });

    revalidatePath("/studio");
    return {};
};

export const reviewSolution = async (
    studioSolutionId: string,
    score: number,
    reviewText: string
): Promise<ActionResult> => {
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    if (!session) return { error: "Unauthorized" };

    const [sol] = await db
        .select()
        .from(studioSolution)
        .where(eq(studioSolution.id, studioSolutionId))
        .limit(1);

    if (!sol) return { error: "Solution not found" };

    const [taskRow] = await db
        .select({ userId: studioTask.userId })
        .from(studioTask)
        .where(eq(studioTask.id, sol.studioTaskId))
        .limit(1);

    if (!taskRow) return { error: "Studio task not found" };

    if (taskRow.userId !== session.user.id) {
        return { error: "Only the task author can review solutions" };
    }

    if (sol.reviewedAt != null && sol.reviewScore != null) {
        return { error: "You already reviewed this solution" };
    }

    const [existing] = await db
        .select({ id: studioSolutionReview.id })
        .from(studioSolutionReview)
        .where(
            and(
                eq(studioSolutionReview.studioSolutionId, studioSolutionId),
                eq(studioSolutionReview.userId, session.user.id)
            )
        )
        .limit(1);

    if (existing) return { error: "You already reviewed this solution" };

    const clampedScore = Math.min(5, Math.max(1, score));

    await db.insert(studioSolutionReview).values({
        id: crypto.randomUUID(),
        studioSolutionId,
        userId: session.user.id,
        score: clampedScore,
        reviewBody: reviewText.trim() || null,
    });

    revalidatePath(`/studio/${sol.studioTaskId}`);
    return {};
};
