"use client";

import { use, useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    ArrowLeft,
    GitPullRequest,
    GitMerge,
    ExternalLink,
    Clock,
    Plus,
    Minus,
    FileText,
    XCircle,
    GitBranch,
    ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import DiffViewer from "@/components/custom/diff-viewer";

type PageProps = {
    params: Promise<{ id: string; prNumber: string }>;
};

const PullRequestDetailPage = ({ params }: PageProps) => {
    const { id, prNumber } = use(params);
    const prNum = parseInt(prNumber, 10);
    const [activeTab, setActiveTab] = useState<"review" | "files">("review");

    const pr = trpc.pullRequest.get.useQuery(
        { repositoryId: id, prNumber: prNum },
        { enabled: !isNaN(prNum) },
    );

    const files = trpc.pullRequest.files.useQuery(
        { repositoryId: id, prNumber: prNum },
        { enabled: !isNaN(prNum) },
    );

    if (pr.isLoading) {
        return (
            <div className="space-y-8">
                <div className="flex items-center gap-4">
                    <Skeleton className="size-10 rounded-lg" />
                    <div className="space-y-2">
                        <Skeleton className="h-7 w-96" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                </div>
                <Skeleton className="h-24 w-full rounded-xl" />
                <Skeleton className="h-64 w-full rounded-xl" />
            </div>
        );
    }

    if (pr.error || !pr.data) {
        return (
            <Card>
                <CardContent className="py-16 text-center">
                    <div className="mx-auto size-12 rounded-full bg-destructive/10 flex items-center justify-center">
                        <XCircle className="size-6 text-destructive" />
                    </div>
                    <p className="mt-4 font-medium text-destructive">
                        {pr.error?.message ?? "Pull Request not found"}
                    </p>
                    <Link href={`/repos/${id}`} className="mt-6 inline-block">
                        <Button variant={"outline"}>
                            <ArrowLeft className="size-4" />
                            Back to Repository
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        );
    }

    const isMerged = pr.data.state === "closed" && pr.data.mergedAt;

    return (
        <div className="space-y-8">
            <div className="flex items-start gap-4">
                <Link href={`/repos/${id}`}>
                    <Button
                        variant={"outline"}
                        size={"icon"}
                        className="shrink-0 mt-1"
                    >
                        <ArrowLeft className="size-4" />
                    </Button>
                </Link>

                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                            <div className="flex items-center gap-3 flex-wrap">
                                <div
                                    className={cn(
                                        "p-2 rounded-lg shrink-0",
                                        isMerged
                                            ? "bg-purple-500/10"
                                            : pr.data.state === "closed"
                                              ? "bg-red-500/10"
                                              : "bg-emerald-500/10",
                                    )}
                                >
                                    {isMerged ? (
                                        <GitMerge className="size-5 text-purple-500" />
                                    ) : pr.data.state === "closed" ? (
                                        <XCircle className="size-5 text-red-500" />
                                    ) : (
                                        <GitPullRequest className="size-5 text-emerald-500" />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <h1 className="text-xl font-semibold tracking-tight truncate">
                                        {pr.data.title}
                                    </h1>
                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                        <PRStatusBadge
                                            state={pr.data.state}
                                            isMerged={!!isMerged}
                                            draft={pr.data.draft}
                                        />
                                        <span className="text-sm text-muted-foreground font-mono">
                                            #{pr.data.number}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <a
                            href={pr.data.htmlUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0"
                        >
                            <Button
                                variant={"outline"}
                                size={"sm"}
                                className="gap-2"
                            >
                                <ExternalLink className="size-4" />
                                GitHub
                            </Button>
                        </a>
                    </div>

                    <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-2">
                            <Avatar className="h-5 w-5 ring-1 ring-border">
                                <AvatarImage src={pr.data.author.avatarUrl} />
                                <AvatarFallback className="text-[10px]">
                                    {pr.data.author.login?.[0]?.toUpperCase() ??
                                        "?"}
                                </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-foreground">
                                {pr.data.author.login}
                            </span>
                        </span>
                        <span className="text-muted-foreground/40">•</span>
                        <span className="flex items-center gap-1.5">
                            <Clock className="size-3.5" />
                        </span>
                    </div>
                </div>
            </div>

            <Card>
                <CardContent className="p-0">
                    <div className="flex items-center divide-x divide-border/60">
                        <div className="flex-1 p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-muted">
                                    <GitBranch className="size-4 text-muted-foreground" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs text-muted-foreground mb-1">
                                        Merged request
                                    </p>
                                    <div className="flex items-center gap-2 text-sm">
                                        <code className="px-2 py-0.5 rounded bg-secondary font-mono text-xs miw truncate">
                                            {pr.data.headRef}
                                        </code>
                                        <ArrowRight className="size-3 text-muted-foreground shrink-0" />
                                        <code className="px-2 py-0.5 rounded bg-secondary font-mono text-xs truncate">
                                            {pr.data.baseRef}
                                        </code>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-6 px-6 py-4">
                            <StatItem
                                icon={Plus}
                                value={pr.data.additions}
                                colorClass="text-emerald-600 dark:text-emerald-400"
                                bgClass="bg-emerald-500/10"
                            />
                            <StatItem
                                icon={Minus}
                                value={pr.data.deletions}
                                colorClass="text-red-600 dark:text-red-400"
                                bgClass="bg-red-500/10"
                            />
                            <StatItem
                                icon={FileText}
                                value={pr.data.changedFiles}
                                colorClass="text-muted-foreground dark:text-muted-foreground"
                                bgClass="bg-muted"
                            />
                        </div>

                        <div className="px-6 py-4 flex items-center gap-3">
                            <div className="flex items-center gap-2 rounded-lg px-3 py-1.5">
                                {/* TODO: Review status badge */}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tabs */}
            <div className="border-b border-border/60">
                <div className="flex items-center gap-1">
                    {/* TODO: Tab button */}

                    <TabButton
                        active={activeTab === "files"}
                        onClick={() => setActiveTab("files")}
                        icon={FileText}
                        label="Changed Files"
                        count={files.data?.length}
                    />
                </div>
            </div>

            {/* Tab Content */}
            {/* TODO */}

            {activeTab === "files" && (
                <div>
                    {files.isLoading ? (
                        <div className="space-y-3">
                            {[...Array(3)].map((_, i) => (
                                <Skeleton
                                    key={i}
                                    className="h-32 w-full rounded-xl"
                                />
                            ))}
                        </div>
                    ) : files.error ? (
                        <Card className="border-destructive/50">
                            <CardContent className="py-12 text-center">
                                <div className="mx-auto size-12 rounded-full bg-destructive/10 flex items-center justify-center">
                                    <XCircle className="size-6 text-destructive" />
                                </div>
                                <p className="mt-4 font-medium text-destructive">
                                    No files changed.
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {files.error.message}
                                </p>
                            </CardContent>
                        </Card>
                    ) : files.data ? (
                        <DiffViewer files={files.data} />
                    ) : null}
                </div>
            )}
        </div>
    );
};

const TabButton = ({
    active,
    onClick,
    icon: Icon,
    label,
    count,
}: {
    active: boolean;
    onClick: () => void;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    count?: number;
}) => {
    return (
        <button
            onClick={onClick}
            className={cn(
                "relative px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-2",
                active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
            )}
        >
            <Icon className="size-4" />
            {label}
            {count !== undefined && (
                <span
                    className={cn(
                        "px-1.5 py-0.5 text-xs rounded-md tabular-nums",
                        active
                            ? "bg-foreground/10 text-foreground"
                            : "bg-muted text-muted-foreground",
                    )}
                >
                    {count}
                </span>
            )}
            {active && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
        </button>
    );
};

const StatItem = ({
    icon: Icon,
    value,
    label,
    colorClass,
    bgClass,
}: {
    icon: React.ComponentType<{ className?: string }>;
    value: number;
    label?: string;
    colorClass: string;
    bgClass: string;
}) => {
    return (
        <div className="flex items-center gap-2">
            <div className={cn("p-1.5 rounded-md", bgClass)}>
                <Icon className={cn("size-3.5", colorClass)} />
            </div>
            <div>
                <p
                    className={cn(
                        "text-sm font-semibold tabular-nums",
                        colorClass,
                    )}
                >
                    {value.toLocaleString()}
                </p>
                {label && (
                    <p className={cn("text-xs font-medium", colorClass)}>
                        {label}
                    </p>
                )}
            </div>
        </div>
    );
};

const PRStatusBadge = ({
    state,
    isMerged,
    draft,
}: {
    state: string;
    isMerged: boolean;
    draft: boolean;
}) => {
    if (draft) {
        return (
            <Badge variant={"secondary"} className="gap-1">
                Draft
            </Badge>
        );
    }

    if (isMerged) {
        return (
            <Badge
                variant={"secondary"}
                className="bg-purple-600/10 dark:text-purple-400 border-purple-500/20 border"
            >
                <GitMerge className="size-3" />
                Merged
            </Badge>
        );
    }

    if (state === "closed") {
        return (
            <Badge variant={"destructive"} className="gap-1">
                <XCircle className="size-3" />
                Closed
            </Badge>
        );
    }

    if (state === "open") {
        return (
            <Badge
                variant={"secondary"}
                className="gap-1 bg-emerald-600/10 dark:text-emerald-400 border-emerald-500/20 border"
            >
                <GitMerge className="size-3" />
                Open
            </Badge>
        );
    }
};

export default PullRequestDetailPage;
