import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { getStudioTaskWithSolutions } from "@/app/studio/actions";

import { SignInButton } from "@/components/SignInButton";
import { ReviewSolutionForm } from "@/components/studio/ReviewSolutionForm";
import { StudioSolutionForm } from "@/components/studio/StudioSolutionForm";
import { VideoShareSolutionEmbed } from "@/components/studio/VideoShareSolutionEmbed";

import { auth } from "@/lib/auth";
import { shortenDisplayName } from "@/lib/helper";

const StudioTaskDetailPage = async ({
    params,
}: {
    params: Promise<{ id: string }>;
}) => {
    const { id } = await params;

    const session = await auth.api.getSession({
        headers: await headers(),
    });

    const data = await getStudioTaskWithSolutions(id, session?.user.id);
    if (!data) notFound();

    const {
        task: { id: studioTaskId, title, author, models },
        solutions,
    } = data;

    return (
        <div className="mx-auto max-w-5xl px-6 py-12">
            <div className="mb-8">
                <h1 className="text-ink text-2xl font-bold">{title}</h1>
                <div className="mb-2 flex items-center gap-2">
                    <div className="text-clay font-medium">Models</div>
                    <div className="text-ink-soft whitespace-pre-wrap">
                        {models}
                    </div>
                </div>
                <div className="text-ink-muted text-sm">
                    by {shortenDisplayName(author!).text}
                </div>
            </div>

            <h2 className="text-ink mb-4 text-lg font-semibold">
                Solutions ({solutions.length})
            </h2>

            {solutions.map(
                ({
                    id: studioSolutionId,
                    author,
                    reviewScore,
                    reviews,
                    currentUserHasReviewed,
                    videoShare,
                }) => (
                    <div
                        key={studioSolutionId}
                        className="poster-card mb-4 rounded-2xl p-6"
                    >
                        <div className="flex items-start justify-between gap-3">
                            {videoShare ? (
                                <div className="min-w-0 flex-1">
                                    <VideoShareSolutionEmbed
                                        videoShare={videoShare}
                                        currentUserId={session?.user.id}
                                    />
                                </div>
                            ) : (
                                <div className="text-ink-muted min-w-0 flex-1 text-sm">
                                    —
                                </div>
                            )}
                            {reviewScore != null && (
                                <span
                                    className="text-clay ml-2 shrink-0 font-mono text-sm"
                                    title="Average of all review scores"
                                >
                                    &#9733;{" "}
                                    {Number.isInteger(reviewScore)
                                        ? reviewScore
                                        : reviewScore.toFixed(1)}
                                </span>
                            )}
                        </div>
                        <div className="text-ink-muted mt-2 text-xs">
                            by {shortenDisplayName(author!).text}
                        </div>
                        {reviews.length > 0 && (
                            <ul className="border-border mt-3 space-y-3 border-t pt-3">
                                {reviews.map((r) => (
                                    <li
                                        key={r.id}
                                        className="text-ink-muted text-sm"
                                    >
                                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                                            <span className="text-xs">
                                                {shortenDisplayName(
                                                    r.reviewerName ?? ""
                                                ).text}
                                            </span>
                                            <span className="text-clay shrink-0 font-mono text-xs">
                                                &#9733; {r.score}
                                            </span>
                                        </div>
                                        {r.reviewBody && (
                                            <p className="mt-1 italic">
                                                &ldquo;{r.reviewBody}
                                                &rdquo;
                                            </p>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                        {session && !currentUserHasReviewed && (
                            <div className="border-border mt-4 border-t pt-4">
                                <ReviewSolutionForm
                                    studioSolutionId={studioSolutionId}
                                />
                            </div>
                        )}
                    </div>
                )
            )}

            {session ? (
                <StudioSolutionForm
                    studioTaskId={studioTaskId}
                    studioTaskTitle={title}
                />
            ) : (
                <div className="mt-6">
                    <p className="text-ink-muted mb-3 text-sm">
                        Sign in to submit a solution.
                    </p>
                    <SignInButton callbackURL={`/studio/${id}`} />
                </div>
            )}
        </div>
    );
};

export default StudioTaskDetailPage;
