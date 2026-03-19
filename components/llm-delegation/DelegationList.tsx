import { DelegationCard } from "@/components/llm-delegation/DelegationCard";
import type { Delegation } from "@/components/llm-delegation/types";

export const DelegationList = ({
    delegations,
    copiedId,
    onCopyLink,
    onRevoke,
}: {
    delegations: Delegation[];
    copiedId: string | null;
    onCopyLink: (token: string, id: string) => void;
    onRevoke: (id: string) => void;
}) => (
    <div>
        <h2 className="mb-3 text-sm font-medium text-gray-900">
            Your shared responses
        </h2>

        {delegations.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">
                No shared responses yet.
            </p>
        ) : (
            <div className="space-y-3">
                {delegations.map((delegation) => (
                    <DelegationCard
                        key={delegation.id}
                        delegation={delegation}
                        copiedId={copiedId}
                        onCopyLink={onCopyLink}
                        onRevoke={onRevoke}
                    />
                ))}
            </div>
        )}
    </div>
);
