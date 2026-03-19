"use client";

import { authClient } from "@/lib/auth-client";
import { Lock } from "lucide-react";

export const SignInPrompt = () => (
    <main className="mx-auto flex min-h-[calc(100vh-65px)] max-w-xl items-center justify-center px-4">
        <div className="flex flex-col items-center gap-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                <Lock className="h-6 w-6 text-gray-500" />
            </div>
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                    Sign in to manage LLM delegations
                </h1>
                <p className="mt-2 text-sm text-gray-500">
                    Sign in to create shareable links that let others use your
                    LLM access.
                </p>
            </div>
            <button
                onClick={() =>
                    authClient.signIn.social({
                        provider: "github",
                        callbackURL: "/llm-delegation",
                    })
                }
                className="cursor-pointer rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-gray-800 focus:ring-2 focus:ring-gray-500/20 focus:outline-none"
            >
                Sign in with GitHub
            </button>
        </div>
    </main>
);
