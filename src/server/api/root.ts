import {
    createCallerFactory,
    createTRPCRouter,
    publicProcedure,
} from "@/server/api/trpc";
import { repositoryRouter } from "@/server/api/routers/repository";
import { pullRequestRouter } from "@/server/api/routers/pull-request";

export const appRouter = createTRPCRouter({
    health: publicProcedure.query(() => {
        return { status: "ok", timestamps: Date.now() };
    }),
    repository: repositoryRouter,
    pullRequest: pullRequestRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
