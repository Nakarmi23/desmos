export interface HealthCheckResult {
  status: string;
  timestamp: Date;
}

export interface HealthCheckQueryState {
  isPending: boolean;
  isError: boolean;
  data: HealthCheckResult | undefined;
}

export type HealthViewModel =
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "success"; status: string; checkedAt: string };

export function toHealthViewModel(
  query: HealthCheckQueryState,
): HealthViewModel {
  if (query.isPending) {
    return { kind: "loading" };
  }

  // A settled query with no data has nothing to show, so it reads as a failure
  // rather than a success view with blank values.
  if (query.isError || !query.data) {
    return { kind: "error" };
  }

  return {
    kind: "success",
    status: query.data.status,
    checkedAt: query.data.timestamp.toLocaleTimeString(),
  };
}
