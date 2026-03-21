import { headers } from "next/headers";
import Link from "next/link";

import { listForumThreads } from "@/app/forum/actions";

import { CreateThreadForm } from "@/components/forum/CreateThreadForm";

import { auth } from "@/lib/auth";
import { shortenDisplayName } from "@/lib/helper";

const ForumPage = async () => {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    const threads = await listForumThreads();

    return (
        <div className="mx-auto max-w-5xl px-6 py-12">
            <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
                <h1 className="section-title text-ink shrink-0 text-3xl md:text-4xl">
                    Forum
                </h1>
                {session && (
                    <div className="w-full min-w-0 lg:flex-1">
                        <CreateThreadForm />
                    </div>
                )}
            </div>

            <div className="space-y-3">
                {threads.map(({ id, title, author }) => (
                    <Link
                        key={id}
                        href={`/forum/${id}`}
                        className="poster-card hover:border-clay/50 block rounded-sm p-6 transition-colors duration-200"
                    >
                        <div className="text-ink font-semibold">{title}</div>
                        <div className="text-ink-muted mt-2 text-xs">
                            by {shortenDisplayName(author!).text}
                        </div>
                    </Link>
                ))}
                {threads.length === 0 && (
                    <div className="text-ink-muted py-8 text-center">
                        No threads yet.
                    </div>
                )}
            </div>
        </div>
    );
};

export default ForumPage;
