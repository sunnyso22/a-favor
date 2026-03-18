"use client";

import { useState } from "react";

const MAX_LENGTH = 280;

const TweetComposer = ({ token }: { token: string }) => {
    const [text, setText] = useState("");
    const [posting, setPosting] = useState(false);
    const [result, setResult] = useState<{
        type: "success" | "error";
        message: string;
    } | null>(null);

    const remaining = MAX_LENGTH - text.length;
    const overLimit = remaining < 0;

    const handleSubmit = async (e: React.SubmitEvent) => {
        e.preventDefault();
        if (!text.trim() || overLimit || posting) return;

        setPosting(true);
        setResult(null);

        try {
            const res = await fetch(`/api/twitter-delegation/${token}/tweet`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: text.trim() }),
            });

            const data = await res.json();

            if (res.ok) {
                setResult({
                    type: "success",
                    message: "Tweet posted successfully!",
                });
                setText("");
            } else {
                setResult({
                    type: "error",
                    message: data.error || "Failed to post tweet",
                });
            }
        } catch {
            setResult({
                type: "error",
                message: "Network error. Please try again.",
            });
        } finally {
            setPosting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            {result && (
                <div
                    className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
                        result.type === "success"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-red-200 bg-red-50 text-red-700"
                    }`}
                >
                    {result.message}
                </div>
            )}

            <div className="rounded-xl border border-gray-200 p-4">
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="What's happening?"
                    rows={4}
                    className="w-full resize-none text-sm outline-none placeholder:text-gray-300"
                />

                <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
                    <span
                        className={`text-xs font-medium ${
                            overLimit
                                ? "text-red-500"
                                : remaining <= 20
                                  ? "text-amber-500"
                                  : "text-gray-400"
                        }`}
                    >
                        {remaining}
                    </span>

                    <button
                        type="submit"
                        disabled={!text.trim() || overLimit || posting}
                        className="cursor-pointer rounded-lg bg-gray-900 px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-gray-800 focus:ring-2 focus:ring-gray-500/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {posting ? "Posting..." : "Post"}
                    </button>
                </div>
            </div>
        </form>
    );
};

export default TweetComposer;
