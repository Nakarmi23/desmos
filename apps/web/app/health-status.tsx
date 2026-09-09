"use client";

import { useQuery } from "@tanstack/react-query";

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
        API status: <span className="font-medium">{data.status}</span>{" "}
        (checked {data.timestamp.toLocaleTimeString()})
      </p>
      <button
        type="button"
        onClick={() => refetch()}
        disabled={isFetching}
        className="flex h-12 items-center justify-center rounded-full border border-solid border-black/[.08] px-5 text-base font-medium transition-colors hover:border-transparent hover:bg-black/[.04] disabled:opacity-50 dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
      >
        {isFetching ? "Checking…" : "Recheck via HTTP"}
      </button>
    </div>
  );
}
