import { eq } from "drizzle-orm";
import { inngest } from "../client";

import { db } from "@/server/db";
import { review, repository } from "@/server/db/schema";

// import { reviewCode } from "@/server/services/ai";
import {
    fetchPullRequest,
    fetchPullRequestFiles,
    getGitHubAccessToken,
} from "@/server/services/github";

export type ReviewPREvent = {
    name: "review/pr.requested";
    data: {
        reviewId: string;
        repositoryId: string;
        prNumber: number;
        userId: string;
    };
};

export const reviewPr = inngest.createFunction(
    {
        id: "review-pr",
        retries: 2,
        triggers: { event: "review/pr.requested" },
    },
    async ({ event, step }) => {
        const { reviewId, repositoryId, prNumber, userId } = event.data;

        // Mark review as PROCESSING
        await step.run("update-status-processing", async () => {
            await db
                .update(review)
                .set({ status: "PROCESSING" })
                .where(eq(review.id, reviewId));
        });

        // Get repository
        const repo = await step.run("get-repository", async () => {
            const result = await db
                .select()
                .from(repository)
                .where(eq(repository.id, repositoryId))
                .limit(1);

            return result[0] ?? null;
        });

        if (!repo) {
            await step.run("mark-failed-no-repo", async () => {
                await db
                    .update(review)
                    .set({
                        status: "FAILED",
                        error: "No repository found",
                    })
                    .where(eq(review.id, reviewId));
            });

            return {
                success: false,
                error: "No repository found",
            };
        }

        // Get GitHub access token
        const accessToken = await step.run("get-access-token", async () => {
            return getGitHubAccessToken(userId);
        });

        if (!accessToken) {
            await step.run("mark-failed-no-token", async () => {
                await db
                    .update(review)
                    .set({
                        status: "FAILED",
                        error: "GitHub access token not found",
                    })
                    .where(eq(review.id, reviewId));
            });

            return {
                success: false,
                error: "GitHub access token not found",
            };
        }

        // Parse repository name
        const [owner, repoName] = repo.fullName.split("/");
        if (!owner || !repoName) {
            await step.run("mark-failed-invalid-repo", async () => {
                await db
                    .update(review)
                    .set({
                        status: "FAILED",
                        error: "Invalid repository name",
                    })
                    .where(eq(review.id, reviewId));
            });

            return {
                success: false,
                error: "Invalid repository name",
            };
        }

        // Fetch PR files
        const files = await step.run("fetch-pr-files", async () => {
            return fetchPullRequestFiles(
                accessToken,
                owner,
                repoName,
                prNumber,
            );
        });

        // TODO: add AI code review here
        const reviewResult = await step.run("generate-review", async () => {
            return {
                summary: `Reviewed ${files.length} files with ${files.reduce((sum, f) => sum + f.additions, 0)} additions and ${files.reduce((sum, f) => sum + f.deletions, 0)} deletions.`,
                riskScore: Math.floor(Math.random() * 100),
                comments: files.slice(0, 3).map((file) => ({
                    file: file.filename,
                    line: 1,
                    severity: "low" as const,
                    message: `File ${file.status}: ${file.additions} additions, ${file.deletions} deletions`,
                })),
            };
        });

        await step.run("save-review-result", async () => {
            await db
                .update(review)
                .set({
                    status: "COMPLETED",
                    summary: reviewResult.summary,
                    riskScore: reviewResult.riskScore,
                    comments: reviewResult.comments,
                })
                .where(eq(review.id, reviewId));
        });

        return { success: true, reviewId };
    },
);
