import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { getForumThreadWithReplies } from "@/app/forum/actions";

import { SignInButton } from "@/components/SignInButton";
import { ReplyForm } from "@/components/forum/ReplyForm";
import { ReplyLlmEmbed } from "@/components/forum/ReplyLlmEmbed";
import { ReviewReplyForm } from "@/components/forum/ReviewReplyForm";

import { auth } from "@/lib/auth";
import { shortenDisplayName } from "@/lib/helper";

const ForumThreadPage = async ({
    params,
}: {
    params: Promise<{ id: string }>;
}) => {
    const { id } = await params;

    const session = await auth.api.getSession({
        headers: await headers(),
    });

    const data = await getForumThreadWithReplies(id);
    if (!data) notFound();

    const { thread, replies } = data;
    const { title, author, userId: threadUserId } = thread;

    return (
        <div className="mx-auto max-w-5xl px-6 py-12">
            <div className="mb-8">
                <h1 className="text-ink mb-2 text-2xl font-bold">{title}</h1>
                <div className="text-ink-muted text-sm">
                    by {shortenDisplayName(author!).text}
                </div>
            </div>

            <h2 className="text-ink mb-4 text-lg font-semibold">
                Replies ({replies.length})
            </h2>

            {replies.map(
                ({
                    id: forumReplyId,
                    author,
                    replyLlmId,
                    llmJoinId,
                    llmJoinToken,
                    llmJoinExpiresAt,
                    llmJoinCreatedAt,
                    llmJoinUserId,
                    llmJoinPrompt,
                    llmJoinResponse,
                    llmJoinModel,
                    llmJoinGenerationId,
                    llmJoinForumThreadId,
                    body,
                    reviewScore,
                    reviews,
                    authorHasReviewed,
                }) => {
                    const hasLlm =
                        replyLlmId != null &&
                        llmJoinId != null &&
                        llmJoinToken != null &&
                        llmJoinCreatedAt != null;

                    const llmRow = hasLlm
                        ? {
                              id: llmJoinId!,
                              token: llmJoinToken!,
                              userId: llmJoinUserId!,
                              expiresAt: llmJoinExpiresAt?.toISOString() ?? null,
                              prompt: llmJoinPrompt,
                              response: llmJoinResponse,
                              model: llmJoinModel,
                              generationId: llmJoinGenerationId,
                              forumThreadId: llmJoinForumThreadId,
                              createdAt: llmJoinCreatedAt!.toISOString(),
                          }
                        : null;

                    return (
                        <div
                            key={forumReplyId}
                            className="poster-card mb-4 rounded-2xl p-6"
                        >
                            <div className="flex items-start justify-between gap-3">
                                {llmRow ? (
                                    <div className="min-w-0 flex-1">
                                        <ReplyLlmEmbed
                                            row={llmRow}
                                            currentUserId={session?.user.id}
                                        />
                                    </div>
                                ) : (
                                    <div className="text-ink min-w-0 flex-1 whitespace-pre-wrap">
                                        {body}
                                    </div>
                                )}
                                {reviewScore != null && (
                                    <span
                                        className="text-clay ml-2 shrink-0 font-mono text-sm"
                                        title="Author's score for this reply"
                                    >
                                        &#9733;{" "}
                                        {Number.isInteger(reviewScore)
                                            ? reviewScore
                                            : reviewScore.toFixed(1)}
                                    </span>
                                )}
                            </div>
                            <div className="text-ink-muted mt-2 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-xs">
                                <span>
                                    by {shortenDisplayName(author!).text}
                                </span>
                                {llmJoinModel?.trim() && (
                                    <>
                                        <span
                                            className="text-ink-soft"
                                            aria-hidden
                                        >
                                            ·
                                        </span>
                                        <span className="text-ink-soft font-mono">
                                            {llmJoinModel.trim()}
                                        </span>
                                    </>
                                )}
                            </div>
                            {reviews.some((r) => r.reviewBody?.trim()) && (
                                <ul className="border-border mt-3 space-y-3 border-t pt-3">
                                    {reviews
                                        .filter((r) => r.reviewBody?.trim())
                                        .map((r) => (
                                            <li
                                                key={r.id}
                                                className="text-ink-muted text-sm"
                                            >
                                                <div className="text-xs">
                                                    {shortenDisplayName(
                                                        r.reviewerName ?? ""
                                                    ).text}
                                                </div>
                                                <p className="mt-1 italic">
                                                    &ldquo;{r.reviewBody}
                                                    &rdquo;
                                                </p>
                                            </li>
                                        ))}
                                </ul>
                            )}
                            {session?.user.id === threadUserId &&
                                !authorHasReviewed && (
                                <div className="border-border mt-4 border-t pt-4">
                                    <ReviewReplyForm
                                        forumReplyId={forumReplyId}
                                    />
                                </div>
                            )}
                        </div>
                    );
                }
            )}

            {session ? (
                <ReplyForm forumThreadId={id} threadTitle={title} />
            ) : (
                <div className="mt-6">
                    <p className="text-ink-muted mb-3 text-sm">
                        Sign in to post a reply.
                    </p>
                    <SignInButton callbackURL={`/forum/${id}`} />
                </div>
            )}
        </div>
    );
};

export default ForumThreadPage;
