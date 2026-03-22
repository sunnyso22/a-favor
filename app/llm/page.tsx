import { Lock } from "lucide-react";

import { getLlmDashboardData } from "@/app/llm/actions";

import { SignInButton } from "@/components/SignInButton";
import { ConnectOpenRouter } from "@/components/llm/ConnectOpenRouter";
import { LlmDashboard } from "@/components/llm/LlmDashboard";
import { OpenRouterCallback } from "@/components/llm/OpenRouterCallback";

const LlmPage = async ({
    searchParams,
}: {
    searchParams: Promise<{
        code?: string;
        prompt?: string;
        forumThreadId?: string;
    }>;
}) => {
    const { code, prompt: initialPrompt, forumThreadId } = await searchParams;

    const dashboard = await getLlmDashboardData();

    if (dashboard.status === "unauthenticated") {
        return (
            <div className="mx-auto flex min-h-[calc(100vh-12rem)] max-w-xl items-center justify-center px-4">
                <div className="flex flex-col items-center gap-6 text-center">
                    <div className="bg-surface flex h-14 w-14 items-center justify-center rounded-full">
                        <Lock className="text-ink-soft h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="section-title text-2xl">
                            Sign in for LLM sharing
                        </h1>
                        <p className="text-ink-muted mt-2 text-sm">
                            Sign in to create shareable links that use your
                            OpenRouter access.
                        </p>
                    </div>
                    <SignInButton callbackURL="/llm" />
                </div>
            </div>
        );
    }

    if (code) {
        return (
            <OpenRouterCallback
                code={code}
                prompt={initialPrompt}
                forumThreadId={forumThreadId}
            />
        );
    }

    if (dashboard.status === "needs_openrouter") {
        return (
            <ConnectOpenRouter
                prompt={initialPrompt}
                forumThreadId={forumThreadId}
            />
        );
    }

    return (
        <LlmDashboard
            shares={dashboard.shares}
            initialPrompt={initialPrompt}
            initialForumThreadId={forumThreadId}
        />
    );
};

export default LlmPage;
