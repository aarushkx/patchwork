import { eq, and } from "drizzle-orm";
import { db } from "@/server/db";
import { account } from "@/server/db/schema";

export interface GitHubRepo {
    id: number;
    name: string;
    full_name: string;
    private: boolean;
    html_url: string;
    description: string | null;
    language: string | null;
    stargazers_count: number;
    updated_at: string;
}

export async function getGithubAccessToken(
    userId: string,
): Promise<string | null> {
    const result = await db
        .select({
            accessToken: account.accessToken,
        })
        .from(account)
        .where(
            and(eq(account.userId, userId), eq(account.providerId, "github")),
        )
        .limit(1);

    return result[0]?.accessToken ?? null;
}

export async function fetchGitHubRepos(
    accessToken: string,
): Promise<GitHubRepo[]> {
    const repos: GitHubRepo[] = [];
    let page = 1;
    const perPage = 100;

    while (true) {
        const response = await fetch(
            `https://api.github.com/user/repos?per_page=${perPage}&page=${page}&sort=updated`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    Accept: "application/vnd.github.v3+json",
                },
            },
        );

        if (!response.ok) {
            throw new Error(`Failed to fetch GitHub repos: ${response.status}`);
        }

        const data = (await response.json()) as GitHubRepo[];
        repos.push(...data);

        if (data.length < perPage) break;
        page++;
    }

    return repos;
}
