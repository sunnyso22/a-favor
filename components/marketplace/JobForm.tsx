"use client";

import { useState, useTransition } from "react";

import { createListing } from "@/app/marketplace/actions";

export const JobForm = () => {
    const [isPending, startTransition] = useTransition();
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({
        title: "",
        description: "",
        models: "",
        price: "",
        priceUnit: "",
    });
    const [err, setErr] = useState("");

    const onFieldChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setForm((f) => ({ ...f, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErr("");
        startTransition(async () => {
            const result = await createListing(form);
            if (result.error) {
                setErr(result.error);
            } else {
                setForm({
                    title: "",
                    description: "",
                    models: "",
                    price: "",
                    priceUnit: "",
                });
                setShowForm(false);
            }
        });
    };

    return (
        <>
            {!showForm && (
                <button
                    type="button"
                    onClick={() => setShowForm(true)}
                    className="btn-dream btn-dream-primary rounded px-4 py-2 text-sm"
                >
                    Post job
                </button>
            )}

            {showForm && (
                <form
                    onSubmit={handleSubmit}
                    className="poster-card rounded-2xl p-6"
                >
                    {err && (
                        <div className="mb-4 text-sm text-red-400">{err}</div>
                    )}
                    <input
                        name="title"
                        placeholder="Title"
                        value={form.title}
                        onChange={onFieldChange}
                        className="border-border bg-surface text-ink placeholder:text-ink-soft focus:border-clay mb-4 w-full rounded-lg border px-4 py-2.5 outline-none"
                        required
                    />
                    <textarea
                        name="description"
                        placeholder="Description (Goals or deliverables)"
                        value={form.description}
                        onChange={onFieldChange}
                        rows={3}
                        className="border-border bg-surface text-ink placeholder:text-ink-soft focus:border-clay mb-4 w-full resize-none rounded-lg border px-4 py-2.5 outline-none"
                        required
                    />
                    <textarea
                        name="models"
                        placeholder="Models"
                        value={form.models}
                        onChange={onFieldChange}
                        rows={2}
                        className="border-border bg-surface text-ink placeholder:text-ink-soft focus:border-clay mb-4 w-full resize-none rounded-lg border px-4 py-2.5 outline-none"
                        required
                    />
                    <div className="mb-4 grid gap-4 md:grid-cols-2">
                        <input
                            name="price"
                            placeholder="Price (amount)"
                            value={form.price}
                            onChange={onFieldChange}
                            className="border-border bg-surface text-ink placeholder:text-ink-soft focus:border-clay rounded-lg border px-4 py-2.5 outline-none"
                            required
                        />
                        <input
                            name="priceUnit"
                            placeholder="Unit (e.g. USDC, USDT, ETH, etc)"
                            value={form.priceUnit}
                            onChange={onFieldChange}
                            className="border-border bg-surface text-ink placeholder:text-ink-soft focus:border-clay rounded-lg border px-4 py-2.5 outline-none"
                            required
                        />
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <button
                            type="submit"
                            disabled={isPending}
                            className="btn-dream btn-dream-primary rounded px-4 py-2 text-sm disabled:opacity-50"
                        >
                            {isPending ? "Posting..." : "Post"}
                        </button>
                        <button
                            type="button"
                            disabled={isPending}
                            onClick={() => {
                                setShowForm(false);
                                setErr("");
                            }}
                            className="btn-dream border-border rounded border px-4 py-2 text-sm disabled:opacity-50"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}
        </>
    );
};
