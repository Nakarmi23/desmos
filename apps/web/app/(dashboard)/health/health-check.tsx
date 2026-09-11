"use client";

import { useQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";

import { healthCheckStyles } from "./health-check.styles";
import { toHealthViewModel } from "./health-view-model";

const styles = healthCheckStyles();

export function HealthCheck() {
  const trpc = useTRPC();
  const query = useQuery(trpc.health.check.queryOptions());
  const view = toHealthViewModel(query);

  return (
    <div role="status" aria-live="polite">
      {view.kind === "loading" && (
        <p className={styles.loading()}>Checking API health…</p>
      )}

      {view.kind === "error" && (
        <div className={styles.errorMessage()}>
          <svg
            aria-hidden
            viewBox="0 0 16 16"
            fill="none"
            className={styles.errorIcon()}
          >
            <circle
              cx="8"
              cy="8"
              r="6.25"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M8 5.25v3.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <circle cx="8" cy="10.75" r="0.75" fill="currentColor" />
          </svg>
          <div>
            <p className={styles.errorTitle()}>
              Can&apos;t reach the health check
            </p>
            <p className={styles.errorBody()}>
              Check your connection and try again.
            </p>
          </div>
        </div>
      )}

      {view.kind === "success" && (
        <dl className={styles.resultList()}>
          <div className={styles.resultRow()}>
            <dt className={styles.resultLabel()}>Status</dt>
            <dd className={styles.resultValue()}>{view.status}</dd>
          </div>
          <div className={styles.resultRow()}>
            <dt className={styles.resultLabel()}>Checked at</dt>
            <dd className={styles.resultValue()}>{view.checkedAt}</dd>
          </div>
        </dl>
      )}
    </div>
  );
}
