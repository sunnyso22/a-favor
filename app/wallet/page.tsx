"use client";

import { ConnectKitButton, useSIWE } from "connectkit";
import { KeyRound, Wallet } from "lucide-react";
import { useConnection } from "wagmi";

import Signature from "@/components/Signature";

const WalletPage = () => {
    const { isConnected, address } = useConnection();
    const { isSignedIn, signIn } = useSIWE();

    return (
        <main className="mx-auto flex min-h-[calc(100vh-65px)] max-w-xl items-center justify-center px-4">
            {isSignedIn ? (
                <Signature />
            ) : isConnected ? (
                <div className="flex flex-col items-center gap-6 py-24 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                        <KeyRound className="h-6 w-6 text-emerald-600" />
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
                        <Wallet className="h-6 w-6 text-gray-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Connect Wallet
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

export default WalletPage;
