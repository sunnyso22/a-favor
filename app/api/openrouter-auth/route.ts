import { db } from "@/db";

import { NextRequest, NextResponse } from "next/server";

import { openrouterAccount } from "@/db/schema";

import { auth } from "@/lib/auth";

export const POST = async (request: NextRequest) => {
    const session = await auth.api.getSession({
        headers: request.headers,
    });

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code, codeVerifier } = await request.json();

    if (!code || !codeVerifier) {
        return NextResponse.json(
            { error: "Missing code or codeVerifier" },
            { status: 400 }
        );
    }

    const response = await fetch("https://openrouter.ai/api/v1/auth/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            code,
            code_verifier: codeVerifier,
            code_challenge_method: "S256",
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        return NextResponse.json(
            { error: `OpenRouter key exchange failed: ${errorText}` },
            { status: 502 }
        );
    }

    const data = await response.json();
    const apiKey = data.key;

    if (!apiKey) {
        return NextResponse.json(
            { error: "No API key returned from OpenRouter" },
            { status: 502 }
        );
    }

    await db
        .insert(openrouterAccount)
        .values({
            id: crypto.randomUUID(),
            userId: session.user.id,
            apiKey,
        })
        .onConflictDoUpdate({
            target: openrouterAccount.userId,
            set: { apiKey, updatedAt: new Date() },
        });

    return NextResponse.json({ success: true });
};
