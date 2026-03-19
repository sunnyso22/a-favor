import type { Delegation } from "./types";

type DelegationCardProps = {
    delegation: Delegation;
    copiedId: string | null;
    onCopyLink: (token: string, id: string) => void;
    onRevoke: (id: string) => void;
};

const isExpired = (expiresAt: Date): boolean =>
    new Date() > new Date(expiresAt);

export const DelegationCard = ({
    delegation: d,
    copiedId,
    onCopyLink,
    onRevoke,
}: DelegationCardProps) => {
    const expired = isExpired(d.expiresAt);

    return (
        <div
            className={`rounded-xl border p-4 ${expired ? "border-gray-100 bg-gray-50 opacity-60" : "border-gray-200"}`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-medium text-gray-900">
                        {d.prompt || "Untitled"}
                    </p>
                    {d.response && (
                        <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                            {d.response}
                        </p>
                    )}
                </div>
                <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                        expired
                            ? "bg-gray-100 text-gray-500"
                            : "bg-emerald-50 text-emerald-700"
                    }`}
                >
                    {expired ? "Expired" : "Active"}
                </span>
            </div>

            <p className="mt-2 text-xs text-gray-400">
                Expires{" "}
                {d.expiresAt.toLocaleString("en-GB", {
                    dateStyle: "medium",
                    timeStyle: "short",
                })}
            </p>

            <div className="mt-3 flex gap-2">
                {!expired && (
                    <button
                        onClick={() => onCopyLink(d.token, d.id)}
                        className="cursor-pointer rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                    >
                        {copiedId === d.id ? "Copied!" : "Copy link"}
                    </button>
                )}
                <button
                    onClick={() => onRevoke(d.id)}
                    className="cursor-pointer rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                >
                    Delete
                </button>
            </div>
        </div>
    );
};
