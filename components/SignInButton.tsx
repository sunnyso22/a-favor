"use client";

import { useModal } from "connectkit";
import { SiweMessage } from "siwe";
import { useConnection, useSignMessage } from "wagmi";

import { useCallback, useLayoutEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";

const isAborted = (signal?: AbortSignal) => Boolean(signal?.aborted);

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
    const { data: session, refetch: refetchSession } = authClient.useSession();
    const { isConnected, address, chainId } = useConnection();
    const { mutateAsync, isPending: signPending } = useSignMessage();
    const [verifyError, setVerifyError] = useState<string | null>(null);
    const [siweWorking, setSiweWorking] = useState(false);

    const target =
        callbackURL.startsWith("/wallet") || callbackURL === ""
            ? "/"
            : callbackURL;

    const runSiwe = useCallback(
        async (signal?: AbortSignal) => {
            if (!address || chainId == null) {
                return;
            }
            const authUrl = process.env.BETTER_AUTH_URL;
            if (!authUrl) {
                setVerifyError("BETTER_AUTH_URL is not configured.");
                return;
            }
            setVerifyError(null);

            const domain = new URL(authUrl).host;
            const { data: nonceData, error: nonceErr } =
                await authClient.siwe.nonce({
                    walletAddress: address,
                    chainId,
                });
            if (isAborted(signal)) {
                return;
            }
            if (nonceErr || !nonceData?.nonce) {
                setVerifyError(
                    nonceErr?.message ?? "Could not get a sign-in nonce."
                );
                return;
            }

            const message = new SiweMessage({
                domain,
                address,
                statement: "Sign in to Trexe with your wallet.",
                uri: window.location.origin,
                version: "1",
                chainId,
                nonce: nonceData.nonce,
            }).prepareMessage();

            let signature: string;
            try {
                signature = await mutateAsync({ message });
            } catch {
                if (!isAborted(signal)) {
                    setVerifyError("Wallet signature was cancelled or failed.");
                }
                return;
            }
            if (isAborted(signal)) {
                return;
            }

            const { error: verifyErr } = await authClient.siwe.verify({
                message,
                signature,
                walletAddress: address,
                chainId,
            });
            if (isAborted(signal)) {
                return;
            }
            if (verifyErr) {
                setVerifyError(
                    verifyErr.message ??
                        "Could not verify your signature. Open this app using the same host as BETTER_AUTH_URL."
                );
                return;
            }

            // SIWE verify does not trigger Better Auth session refetch (unlike email sign-in).
            await refetchSession();
            router.refresh();
            router.push(target);
        },
        [address, chainId, mutateAsync, refetchSession, router, target]
    );

    const startSiwe = useCallback(
        (signal?: AbortSignal) => {
            setSiweWorking(true);
            return runSiwe(signal).finally(() => {
                if (!isAborted(signal)) {
                    setSiweWorking(false);
                }
            });
        },
        [runSiwe]
    );

    const signedIn = Boolean(session?.user);

    useLayoutEffect(() => {
        if (signedIn || !isConnected || address == null || chainId == null) {
            return;
        }
        const ac = new AbortController();
        queueMicrotask(() => {
            void startSiwe(ac.signal);
        });
        return () => {
            ac.abort();
            setSiweWorking(false);
        };
    }, [signedIn, isConnected, address, chainId, startSiwe]);

    if (!isConnected) {
        return (
            <div className="flex flex-col items-start gap-1">
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

    const busy = siweWorking || signPending || chainId == null;
    const retryClass = `${className} disabled:cursor-not-allowed disabled:opacity-50`;
    const statusLine = busy ? (
        <span className="text-ink-muted text-xs">
            {signPending
                ? "Sign the message in your wallet…"
                : "Completing sign-in…"}
        </span>
    ) : null;

    return (
        <div className="flex flex-col items-start gap-1">
            {verifyError ? (
                <>
                    <p className="max-w-[220px] text-right text-xs text-red-600">
                        {verifyError}
                    </p>
                    {statusLine}
                    <button
                        type="button"
                        onClick={() => void startSiwe()}
                        disabled={busy}
                        className={retryClass}
                    >
                        Try again
                    </button>
                </>
            ) : (
                statusLine
            )}
        </div>
    );
};
