"use client";

import { useQuery } from "@tanstack/react-query";
import type { ReactElement } from "react";

import { useTRPC } from "@/trpc/client";

import { healthCheckStyles } from "./health-check.styles";
import { toHealthViewModel, type HealthViewModel } from "./health-view-model";

const styles = healthCheckStyles();

export function HealthCheck() {
  const trpc = useTRPC();
  const query = useQuery(trpc.health.check.queryOptions());
  const view = toHealthViewModel(query);

  // The live region wraps all three states and stays mounted across them, so a
  // screen reader announces each transition instead of only the first render.
  return (
    <div role="status" aria-live="polite">
      {renderView(view)}
    </div>
  );
}

// The explicit `ReactElement` return type turns an unhandled `kind` into a type
// error here rather than a silently empty page.
function renderView(view: HealthViewModel): ReactElement {
  switch (view.kind) {
    case "loading":
      return <p className={styles.loading()}>Checking API health…</p>;

    case "error":
      return <ErrorMessage />;

    case "success":
      return (
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
      );
  }
}

function ErrorMessage() {
  return (
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
        <p className={styles.errorTitle()}>Can&apos;t reach the health check</p>
        <p className={styles.errorBody()}>
          Check your connection and try again.
        </p>
      </div>
    </div>
  );
}
