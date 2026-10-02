import { eq, and } from "drizzle-orm";
import { db } from "@/server/db";
import { account } from "@/server/db/schema";

export interface GitHubUser {
    login: string;
    avatar_url: string;
}

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

export interface GitHubPullRequest {
    id: number;
    number: number;
    title: string;
    state: "open" | "closed";
    html_url: string;
    user: GitHubUser;
    created_at: string;
    updated_at: string;
    merged_at: string | null;
    draft: boolean;
    head: {
        ref: string;
        sha: string;
    };
    base: {
        ref: string;
    };
    additions: number;
    deletions: number;
    changed_files: number;
}

export interface GitHubPullRequestFile {
    sha: string;
    filename: string;
    status:
        | "added"
        | "removed"
        | "modified"
        | "renamed"
        | "copied"
        | "changed"
        | "unchanged";
    additions: number;
    deletions: number;
    changes: number;
    patch?: string;
    previous_filename?: string;
}

export async function getGitHubAccessToken(
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

export async function fetchAllPullRequests(
    accessToken: string,
    owner: string,
    repo: string,
    state: "open" | "closed" | "all" = "open",
): Promise<GitHubPullRequest[]> {
    const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/pulls?state=${state}&per_page=30&sort=updated&direction=desc`,
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: "application/vnd.github.v3+json",
            },
        },
    );

    if (!response.ok) {
        throw new Error(
            `Failed to fetch GitHub pull requests: ${response.status}`,
        );
    }

    const pulls = (await response.json()) as GitHubPullRequest[];
    const detailed = await Promise.all(
        pulls.map((pr) =>
            fetchPullRequest(accessToken, owner, repo, pr.number),
        ),
    );

    return detailed;
}

export async function fetchPullRequest(
    accessToken: string,
    owner: string,
    repo: string,
    prNumber: number,
): Promise<GitHubPullRequest> {
    const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`,
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: "application/vnd.github.v3+json",
            },
        },
    );

    if (!response.ok) {
        throw new Error(
            `Failed to fetch GitHub pull request: ${response.status}`,
        );
    }

    return (await response.json()) as GitHubPullRequest;
}

export async function fetchPullRequestFiles(
    accessToken: string,
    owner: string,
    repo: string,
    prNumber: number,
): Promise<GitHubPullRequestFile[]> {
    const files: GitHubPullRequestFile[] = [];
    let page = 1;
    const perPage = 100;

    while (true) {
        const response = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/files?per_page=${perPage}&page=${page}`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    Accept: "application/vnd.github.v3+json",
                },
            },
        );

        if (!response.ok) {
            throw new Error(
                `Failed to fetch GitHub pull request files: ${response.status}`,
            );
        }

        const data = (await response.json()) as GitHubPullRequestFile[];
        files.push(...data);

        if (data.length < perPage) break;
        page++;
    }

    return files;
}
