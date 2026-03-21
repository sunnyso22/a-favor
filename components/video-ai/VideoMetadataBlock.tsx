"use client";

import { ChevronDown, ChevronRight } from "lucide-react";

import { useMemo, useState } from "react";

export const VideoMetadataBlock = ({
    metadataJson,
    title = "Poe video JSON",
    defaultOpen = false,
}: {
    metadataJson: string | null;
    title?: string;
    defaultOpen?: boolean;
}) => {
    const [open, setOpen] = useState(defaultOpen);

    const formatted = useMemo(() => {
        if (!metadataJson) return null;
        try {
            return JSON.stringify(JSON.parse(metadataJson), null, 2);
        } catch {
            return metadataJson;
        }
    }, [metadataJson]);

    if (!formatted) {
        return (
            <p className="text-ink-soft text-xs">
                No metadata yet — generation may still be running.
            </p>
        );
    }

    return (
        <div className="mt-4">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="text-ink-soft hover:text-ink flex cursor-pointer items-center gap-1 text-xs font-medium tracking-wide uppercase"
            >
                {open ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                    <ChevronRight className="h-3.5 w-3.5" />
                )}
                {title}
            </button>
            {open && (
                <pre className="border-border bg-bg mt-2 max-h-80 overflow-auto rounded-sm border p-3 font-mono text-[11px] whitespace-pre-wrap">
                    {formatted}
                </pre>
            )}
        </div>
    );
};
