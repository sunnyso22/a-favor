import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { generateRandomString } from "better-auth/crypto";
import { siwe } from "better-auth/plugins";
import { SiweMessage } from "siwe";
import { getAddress, verifyMessage } from "viem";

import { db } from "@/drizzle";
import { schema } from "@/drizzle/schema";

const resolveBaseURL = (): string => {
    const fromBetterAuth = process.env.BETTER_AUTH_URL?.trim();
    if (fromBetterAuth) return fromBetterAuth;
    return "http://127.0.0.1:3000";
};

const baseURL = resolveBaseURL();
const siweDomain = new URL(baseURL).host;

export const auth = betterAuth({
    baseURL,
    database: drizzleAdapter(db, {
        provider: "pg",
        schema,
    }),
    plugins: [
        siwe({
            domain: siweDomain,
            emailDomainName: siweDomain,
            getNonce: async () => generateRandomString(32, "a-z", "A-Z", "0-9"),
            verifyMessage: async ({
                message,
                signature,
                address,
                chainId,
                cacao,
            }) => {
                const nonce = cacao?.p?.nonce;
                if (!nonce) {
                    return false;
                }
                try {
                    const parsed = new SiweMessage(message);
                    let sameAddr = false;
                    try {
                        sameAddr =
                            getAddress(parsed.address) === getAddress(address);
                    } catch {
                        sameAddr = false;
                    }
                    const now = new Date();
                    if (
                        parsed.nonce !== nonce ||
                        parsed.domain.toLowerCase() !==
                            siweDomain.toLowerCase() ||
                        Number(parsed.chainId) !== Number(chainId) ||
                        !sameAddr ||
                        (parsed.expirationTime &&
                            new Date(parsed.expirationTime) <= now) ||
                        (parsed.notBefore && new Date(parsed.notBefore) > now)
                    ) {
                        return false;
                    }
                    const sig = signature.startsWith("0x")
                        ? signature
                        : `0x${signature}`;
                    return await verifyMessage({
                        address: getAddress(address),
                        message,
                        signature: sig as `0x${string}`,
                    });
                } catch {
                    return false;
                }
            },
        }),
    ],
});
