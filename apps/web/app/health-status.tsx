"use client";

import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/button/button";
import { useTRPC } from "@/trpc/client";

export default function HealthStatus() {
  const trpc = useTRPC();
  const { data, refetch, isFetching } = useQuery(
    trpc.health.check.queryOptions(),
  );

  if (!data) {
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-3 sm:items-start">
      <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
        API status: <span className="font-medium">{data.status}</span> (checked{" "}
        {data.timestamp.toLocaleTimeString()})
      </p>
      <Button
        onClick={() => refetch()}
        loading={isFetching}
        className="rounded-full"
        size="lg"
      >
        {isFetching ? "Checking…" : "Recheck via HTTP"}
      </Button>
    </div>
  );
}
