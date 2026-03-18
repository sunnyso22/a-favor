"use client";

import { useCallback, useEffect, useState } from "react";

import { authClient } from "@/lib/auth-client";

type Delegation = {
    id: string;
    token: string;
    expiresAt: string;
    label: string | null;
    prompt: string | null;
    response: string | null;
    createdAt: string;
};

function generateCodeVerifier() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}

async function computeCodeChallenge(verifier: string) {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}

const LlmDelegationPage = () => {
    const { data: session, isPending: sessionLoading } =
        authClient.useSession();
    const [openRouterConnected, setOpenRouterConnected] = useState<
        boolean | null
    >(null);
    const [delegations, setDelegations] = useState<Delegation[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [prompt, setPrompt] = useState("");
    const [expiresInHours, setExpiresInHours] = useState(24);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [connectingOpenRouter, setConnectingOpenRouter] = useState(false);

    const checkOpenRouterConnection = useCallback(async () => {
        try {
            const res = await fetch("/api/openrouter-auth");
            const data = await res.json();
            setOpenRouterConnected(data.connected);
        } catch {
            setOpenRouterConnected(false);
        }
    }, []);

    useEffect(() => {
        if (!session) {
            setLoading(false);
            return;
        }

        checkOpenRouterConnection();
    }, [session, checkOpenRouterConnection]);

    useEffect(() => {
        if (!session) return;

        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        if (!code) return;

        const codeVerifier = sessionStorage.getItem("openrouter_code_verifier");
        if (!codeVerifier) {
            setError("Missing code verifier. Please try connecting again.");
            window.history.replaceState({}, "", "/llm-delegation");
            return;
        }

        setConnectingOpenRouter(true);
        sessionStorage.removeItem("openrouter_code_verifier");
        window.history.replaceState({}, "", "/llm-delegation");

        fetch("/api/openrouter-auth", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code, codeVerifier }),
        })
            .then(async (res) => {
                if (!res.ok) {
                    const data = await res.json();
                    setError(data.error || "Failed to connect OpenRouter");
                    return;
                }
                setOpenRouterConnected(true);
            })
            .catch(() => setError("Failed to connect OpenRouter"))
            .finally(() => setConnectingOpenRouter(false));
    }, [session]);

    useEffect(() => {
        if (openRouterConnected) fetchDelegations();
        else setLoading(false);
    }, [openRouterConnected]);

    const fetchDelegations = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/llm-delegation");
            const data = await res.json();
            setDelegations(data.delegations ?? []);
        } catch {
            setError("Failed to load delegations");
        } finally {
            setLoading(false);
        }
    };

    const createDelegation = async () => {
        if (!prompt.trim()) {
            setError("Please enter a prompt");
            return;
        }
        setCreating(true);
        setError(null);
        try {
            const res = await fetch("/api/llm-delegation", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt: prompt.trim(),
                    expiresInHours,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error);
                return;
            }
            setPrompt("");
            await fetchDelegations();
        } catch {
            setError("Failed to create delegation");
        } finally {
            setCreating(false);
        }
    };

    const revokeDelegation = async (id: string) => {
        try {
            const res = await fetch(`/api/llm-delegation?id=${id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                setDelegations((prev) => prev.filter((d) => d.id !== id));
            }
        } catch {
            setError("Failed to revoke delegation");
        }
    };

    const disconnectOpenRouter = async () => {
        try {
            const res = await fetch("/api/openrouter-auth", {
                method: "DELETE",
            });
            if (res.ok) {
                setOpenRouterConnected(false);
                setDelegations([]);
            }
        } catch {
            setError("Failed to disconnect OpenRouter");
        }
    };

    const connectOpenRouter = async () => {
        const verifier = generateCodeVerifier();
        const challenge = await computeCodeChallenge(verifier);
        sessionStorage.setItem("openrouter_code_verifier", verifier);

        const callbackUrl = `${window.location.origin}/llm-delegation`;
        window.location.href = `https://openrouter.ai/auth?callback_url=${encodeURIComponent(callbackUrl)}&code_challenge=${challenge}&code_challenge_method=S256`;
    };

    const copyLink = (token: string, id: string) => {
        const url = `${window.location.origin}/llm-delegatee/${token}`;
        navigator.clipboard.writeText(url);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const isExpired = (expiresAt: string) => {
        return new Date() > new Date(expiresAt);
    };

    if (sessionLoading) {
        return (
            <main className="mx-auto flex min-h-[calc(100vh-65px)] max-w-xl items-center justify-center px-4">
                <div className="text-center text-sm text-gray-400">
                    Loading...
                </div>
            </main>
        );
    }

    if (!session) {
        return (
            <main className="mx-auto flex min-h-[calc(100vh-65px)] max-w-xl items-center justify-center px-4">
                <div className="flex flex-col items-center gap-6 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                        <svg
                            className="h-6 w-6 text-gray-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                            />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Sign in to manage LLM delegations
                        </h1>
                        <p className="mt-2 text-sm text-gray-500">
                            Sign in to create shareable links that let others
                            use your LLM access.
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
    }

    if (openRouterConnected === null || connectingOpenRouter) {
        return (
            <main className="mx-auto flex min-h-[calc(100vh-65px)] max-w-xl items-center justify-center px-4">
                <div className="text-center text-sm text-gray-400">
                    {connectingOpenRouter
                        ? "Connecting OpenRouter account..."
                        : "Loading..."}
                </div>
            </main>
        );
    }

    if (!openRouterConnected) {
        return (
            <main className="mx-auto flex min-h-[calc(100vh-65px)] max-w-xl items-center justify-center px-4">
                <div className="flex flex-col items-center gap-6 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-50">
                        <svg
                            className="h-6 w-6 text-purple-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
                            />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Connect your OpenRouter account
                        </h1>
                        <p className="mt-2 text-sm text-gray-500">
                            Link your OpenRouter account to enable LLM
                            delegation. This allows others to use your LLM
                            access via shareable links.
                        </p>
                    </div>
                    <button
                        onClick={connectOpenRouter}
                        className="cursor-pointer rounded-lg bg-purple-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-purple-700 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
                    >
                        Connect OpenRouter
                    </button>
                    <button
                        onClick={async () => {
                            await authClient.signOut();
                        }}
                        className="cursor-pointer text-xs text-gray-400 underline transition-colors hover:text-gray-600"
                    >
                        Sign out
                    </button>
                </div>
            </main>
        );
    }

    return (
        <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-xl px-4 py-16">
            <div className="mb-8 flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        LLM Delegation
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Ask the LLM a question and share the response via a
                        link.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={disconnectOpenRouter}
                        className="cursor-pointer rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                    >
                        Disconnect OpenRouter
                    </button>
                    <button
                        onClick={async () => {
                            await authClient.signOut();
                        }}
                        className="cursor-pointer rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
                    >
                        Sign out
                    </button>
                </div>
            </div>

            {error && (
                <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                    <button
                        onClick={() => setError(null)}
                        className="ml-2 font-medium underline"
                    >
                        dismiss
                    </button>
                </div>
            )}

            <div className="mb-8 rounded-xl border border-gray-200 p-5">
                <h2 className="text-sm font-medium text-gray-900">
                    Ask the LLM
                </h2>

                <div className="mt-4 space-y-3">
                    <div>
                        <label
                            htmlFor="prompt"
                            className="block text-xs font-medium text-gray-500"
                        >
                            Your prompt
                        </label>
                        <textarea
                            id="prompt"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="e.g. Explain how photosynthesis works..."
                            rows={4}
                            className="mt-1 w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm transition-colors outline-none focus:border-gray-400"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="expires"
                            className="block text-xs font-medium text-gray-500"
                        >
                            Link expires in
                        </label>
                        <select
                            id="expires"
                            value={expiresInHours}
                            onChange={(e) =>
                                setExpiresInHours(Number(e.target.value))
                            }
                            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm transition-colors outline-none focus:border-gray-400"
                        >
                            <option value={1}>1 hour</option>
                            <option value={6}>6 hours</option>
                            <option value={24}>24 hours</option>
                            <option value={72}>3 days</option>
                            <option value={168}>7 days</option>
                            <option value={720}>30 days</option>
                        </select>
                    </div>

                    <button
                        onClick={createDelegation}
                        disabled={creating || !prompt.trim()}
                        className="w-full cursor-pointer rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-gray-800 focus:ring-2 focus:ring-gray-500/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {creating
                            ? "Generating response..."
                            : "Generate & create shareable link"}
                    </button>
                </div>
            </div>

            <div>
                <h2 className="mb-3 text-sm font-medium text-gray-900">
                    Your shared responses
                </h2>

                {loading ? (
                    <p className="py-8 text-center text-sm text-gray-400">
                        Loading...
                    </p>
                ) : delegations.length === 0 ? (
                    <p className="py-8 text-center text-sm text-gray-400">
                        No shared responses yet.
                    </p>
                ) : (
                    <div className="space-y-3">
                        {delegations.map((d) => {
                            const expired = isExpired(d.expiresAt);
                            return (
                                <div
                                    key={d.id}
                                    className={`rounded-xl border p-4 ${expired ? "border-gray-100 bg-gray-50 opacity-60" : "border-gray-200"}`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-gray-900 line-clamp-2">
                                                {d.prompt || d.label || "Untitled"}
                                            </p>
                                            {d.response && (
                                                <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                                                    {d.response}
                                                </p>
                                            )}
                                        </div>
                                        <span
                                            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                                                expired
                                                    ? "bg-gray-100 text-gray-500"
                                                    : "bg-emerald-50 text-emerald-700"
                                            }`}
                                        >
                                            {expired ? "Expired" : "Active"}
                                        </span>
                                    </div>

                                    <p className="mt-2 text-xs text-gray-400">
                                        Expires{" "}
                                        {new Date(
                                            d.expiresAt
                                        ).toLocaleString()}
                                    </p>

                                    <div className="mt-3 flex gap-2">
                                        {!expired && (
                                            <button
                                                onClick={() =>
                                                    copyLink(d.token, d.id)
                                                }
                                                className="cursor-pointer rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                                            >
                                                {copiedId === d.id
                                                    ? "Copied!"
                                                    : "Copy link"}
                                            </button>
                                        )}
                                        <button
                                            onClick={() =>
                                                revokeDelegation(d.id)
                                            }
                                            className="cursor-pointer rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </main>
    );
};

export default LlmDelegationPage;
