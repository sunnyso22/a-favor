"use client";

import { useEffect, useState } from "react";

import { authClient } from "@/lib/auth-client";

type Delegation = {
    id: string;
    token: string;
    expiresAt: string;
    label: string | null;
    createdAt: string;
};

const DelegationPage = () => {
    const { data: session, isPending: sessionLoading } =
        authClient.useSession();
    const [delegations, setDelegations] = useState<Delegation[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [label, setLabel] = useState("");
    const [expiresInHours, setExpiresInHours] = useState(24);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (session) fetchDelegations();
        else setLoading(false);
    }, [session]);

    const fetchDelegations = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/twitter-delegation");
            const data = await res.json();
            setDelegations(data.delegations ?? []);
        } catch {
            setError("Failed to load delegations");
        } finally {
            setLoading(false);
        }
    };

    const createDelegation = async () => {
        setCreating(true);
        setError(null);
        try {
            const res = await fetch("/api/twitter-delegation", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    label: label || undefined,
                    expiresInHours,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error);
                return;
            }
            setLabel("");
            await fetchDelegations();
        } catch {
            setError("Failed to create delegation");
        } finally {
            setCreating(false);
        }
    };

    const revokeDelegation = async (id: string) => {
        try {
            const res = await fetch(`/api/twitter-delegation?id=${id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                setDelegations((prev) => prev.filter((d) => d.id !== id));
            }
        } catch {
            setError("Failed to revoke delegation");
        }
    };

    const copyLink = (token: string, id: string) => {
        const url = `${window.location.origin}/twitter-delegatee/${token}`;
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
                            Sign in to manage delegations
                        </h1>
                        <p className="mt-2 text-sm text-gray-500">
                            Connect your X account to create shareable posting
                            links.
                        </p>
                    </div>
                    <button
                        onClick={() =>
                            authClient.signIn.social({
                                provider: "twitter",
                                callbackURL: "/twitter-delegation",
                            })
                        }
                        className="cursor-pointer rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-gray-800 focus:ring-2 focus:ring-gray-500/20 focus:outline-none"
                    >
                        Sign in with X
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
                        Delegation
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Create shareable links that let others post tweets on
                        your behalf.
                    </p>
                </div>
                <button
                    onClick={async () => {
                        await authClient.signOut();
                    }}
                    className="cursor-pointer rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
                >
                    Sign out
                </button>
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
                    New delegation link
                </h2>

                <div className="mt-4 space-y-3">
                    <div>
                        <label
                            htmlFor="label"
                            className="block text-xs font-medium text-gray-500"
                        >
                            Label (optional)
                        </label>
                        <input
                            id="label"
                            type="text"
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                            placeholder="e.g. For my social media manager"
                            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm transition-colors outline-none focus:border-gray-400"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="expires"
                            className="block text-xs font-medium text-gray-500"
                        >
                            Expires in
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
                        disabled={creating}
                        className="w-full cursor-pointer rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-gray-800 focus:ring-2 focus:ring-gray-500/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {creating ? "Creating..." : "Create link"}
                    </button>
                </div>
            </div>

            <div>
                <h2 className="mb-3 text-sm font-medium text-gray-900">
                    Your delegation links
                </h2>

                {loading ? (
                    <p className="py-8 text-center text-sm text-gray-400">
                        Loading...
                    </p>
                ) : delegations.length === 0 ? (
                    <p className="py-8 text-center text-sm text-gray-400">
                        No delegation links yet.
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
                                            <p className="truncate text-sm font-medium text-gray-900">
                                                {d.label || "Untitled"}
                                            </p>
                                            <p className="mt-0.5 font-mono text-xs text-gray-400">
                                                {d.token.slice(0, 8)}...
                                            </p>
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
                                        {new Date(d.expiresAt).toLocaleString()}
                                    </p>

                                    {!expired && (
                                        <div className="mt-3 flex gap-2">
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
                                            <button
                                                onClick={() =>
                                                    revokeDelegation(d.id)
                                                }
                                                className="cursor-pointer rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                                            >
                                                Revoke
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </main>
    );
};

export default DelegationPage;
