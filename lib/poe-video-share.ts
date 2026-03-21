/** Poe Videos API job id stored inside `metadata_json` (`object: "video"`). */
export const parsePoeVideoIdFromMetadata = (
    metadataJson: string | null
): string | null => {
    if (!metadataJson) return null;
    try {
        const data = JSON.parse(metadataJson) as {
            object?: string;
            id?: string;
        };
        if (
            data.object === "video" &&
            typeof data.id === "string" &&
            data.id.startsWith("video_")
        ) {
            return data.id;
        }
        return null;
    } catch {
        return null;
    }
};

export const isPoeVideoJobMetadata = (metadataJson: string | null) =>
    parsePoeVideoIdFromMetadata(metadataJson) != null;

/** Assistant text from a stored OpenAI-format chat completion (Poe `chat.completions`). */
export const parseChatCompletionContent = (
    metadataJson: string | null
): string | null => {
    if (!metadataJson) return null;
    try {
        const data = JSON.parse(metadataJson) as {
            object?: string;
            choices?: Array<{ message?: { content?: string | null } }>;
        };
        if (data.object === "video") return null;
        if (!Array.isArray(data.choices) || data.choices.length === 0) {
            return null;
        }
        const content = data.choices[0]?.message?.content;
        return typeof content === "string" ? content : null;
    } catch {
        return null;
    }
};
