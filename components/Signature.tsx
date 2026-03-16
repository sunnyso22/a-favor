"use client";

import { useSIWE } from "connectkit";
import { useConnection, useSignMessage } from "wagmi";

import { useState } from "react";

const Signature = () => {
    const { chain } = useConnection();
    const { data, signOut } = useSIWE();
    const { mutateAsync, isPending } = useSignMessage();
    const [message, setMessage] = useState("Hello from aFavor!");
    const [signature, setSignature] = useState<string | null>(null);

    const handleSign = async () => {
        try {
            const sig = await mutateAsync({ message });
            setSignature(sig);
        } catch (err) {
            console.error("Signing failed:", err);
        }
    };

    const truncatedAddress = data?.address
        ? `${data.address.slice(0, 6)}…${data.address.slice(-4)}`
        : "";

    return (
        <div className="flex flex-col gap-8">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                    Sign a Message
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                    Cryptographically sign an arbitrary message with your
                    wallet.
                </p>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                <div className="flex flex-col">
                    <span className="text-xs font-medium tracking-wide text-gray-400 uppercase">
                        Connected wallet
                    </span>
                    <span className="mt-0.5 font-mono text-sm font-medium">
                        {truncatedAddress}
                    </span>
                </div>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                    {chain?.name ?? `Chain ${data?.chainId}`}
                </span>
            </div>

            <div className="flex flex-col gap-3">
                <label
                    htmlFor="message"
                    className="text-sm font-medium text-gray-700"
                >
                    Message
                </label>
                <textarea
                    id="message"
                    value={message}
                    onChange={(e) => {
                        setMessage(e.target.value);
                        setSignature(null);
                    }}
                    rows={3}
                    placeholder="Enter the message you want to sign…"
                    className="rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm shadow-sm transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                />
                <button
                    onClick={handleSign}
                    disabled={isPending || !message}
                    className="cursor-pointer rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {isPending ? "Waiting for wallet…" : "Sign Message"}
                </button>
            </div>

            {signature && (
                <div className="flex flex-col gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                    <div className="flex items-center gap-2">
                        <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="text-sm font-medium text-emerald-800">
                            Signature
                        </span>
                    </div>
                    <code className="rounded-md bg-white/70 p-3 font-mono text-xs leading-relaxed break-all text-gray-700">
                        {signature}
                    </code>
                </div>
            )}

            <div className="border-t border-gray-200 pt-4">
                <button
                    onClick={signOut}
                    className="cursor-pointer text-sm text-gray-400 transition-colors hover:text-gray-600"
                >
                    Sign out
                </button>
            </div>
        </div>
    );
};

export default Signature;
