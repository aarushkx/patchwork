"use client";

import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export const HealthCheck = () => {
    const { data, isLoading, error } = trpc.health.useQuery();

    if (isLoading) {
        return <Skeleton className="h-6 w-24" />;
    }
    if (error) {
        return <Badge variant="destructive">Error</Badge>;
    }

    return (
        <Badge variant={data?.status === "ok" ? "default" : "destructive"}>
            API: {data?.status} {data?.timestamps}
        </Badge>
    );
};
