import { Clock } from "lucide-react";

import { notFound } from "next/navigation";

import { getLlmShareByToken } from "@/app/llm/actions";

import { VerifyGeneration } from "@/components/llm/VerifyGeneration";

import { shortenDisplayName } from "@/lib/helper";

const LlmSharePage = async ({
    params,
}: {
    params: Promise<{ token: string }>;
}) => {
    const { token } = await params;

    const record = await getLlmShareByToken(token);

    if (!record) notFound();

    const expired = new Date() > record.expiresAt;

    if (expired) {
        return (
            <div className="mx-auto max-w-xl px-4 py-16">
                <div className="flex flex-col items-center gap-4 py-24 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
                        <Clock className="h-6 w-6 text-red-500" />
                    </div>
                    <h1 className="section-title text-xl">Link expired</h1>
                    <p className="text-ink-muted text-sm">
                        This shared response is no longer available.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-xl px-4 py-16">
            <div className="mb-8">
                <h1 className="section-title text-2xl">Shared LLM Response</h1>
                <p className="text-ink-muted mt-1 text-sm">
                    Shared by{" "}
                    <span className="text-ink font-medium">
                        {shortenDisplayName(record.userName!).text}
                    </span>
                </p>
                <p className="text-ink-soft mt-0.5 text-xs">
                    Available until{" "}
                    {record.expiresAt.toLocaleString("en-GB", {
                        dateStyle: "medium",
                        timeStyle: "short",
                    })}
                </p>
            </div>

            {record.prompt && (
                <div className="poster-card mb-6 rounded-sm p-5">
                    <h2 className="text-ink-soft mb-2 text-xs font-medium tracking-wide uppercase">
                        Prompt
                    </h2>
                    <p className="text-ink text-sm whitespace-pre-wrap">
                        {record.prompt}
                    </p>
                </div>
            )}

            {record.response && (
                <div className="poster-card bg-bg rounded-sm p-5">
                    <h2 className="text-ink-soft mb-2 text-xs font-medium tracking-wide uppercase">
                        Response
                    </h2>
                    <div className="text-ink text-sm leading-relaxed whitespace-pre-wrap">
                        {record.response}
                    </div>
                </div>
            )}

            {record.generationId && (
                <div className="flex justify-end">
                    <VerifyGeneration token={token} />
                </div>
            )}
        </div>
    );
};

export default LlmSharePage;
