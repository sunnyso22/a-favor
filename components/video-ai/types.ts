export type VideoShare = {
    id: string;
    token: string;
    expiresAt: Date | null;
    prompt: string | null;
    model: string;
    status: string;
    metadataJson: string | null;
    errorMessage: string | null;
    createdAt: Date;
};
