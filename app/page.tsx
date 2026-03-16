"use client";

import { ConnectKitButton, useSIWE } from "connectkit";
import { useConnection } from "wagmi";

import Signature from "@/components/Signature";

const HomePage = () => {
    const { isConnected, address } = useConnection();
    const { isSignedIn, signIn } = useSIWE();

    return (
        <main className="mx-auto max-w-xl px-4 py-16">
            {isSignedIn ? (
                <Signature />
            ) : isConnected ? (
                <div className="flex flex-col items-center gap-6 py-24 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                        <svg
                            className="h-6 w-6 text-emerald-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z"
                            />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Verify your wallet
                        </h1>
                        <p className="mt-2 text-sm text-gray-500">
                            Wallet{" "}
                            <span className="font-mono font-medium text-gray-700">
                                {address?.slice(0, 6)}…{address?.slice(-4)}
                            </span>{" "}
                            connected. Sign in to prove ownership.
                        </p>
                    </div>
                    <button
                        onClick={signIn}
                        className="cursor-pointer rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                    >
                        Sign In with Ethereum
                    </button>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-6 py-24 text-center">
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
                                d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3"
                            />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Welcome to aFavor
                        </h1>
                        <p className="mt-2 text-sm text-gray-500">
                            Connect your wallet to get started.
                        </p>
                    </div>
                    <ConnectKitButton />
                </div>
            )}
        </main>
    );
};

export default HomePage;
