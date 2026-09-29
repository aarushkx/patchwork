import { and, desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { repository } from "@/server/db/schema";
import { fetchGitHubRepos, getGithubAccessToken } from "@/services/github";

export const repositoryRouter = createTRPCRouter({
    // List connected repos
    list: protectedProcedure.query(async ({ ctx }) => {
        const repositories = await ctx.db
            .select()
            .from(repository)
            .where(eq(repository.userId, ctx.user.id))
            .orderBy(desc(repository.createdAt));

        return repositories;
    }),

    // Fetch repos from GitHub
    fetchFromGithub: protectedProcedure.query(async ({ ctx }) => {
        const accessToken = await getGithubAccessToken(ctx.user.id);
        if (!accessToken) {
            throw new TRPCError({
                code: "PRECONDITION_FAILED",
                message: "User has not authorized GitHub access",
            });
        }

        const repos = await fetchGitHubRepos(accessToken);

        return repos.map((repo) => ({
            githubId: repo.id,
            name: repo.name,
            fullName: repo.full_name,
            private: repo.private,
            htmlUrl: repo.html_url,
            description: repo.description,
            language: repo.language,
            stars: repo.stargazers_count,
            updatedAt: repo.updated_at,
        }));
    }),

    // Connect repos
    connect: protectedProcedure
        .input(
            z.object({
                repos: z.array(
                    z.object({
                        githubId: z.number(),
                        name: z.string(),
                        fullName: z.string(),
                        private: z.boolean(),
                        htmlUrl: z.string(),
                    }),
                ),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            const result = await Promise.all(
                input.repos.map((repo) =>
                    ctx.db
                        .insert(repository)
                        .values({
                            userId: ctx.user.id,
                            githubId: repo.githubId,
                            name: repo.name,
                            fullName: repo.fullName,
                            private: repo.private,
                            htmlUrl: repo.htmlUrl,
                        })
                        .onConflictDoUpdate({
                            target: repository.githubId,
                            set: {
                                name: repo.name,
                                fullName: repo.fullName,
                                private: repo.private,
                                htmlUrl: repo.htmlUrl,
                                updatedAt: new Date(),
                            },
                        })
                        .returning(),
                ),
            );

            return { connected: result.length };
        }),

    // Disconnect repos
    disconnect: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            await ctx.db
                .delete(repository)
                .where(
                    and(
                        eq(repository.id, input.id),
                        eq(repository.userId, ctx.user.id),
                    ),
                );

            return { success: true };
        }),
});
