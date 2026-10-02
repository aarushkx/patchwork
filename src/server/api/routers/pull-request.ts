import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { repository, review } from "@/server/db/schema";
import {
    fetchAllPullRequests,
    fetchPullRequest,
    fetchPullRequestFiles,
    getGitHubAccessToken,
} from "@/server/services/github";

export const pullRequestRouter = createTRPCRouter({
    // List Pull Requests
    list: protectedProcedure
        .input(
            z.object({
                repositoryId: z.string(),
                state: z.enum(["open", "closed", "all"]).default("open"),
            }),
        )
        .query(async ({ ctx, input }) => {
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

            const accessToken = await getGitHubAccessToken(ctx.user.id);

            if (!accessToken) {
                throw new TRPCError({
                    code: "PRECONDITION_FAILED",
                    message: "Github account not connected",
                });
            }

            const [owner, repoName] = repo.fullName.split("/");

            if (!owner || !repoName) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Invalid repository name",
                });
            }

            const prs = await fetchAllPullRequests(
                accessToken,
                owner,
                repoName,
                input.state,
            );

            const prNumbers = prs.map((pr) => pr.number);

            const existingReviews =
                prNumbers.length > 0
                    ? await ctx.db
                          .select({
                              prNumber: review.prNumber,
                              status: review.status,
                              createdAt: review.createdAt,
                          })
                          .from(review)
                          .where(
                              and(
                                  eq(review.repositoryId, repo.id),
                                  inArray(review.prNumber, prNumbers),
                              ),
                          )
                          .orderBy(desc(review.createdAt))
                    : [];

            const reviewMap = new Map(
                existingReviews.map((r) => [r.prNumber, r]),
            );

            return prs.map((pr) => ({
                id: pr.id,
                number: pr.number,
                title: pr.title,
                state: pr.state,
                draft: pr.draft,
                htmlUrl: pr.html_url,
                author: {
                    login: pr.user.login,
                    avatarUrl: pr.user.avatar_url,
                },
                headRef: pr.head.ref,
                baseRef: pr.base.ref,
                additions: pr.additions,
                deletions: pr.deletions,
                changedFiles: pr.changed_files,
                createdAt: pr.created_at,
                updatedAt: pr.updated_at,
                mergedAt: pr.merged_at,
                review: reviewMap.get(pr.number) ?? null,
            }));
        }),

    // Get Pull Request
    get: protectedProcedure
        .input(
            z.object({
                repositoryId: z.string(),
                prNumber: z.number(),
            }),
        )
        .query(async ({ ctx, input }) => {
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

            const accessToken = await getGitHubAccessToken(ctx.user.id);
            if (!accessToken) {
                throw new TRPCError({
                    code: "PRECONDITION_FAILED",
                    message: "GitHub account not connected",
                });
            }

            const [owner, repoName] = repo.fullName.split("/");
            if (!owner || !repoName) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Invalid repository name",
                });
            }

            const pr = await fetchPullRequest(
                accessToken,
                owner,
                repoName,
                input.prNumber,
            );

            const existingReviewResult = await ctx.db
                .select()
                .from(review)
                .where(
                    and(
                        eq(review.repositoryId, repo.id),
                        eq(review.prNumber, pr.number),
                    ),
                )
                .orderBy(desc(review.createdAt))
                .limit(1);

            const existingReview = existingReviewResult[0] ?? null;

            return {
                id: pr.id,
                number: pr.number,
                title: pr.title,
                state: pr.state,
                draft: pr.draft,
                htmlUrl: pr.html_url,
                author: {
                    login: pr.user.login,
                    avatarUrl: pr.user.avatar_url,
                },
                headRef: pr.head.ref,
                headSha: pr.head.sha,
                baseRef: pr.base.ref,
                additions: pr.additions,
                deletions: pr.deletions,
                changedFiles: pr.changed_files,
                createdAt: pr.created_at,
                updatedAt: pr.updated_at,
                mergedAt: pr.merged_at,
                review: existingReview,
            };
        }),

    // Get Pull Request Files
    files: protectedProcedure
        .input(
            z.object({
                repositoryId: z.string(),
                prNumber: z.number(),
            }),
        )
        .query(async ({ ctx, input }) => {
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

            const accessToken = await getGitHubAccessToken(ctx.user.id);
            if (!accessToken) {
                throw new TRPCError({
                    code: "PRECONDITION_FAILED",
                    message: "GitHub account not connected",
                });
            }

            const [owner, repoName] = repo.fullName.split("/");
            if (!owner || !repoName) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Invalid repository name",
                });
            }

            const files = await fetchPullRequestFiles(
                accessToken,
                owner,
                repoName,
                input.prNumber,
            );

            return files.map((file) => ({
                sha: file.sha,
                filename: file.filename,
                status: file.status,
                additions: file.additions,
                deletions: file.deletions,
                changes: file.changes,
                patch: file.patch,
                previousFilename: file.previous_filename,
            }));
        }),
});
