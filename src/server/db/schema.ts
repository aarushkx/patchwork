import {
    boolean,
    index,
    integer,
    jsonb,
    pgEnum,
    pgTable,
    text,
    timestamp,
    uuid,
} from "drizzle-orm/pg-core";

export const reviewStatus = pgEnum("ReviewStatus", [
    "PENDING",
    "PROCESSING",
    "COMPLETED",
    "FAILED",
]);

export const user = pgTable("user", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("emailVerified").default(false).notNull(),
    image: text("image"),
    createdAt: timestamp("createdAt", { withTimezone: true })
        .defaultNow()
        .notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true })
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
});

export const session = pgTable(
    "session",
    {
        id: text("id").primaryKey(),
        expiresAt: timestamp("expiresAt", { withTimezone: true }).notNull(),
        token: text("token").notNull().unique(),
        createdAt: timestamp("createdAt", {
            withTimezone: true,
        })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updatedAt", {
            withTimezone: true,
        })
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
        ipAddress: text("ipAddress"),
        userAgent: text("userAgent"),
        userId: text("userId")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
    },
    (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
    "account",
    {
        id: text("id").primaryKey(),
        accountId: text("accountId").notNull(),
        providerId: text("providerId").notNull(),
        userId: text("userId")
            .notNull()
            .references(() => user.id, {
                onDelete: "cascade",
            }),
        accessToken: text("accessToken"),
        refreshToken: text("refreshToken"),
        idToken: text("idToken"),
        accessTokenExpiresAt: timestamp("accessTokenExpiresAt", {
            withTimezone: true,
        }),
        refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt", {
            withTimezone: true,
        }),
        scope: text("scope"),
        password: text("password"),
        createdAt: timestamp("createdAt", { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updatedAt", {
            withTimezone: true,
        })
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
    "verification",
    {
        id: text("id").primaryKey(),
        identifier: text("identifier").notNull(),
        value: text("value").notNull(),
        expiresAt: timestamp("expiresAt", { withTimezone: true }).notNull(),
        createdAt: timestamp("createdAt", {
            withTimezone: true,
        })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updatedAt", {
            withTimezone: true,
        })
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const repository = pgTable("repository", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("userId")
        .notNull()
        .references(() => user.id, {
            onDelete: "cascade",
        }),
    githubId: integer("githubId").notNull().unique(),
    name: text("name").notNull(),
    fullName: text("fullName").notNull(),
    private: boolean("private").default(false).notNull(),
    htmlUrl: text("htmlUrl").notNull(),
    createdAt: timestamp("createdAt", {
        withTimezone: true,
    })
        .defaultNow()
        .notNull(),
    updatedAt: timestamp("updatedAt", {
        withTimezone: true,
    })
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
});

export const review = pgTable(
    "review",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        repositoryId: uuid("repositoryId")
            .notNull()
            .references(() => repository.id, {
                onDelete: "cascade",
            }),
        userId: text("userId")
            .notNull()
            .references(() => user.id, {
                onDelete: "cascade",
            }),
        prNumber: integer("prNumber").notNull(),
        prTitle: text("prTitle").notNull(),
        prUrl: text("prUrl").notNull(),
        status: reviewStatus("status").default("PENDING").notNull(),
        summary: text("summary"),
        riskScore: integer("riskScore"),
        comments: jsonb("comments"),
        error: text("error"),
        createdAt: timestamp("createdAt", {
            withTimezone: true,
        })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updatedAt", {
            withTimezone: true,
        })
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        index("review_repositoryId_idx").on(table.repositoryId),
        index("review_userId_idx").on(table.userId),
        index("review_status_idx").on(table.status),
    ],
);
