import { db } from "@/db";
import { desc, eq } from "drizzle-orm";

import { headers } from "next/headers";

import { ConnectOpenRouter } from "@/components/llm-delegation/ConnectOpenRouter";
import { DelegationDashboard } from "@/components/llm-delegation/DelegationDashboard";
import { OpenRouterCallback } from "@/components/llm-delegation/OpenRouterCallback";
import { SignInPrompt } from "@/components/llm-delegation/SignInPrompt";

import { delegation, openrouterAccount } from "@/db/schema";

import { auth } from "@/lib/auth";

const LlmDelegationPage = async ({
    searchParams,
}: {
    searchParams: Promise<{ code?: string }>;
}) => {
    const { code } = await searchParams;

    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return <SignInPrompt />;
    }

    if (code) {
        return <OpenRouterCallback code={code} />;
    }

    const orAccount = await db
        .select()
        .from(openrouterAccount)
        .where(eq(openrouterAccount.userId, session.user.id))
        .limit(1);

    if (orAccount.length === 0) {
        return <ConnectOpenRouter />;
    }

    const rows = await db
        .select()
        .from(delegation)
        .where(eq(delegation.userId, session.user.id))
        .orderBy(desc(delegation.createdAt));

    const delegations = rows.map((d) => ({
        id: d.id,
        token: d.token,
        expiresAt: d.expiresAt.toISOString(),
        prompt: d.prompt,
        response: d.response,
        generationId: d.generationId,
        createdAt: d.createdAt.toISOString(),
    }));

    return <DelegationDashboard delegations={delegations} />;
};

export default LlmDelegationPage;
