import { LlmCard } from "@/components/llm/LlmCard";
import type { LlmShare } from "@/components/llm/types";

export const LlmList = ({
    shares,
    onRevoke,
}: {
    shares: LlmShare[];
    onRevoke: (id: string) => void;
}) => (
    <div>
        <h2 className="section-title mb-3 text-base">Your shared responses</h2>

        {shares.length === 0 ? (
            <p className="text-ink-soft py-8 text-center text-sm">
                No shared responses yet.
            </p>
        ) : (
            <div className="space-y-3">
                {shares.map((share) => (
                    <LlmCard key={share.id} share={share} onRevoke={onRevoke} />
                ))}
            </div>
        )}
    </div>
);
