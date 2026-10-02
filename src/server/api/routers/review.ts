import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { inngest } from "@/server/inngest";
import {
    fetchPullRequest,
    getGitHubAccessToken,
} from "@/server/services/github";
import { repository, review } from "@/server/db/schema";

export const reviewRouter = createTRPCRouter({
    trigger: protectedProcedure
        .input(
            z.object({
                repositoryId: z.string(),
                prNumber: z.number(),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            // Find repository
            const repositoryResult = await ctx.db
                .select()
                .from(repository)
                .where(
                    and(
                        eq(repository.id, input.repositoryId),
                        eq(repository.userId, ctx.user.id),
                    ),
                )
                .limit(1);

            const repo = repositoryResult[0];
            if (!repo) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Repository not found",
                });
            }

            // Get GitHub access token
            const accessToken = await getGitHubAccessToken(ctx.user.id);
            if (!accessToken) {
                throw new TRPCError({
                    code: "PRECONDITION_FAILED",
                    message: "GitHub account not connected",
                });
            }

            // Get owner and repository name
            const [owner, repoName] = repo.fullName.split("/");
            if (!owner || !repoName) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Invalid repository name",
                });
            }

            // Fetch PR from GitHub
            const pr = await fetchPullRequest(
                accessToken,
                owner,
                repoName,
                input.prNumber,
            );

            // Create review
            const reviewResult = await ctx.db
                .insert(review)
                .values({
                    repositoryId: repo.id,
                    userId: ctx.user.id,
                    prNumber: pr.number,
                    prTitle: pr.title,
                    prUrl: pr.html_url,
                    status: "PENDING",
                })
                .returning();

            const newReview = reviewResult[0];
            if (!newReview) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to create review",
                });
            }

            // Trigger background review
            await inngest.send({
                name: "review/pr.requested",
                data: {
                    reviewId: newReview.id,
                    repositoryId: repo.id,
                    prNumber: pr.number,
                    userId: ctx.user.id,
                },
            });

            return { reviewId: newReview.id };
        }),

    get: protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            const result = await ctx.db
                .select({
                    review: review,
                    repository: repository,
                })
                .from(review)
                .innerJoin(repository, eq(review.repositoryId, repository.id))
                .where(
                    and(
                        eq(review.id, input.id),
                        eq(review.userId, ctx.user.id),
                    ),
                )
                .limit(1);

            const resultItem = result[0];
            if (!resultItem) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Review not found",
                });
            }

            return {
                ...resultItem.review,
                repository: resultItem.repository,
            };
        }),

    list: protectedProcedure
        .input(
            z.object({
                repositoryId: z.string().optional(),
                limit: z.number().min(1).max(50).default(20),
            }),
        )
        .query(async ({ ctx, input }) => {
            const conditions = [eq(review.userId, ctx.user.id)];

            if (input.repositoryId) {
                conditions.push(eq(review.repositoryId, input.repositoryId));
            }

            const reviews = await ctx.db
                .select({
                    review: review,
                    repository: repository,
                })
                .from(review)
                .innerJoin(repository, eq(review.repositoryId, repository.id))
                .where(and(...conditions))
                .orderBy(desc(review.createdAt))
                .limit(input.limit);

            return reviews.map((item) => ({
                ...item.review,
                repository: item.repository,
            }));
        }),

    getLatestForPR: protectedProcedure
        .input(
            z.object({
                repositoryId: z.string(),
                prNumber: z.number(),
            }),
        )
        .query(async ({ ctx, input }) => {
            const result = await ctx.db
                .select()
                .from(review)
                .where(
                    and(
                        eq(review.repositoryId, input.repositoryId),
                        eq(review.prNumber, input.prNumber),
                        eq(review.userId, ctx.user.id),
                    ),
                )
                .orderBy(desc(review.createdAt))
                .limit(1);

            return result[0] ?? null;
        }),
});
