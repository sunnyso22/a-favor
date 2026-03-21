"use client";

import { useModal } from "connectkit";
import { SiweMessage } from "siwe";
import { useConnection, useSignMessage } from "wagmi";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";

export const SignInButton = ({
    callbackURL = "/",
    label = "Connect Wallet",
    className = "btn-dream btn-dream-primary inline-flex cursor-pointer items-center justify-center text-sm",
}: {
    callbackURL?: string;
    label?: string;
    className?: string;
}) => {
    const router = useRouter();
    const { setOpen } = useModal();
    const { isConnected, address, chainId } = useConnection();
    const { mutateAsync, isPending: signPending } = useSignMessage();
    const [verifyError, setVerifyError] = useState<string | null>(null);

    useEffect(() => {
        if (!isConnected) {
            setVerifyError(null);
        }
    }, [isConnected]);

    const target =
        callbackURL.startsWith("/wallet") || callbackURL === ""
            ? "/"
            : callbackURL;

    const handleSiwe = async () => {
        if (!address || chainId == null) {
            return;
        }
        const authUrl = process.env.BETTER_AUTH_URL;
        if (!authUrl) {
            setVerifyError("BETTER_AUTH_URL is not configured.");
            return;
        }
        const domain = new URL(authUrl).host;
        setVerifyError(null);
        const { data: nonceData, error: nonceErr } =
            await authClient.siwe.nonce({
                walletAddress: address,
                chainId,
            });
        if (nonceErr || !nonceData?.nonce) {
            setVerifyError(
                nonceErr?.message ?? "Could not get a sign-in nonce."
            );
            return;
        }
        const message = new SiweMessage({
            domain,
            address,
            statement: "Sign in to aFavor with your wallet.",
            uri: window.location.origin,
            version: "1",
            chainId,
            nonce: nonceData.nonce,
        }).prepareMessage();
        let signature: string;
        try {
            signature = await mutateAsync({ message });
        } catch {
            setVerifyError("Wallet signature was cancelled or failed.");
            return;
        }
        const { error: verifyErr } = await authClient.siwe.verify({
            message,
            signature,
            walletAddress: address,
            chainId,
        });
        if (verifyErr) {
            setVerifyError(
                verifyErr.message ??
                    "Could not verify your signature. Open this app using the same host as BETTER_AUTH_URL."
            );
            return;
        }
        router.refresh();
        router.push(target);
    };

    if (!isConnected) {
        return (
            <div className="flex flex-col items-end gap-1">
                <button
                    type="button"
                    onClick={() => {
                        setVerifyError(null);
                        setOpen(true);
                    }}
                    className={className}
                >
                    {label}
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-end gap-1">
            {verifyError ? (
                <p className="max-w-[220px] text-right text-xs text-red-600">
                    {verifyError}
                </p>
            ) : null}
            <button
                type="button"
                onClick={() => {
                    void handleSiwe();
                }}
                disabled={signPending || chainId == null}
                className={`${className} disabled:cursor-not-allowed disabled:opacity-50`}
            >
                {signPending ? "Waiting for wallet…" : "Sign in with Ethereum"}
            </button>
        </div>
    );
};
