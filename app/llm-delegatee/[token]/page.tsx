import { db } from "@/db";
import { eq } from "drizzle-orm";
import { Clock } from "lucide-react";

import { notFound } from "next/navigation";

import { VerifyGeneration } from "@/components/llm-delegation/VerifyGeneration";

import { delegation, user } from "@/db/schema";

const LlmDelegateeViewPage = async ({
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
            prompt: delegation.prompt,
            response: delegation.response,
            generationId: delegation.generationId,
            userName: user.name,
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
                        <Clock className="h-6 w-6 text-red-500" />
                    </div>
                    <h1 className="text-xl font-semibold tracking-tight">
                        Link expired
                    </h1>
                    <p className="text-sm text-gray-500">
                        This shared response is no longer available.
                    </p>
                </div>
            </main>
        );
    }

    return (
        <main className="mx-auto max-w-xl px-4 py-16">
            <div className="mb-8">
                <h1 className="text-2xl font-semibold tracking-tight">
                    Shared LLM Response
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                    Shared by{" "}
                    <span className="font-medium text-gray-700">
                        {record.userName}
                    </span>
                </p>
                <p className="mt-0.5 text-xs text-gray-400">
                    Available until{" "}
                    {record.expiresAt.toLocaleString("en-GB", {
                        dateStyle: "medium",
                        timeStyle: "short",
                    })}
                </p>
            </div>

            {record.prompt && (
                <div className="mb-6 rounded-xl border border-gray-200 p-5">
                    <h2 className="mb-2 text-xs font-medium tracking-wide text-gray-400 uppercase">
                        Prompt
                    </h2>
                    <p className="text-sm whitespace-pre-wrap text-gray-700">
                        {record.prompt}
                    </p>
                </div>
            )}

            {record.response && (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                    <h2 className="mb-2 text-xs font-medium tracking-wide text-gray-400 uppercase">
                        Response
                    </h2>
                    <div className="text-sm leading-relaxed whitespace-pre-wrap text-gray-800">
                        {record.response}
                    </div>
                </div>
            )}

            {record.generationId && (
                <div className="flex justify-end">
                    <VerifyGeneration token={token} />
                </div>
            )}
        </main>
    );
};

export default LlmDelegateeViewPage;
