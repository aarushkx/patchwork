import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/api/root";
import { createTRPCContext } from "@/server/api/trpc";

const handler = async (req: Request) =>
    fetchRequestHandler({
        endpoint: "/api/trpc",
        req,
        router: appRouter,
        createContext: () => createTRPCContext({ headers: req.headers }),
        onError:
            process.env.NODE_ENV === "development"
                ? ({ path, error }) =>
                      console.error(`ERROR: tRPC failed on ${path}: ${error}`)
                : console.error,
    });

export { handler as GET, handler as POST };
