import { db } from "@/db";
import { eq } from "drizzle-orm";

import { notFound } from "next/navigation";

import TweetComposer from "@/components/TweetComposer";

import { delegation, user } from "@/db/schema";

const DelegateePostPage = async ({
    params,
}: {
    params: Promise<{ token: string }>;
}) => {
    const { token } = await params;

    const [record] = await db
        .select({
            id: delegation.id,
            token: delegation.token,
            expiresAt: delegation.expiresAt,
            label: delegation.label,
            userName: user.name,
            userImage: user.image,
        })
        .from(delegation)
        .innerJoin(user, eq(delegation.userId, user.id))
        .where(eq(delegation.token, token))
        .limit(1);

    if (!record) notFound();

    const expired = new Date() > record.expiresAt;

    if (expired) {
        return (
            <main className="mx-auto max-w-xl px-4 py-16">
                <div className="flex flex-col items-center gap-4 py-24 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
                        <svg
                            className="h-6 w-6 text-red-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                            />
                        </svg>
                    </div>
                    <h1 className="text-xl font-semibold tracking-tight">
                        Link expired
                    </h1>
                    <p className="text-sm text-gray-500">
                        This delegation link is no longer valid.
                    </p>
                </div>
            </main>
        );
    }

    return (
        <main className="mx-auto max-w-xl px-4 py-16">
            <div className="mb-8">
                <h1 className="text-2xl font-semibold tracking-tight">
                    Post a tweet
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                    Posting on behalf of{" "}
                    <span className="font-medium text-gray-700">
                        {record.userName}
                    </span>
                    {record.label && (
                        <span className="text-gray-400">
                            {" "}
                            &middot; {record.label}
                        </span>
                    )}
                </p>
                <p className="mt-0.5 text-xs text-gray-400">
                    Link expires{" "}
                    {record.expiresAt.toLocaleString("en-US", {
                        dateStyle: "medium",
                        timeStyle: "short",
                    })}
                </p>
            </div>

            <TweetComposer token={record.token} />
        </main>
    );
};

export default DelegateePostPage;
