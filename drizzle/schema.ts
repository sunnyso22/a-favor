import { relations } from "drizzle-orm";
import {
    pgTable,
    text,
    timestamp,
    boolean,
    integer,
    index,
    uniqueIndex,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    image: text("image"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => /* @__PURE__ */ new Date())
        .notNull(),
});

export const session = pgTable(
    "session",
    {
        id: text("id").primaryKey(),
        expiresAt: timestamp("expires_at").notNull(),
        token: text("token").notNull().unique(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .$onUpdate(() => /* @__PURE__ */ new Date())
            .notNull(),
        ipAddress: text("ip_address"),
        userAgent: text("user_agent"),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
    },
    (table) => [index("session_userId_idx").on(table.userId)]
);

export const account = pgTable(
    "account",
    {
        id: text("id").primaryKey(),
        accountId: text("account_id").notNull(),
        providerId: text("provider_id").notNull(),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        accessToken: text("access_token"),
        refreshToken: text("refresh_token"),
        idToken: text("id_token"),
        accessTokenExpiresAt: timestamp("access_token_expires_at"),
        refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
        scope: text("scope"),
        password: text("password"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .$onUpdate(() => /* @__PURE__ */ new Date())
            .notNull(),
    },
    (table) => [index("account_userId_idx").on(table.userId)]
);

export const verification = pgTable(
    "verification",
    {
        id: text("id").primaryKey(),
        identifier: text("identifier").notNull(),
        value: text("value").notNull(),
        expiresAt: timestamp("expires_at").notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .defaultNow()
            .$onUpdate(() => /* @__PURE__ */ new Date())
            .notNull(),
    },
    (table) => [index("verification_identifier_idx").on(table.identifier)]
);

export const walletAddress = pgTable(
    "wallet_address",
    {
        id: text("id").primaryKey(),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        address: text("address").notNull(),
        chainId: integer("chain_id").notNull(),
        isPrimary: boolean("is_primary").default(false).notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (table) => [index("walletAddress_userId_idx").on(table.userId)]
);

export const llm = pgTable(
    "llm",
    {
        id: text("id").primaryKey(),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        token: text("token").notNull(),
        expiresAt: timestamp("expires_at"),
        prompt: text("prompt"),
        response: text("response"),
        model: text("model"),
        generationId: text("generation_id"),
        forumThreadId: text("forum_thread_id").references(
            () => forumThread.id,
            {
                onDelete: "set null",
            }
        ),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        uniqueIndex("llm_token_idx").on(table.token),
        index("llm_userId_idx").on(table.userId),
        index("llm_forumThreadId_idx").on(table.forumThreadId),
    ]
);

export const openrouterAccount = pgTable(
    "openrouter_account",
    {
        id: text("id").primaryKey(),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        apiKey: text("api_key").notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [uniqueIndex("openrouter_account_userId_idx").on(table.userId)]
);

/** Poe API key for [Poe OpenAI-compatible API](https://creator.poe.com/docs/api) (video, chat, etc.). */
export const poeAccount = pgTable(
    "poe_account",
    {
        id: text("id").primaryKey(),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        apiKey: text("api_key").notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [uniqueIndex("poe_account_userId_idx").on(table.userId)]
);

/** Shareable Poe video generation (async poll + proxy playback). */
export const videoShare = pgTable(
    "video_share",
    {
        id: text("id").primaryKey(),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        token: text("token").notNull(),
        /** When null, the share link does not expire. */
        expiresAt: timestamp("expires_at"),
        prompt: text("prompt"),
        model: text("model").notNull(),
        status: text("status").notNull(),
        metadataJson: text("metadata_json"),
        errorMessage: text("error_message"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        uniqueIndex("video_share_token_idx").on(table.token),
        index("video_share_userId_idx").on(table.userId),
    ]
);

// --- Forum (threads & replies) ---

export const forumThread = pgTable(
    "forum_thread",
    {
        id: text("id").primaryKey(),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        title: text("title").notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (table) => [index("forumThread_userId_idx").on(table.userId)]
);

export const forumReply = pgTable(
    "forum_reply",
    {
        id: text("id").primaryKey(),
        forumThreadId: text("forum_thread_id")
            .notNull()
            .references(() => forumThread.id, { onDelete: "cascade" }),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        body: text("body").notNull(),
        /** When set, this row is tied to an LLM share on this thread. */
        llmId: text("llm_id").references(() => llm.id, {
            onDelete: "cascade",
        }),
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (table) => [
        index("forumReply_forumThreadId_idx").on(table.forumThreadId),
        index("forumReply_userId_idx").on(table.userId),
        index("forumReply_llmId_idx").on(table.llmId),
        uniqueIndex("forumReply_llmId_unique").on(table.llmId),
    ]
);

export const forumReplyReview = pgTable(
    "forum_reply_review",
    {
        id: text("id").primaryKey(),
        forumReplyId: text("forum_reply_id")
            .notNull()
            .references(() => forumReply.id, { onDelete: "cascade" }),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        score: integer("score").notNull(),
        reviewBody: text("review_body"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (table) => [
        index("forumReplyReview_forumReplyId_idx").on(table.forumReplyId),
        index("forumReplyReview_userId_idx").on(table.userId),
        uniqueIndex("forumReplyReview_reply_user_unique").on(
            table.forumReplyId,
            table.userId
        ),
    ]
);

// --- Studio (tasks & solutions) ---

export const studioTask = pgTable(
    "studio_task",
    {
        id: text("id").primaryKey(),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        title: text("title").notNull(),
        models: text("models").notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (table) => [index("studioTask_userId_idx").on(table.userId)]
);

export const studioSolution = pgTable(
    "studio_solution",
    {
        id: text("id").primaryKey(),
        studioTaskId: text("studio_task_id")
            .notNull()
            .references(() => studioTask.id, { onDelete: "cascade" }),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        videoShareId: text("video_share_id").references(() => videoShare.id, {
            onDelete: "cascade",
        }),
        reviewScore: integer("review_score"),
        reviewBody: text("review_body"),
        reviewedAt: timestamp("reviewed_at"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (table) => [
        index("studioSolution_studioTaskId_idx").on(table.studioTaskId),
        index("studioSolution_userId_idx").on(table.userId),
        index("studioSolution_videoShareId_idx").on(table.videoShareId),
        uniqueIndex("studioSolution_videoShareId_unique").on(
            table.videoShareId
        ),
    ]
);

export const studioSolutionReview = pgTable(
    "studio_solution_review",
    {
        id: text("id").primaryKey(),
        studioSolutionId: text("studio_solution_id")
            .notNull()
            .references(() => studioSolution.id, { onDelete: "cascade" }),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        score: integer("score").notNull(),
        reviewBody: text("review_body"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (table) => [
        index("studioSolutionReview_studioSolutionId_idx").on(
            table.studioSolutionId
        ),
        index("studioSolutionReview_userId_idx").on(table.userId),
        uniqueIndex("studioSolutionReview_solution_user_unique").on(
            table.studioSolutionId,
            table.userId
        ),
    ]
);

// --- Marketplace (listings & bids) ---

export const marketplaceListing = pgTable(
    "marketplace_listing",
    {
        id: text("id").primaryKey(),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        title: text("title").notNull(),
        description: text("description").notNull(),
        models: text("models").notNull(),
        price: text("price").notNull(),
        priceUnit: text("price_unit").notNull(),
        status: text("status").default("open").notNull(),
        workerId: text("worker_id").references(() => user.id),
        finalDelivery: text("final_delivery"),
        finalDeliveredAt: timestamp("final_delivered_at"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (table) => [
        index("marketplaceListing_userId_idx").on(table.userId),
        index("marketplaceListing_status_idx").on(table.status),
    ]
);

export const marketplaceBid = pgTable(
    "marketplace_bids",
    {
        id: text("id").primaryKey(),
        listingId: text("listing_id")
            .notNull()
            .references(() => marketplaceListing.id, { onDelete: "cascade" }),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        approach: text("approach").notNull(),
        resources: text("resources"),
        timeline: text("timeline").notNull(),
        proposedPrice: text("proposed_price").notNull(),
        status: text("status").default("pending").notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (table) => [
        index("marketplaceBid_listingId_idx").on(table.listingId),
        index("marketplaceBid_userId_idx").on(table.userId),
    ]
);

/** Private thread between listing author and accepted worker. */
export const marketplaceChatMessage = pgTable(
    "marketplace_chat_message",
    {
        id: text("id").primaryKey(),
        listingId: text("listing_id")
            .notNull()
            .references(() => marketplaceListing.id, { onDelete: "cascade" }),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        body: text("body").notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (table) => [
        index("marketplaceChatMessage_listingId_idx").on(table.listingId),
        index("marketplaceChatMessage_createdAt_idx").on(table.createdAt),
    ]
);

// --- Relations ---

export const userRelations = relations(user, ({ many, one }) => ({
    sessions: many(session),
    accounts: many(account),
    llm: many(llm),
    openrouterAccount: one(openrouterAccount),
    poeAccount: one(poeAccount),
    videoShares: many(videoShare),
    forumThreads: many(forumThread),
    forumReplies: many(forumReply),
    forumReplyReviews: many(forumReplyReview),
    studioTasks: many(studioTask),
    solutions: many(studioSolution),
    studioSolutionReviews: many(studioSolutionReview),
    marketplaceListings: many(marketplaceListing),
    marketplaceBids: many(marketplaceBid),
    marketplaceChatMessages: many(marketplaceChatMessage),
}));

export const sessionRelations = relations(session, ({ one }) => ({
    user: one(user, {
        fields: [session.userId],
        references: [user.id],
    }),
}));

export const accountRelations = relations(account, ({ one }) => ({
    user: one(user, {
        fields: [account.userId],
        references: [user.id],
    }),
}));

export const llmRelations = relations(llm, ({ one }) => ({
    user: one(user, {
        fields: [llm.userId],
        references: [user.id],
    }),
    forumThread: one(forumThread, {
        fields: [llm.forumThreadId],
        references: [forumThread.id],
    }),
    forumReply: one(forumReply, {
        fields: [llm.id],
        references: [forumReply.llmId],
    }),
}));

export const openrouterAccountRelations = relations(
    openrouterAccount,
    ({ one }) => ({
        user: one(user, {
            fields: [openrouterAccount.userId],
            references: [user.id],
        }),
    })
);

export const poeAccountRelations = relations(poeAccount, ({ one }) => ({
    user: one(user, {
        fields: [poeAccount.userId],
        references: [user.id],
    }),
}));

export const videoShareRelations = relations(videoShare, ({ one, many }) => ({
    user: one(user, {
        fields: [videoShare.userId],
        references: [user.id],
    }),
    solutions: many(studioSolution),
}));

export const forumThreadRelations = relations(forumThread, ({ one, many }) => ({
    user: one(user, {
        fields: [forumThread.userId],
        references: [user.id],
    }),
    replies: many(forumReply),
    llm: many(llm),
}));

export const forumReplyRelations = relations(forumReply, ({ one, many }) => ({
    forumThread: one(forumThread, {
        fields: [forumReply.forumThreadId],
        references: [forumThread.id],
    }),
    user: one(user, {
        fields: [forumReply.userId],
        references: [user.id],
    }),
    llm: one(llm, {
        fields: [forumReply.llmId],
        references: [llm.id],
    }),
    reviews: many(forumReplyReview),
}));

export const forumReplyReviewRelations = relations(
    forumReplyReview,
    ({ one }) => ({
        forumReply: one(forumReply, {
            fields: [forumReplyReview.forumReplyId],
            references: [forumReply.id],
        }),
        user: one(user, {
            fields: [forumReplyReview.userId],
            references: [user.id],
        }),
    })
);

export const studioTaskRelations = relations(studioTask, ({ one, many }) => ({
    user: one(user, {
        fields: [studioTask.userId],
        references: [user.id],
    }),
    solutions: many(studioSolution),
}));

export const studioSolutionRelations = relations(
    studioSolution,
    ({ one, many }) => ({
        studioTask: one(studioTask, {
            fields: [studioSolution.studioTaskId],
            references: [studioTask.id],
        }),
        user: one(user, {
            fields: [studioSolution.userId],
            references: [user.id],
        }),
        videoShare: one(videoShare, {
            fields: [studioSolution.videoShareId],
            references: [videoShare.id],
        }),
        reviews: many(studioSolutionReview),
    })
);

export const studioSolutionReviewRelations = relations(
    studioSolutionReview,
    ({ one }) => ({
        studioSolution: one(studioSolution, {
            fields: [studioSolutionReview.studioSolutionId],
            references: [studioSolution.id],
        }),
        user: one(user, {
            fields: [studioSolutionReview.userId],
            references: [user.id],
        }),
    })
);

export const marketplaceListingRelations = relations(
    marketplaceListing,
    ({ one, many }) => ({
        user: one(user, {
            fields: [marketplaceListing.userId],
            references: [user.id],
        }),
        worker: one(user, {
            fields: [marketplaceListing.workerId],
            references: [user.id],
        }),
        bids: many(marketplaceBid),
        chatMessages: many(marketplaceChatMessage),
    })
);

export const marketplaceBidRelations = relations(marketplaceBid, ({ one }) => ({
    listing: one(marketplaceListing, {
        fields: [marketplaceBid.listingId],
        references: [marketplaceListing.id],
    }),
    user: one(user, {
        fields: [marketplaceBid.userId],
        references: [user.id],
    }),
}));

export const marketplaceChatMessageRelations = relations(
    marketplaceChatMessage,
    ({ one }) => ({
        listing: one(marketplaceListing, {
            fields: [marketplaceChatMessage.listingId],
            references: [marketplaceListing.id],
        }),
        user: one(user, {
            fields: [marketplaceChatMessage.userId],
            references: [user.id],
        }),
    })
);

export const schema = {
    user,
    session,
    account,
    verification,
    walletAddress,
    llm,
    openrouterAccount,
    poeAccount,
    videoShare,
    forumThread,
    forumReply,
    forumReplyReview,
    studioTask,
    studioSolution,
    studioSolutionReview,
    marketplaceListing,
    marketplaceBid,
    marketplaceChatMessage,
};
