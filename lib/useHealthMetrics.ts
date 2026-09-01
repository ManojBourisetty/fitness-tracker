"use client";

import { useCallback, useEffect, useState } from "react";
import { useAppStore } from "@/lib/store/useAppStore";
import type { HealthMetricRow } from "@/lib/types";

type State = {
  rows: HealthMetricRow[];
  status: "idle" | "loading" | "ready" | "error";
  error: string | null;
};

/**
 * Fetches synced Apple Health rows from /api/health-data using the token
 * saved in Profile. Returns an empty, idle result when no token is set --
 * callers don't need to branch on whether sync is configured.
 */
export function useHealthMetrics(sinceDate?: string) {
  const token = useAppStore((s) => s.healthSyncToken);
  const [state, setState] = useState<State>({ rows: [], status: "idle", error: null });

  const refetch = useCallback(async () => {
    if (!token) {
      setState({ rows: [], status: "idle", error: null });
      return;
    }
    setState((s) => ({ ...s, status: "loading", error: null }));
    try {
      const url = new URL("/api/health-data", window.location.origin);
      if (sinceDate) url.searchParams.set("since", sinceDate);
      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error(res.status === 401 ? "Sync token was rejected" : `Request failed (${res.status})`);
      }
      const json = await res.json();
      setState({ rows: json.rows ?? [], status: "ready", error: null });
    } catch (err) {
      setState({
        rows: [],
        status: "error",
        error: err instanceof Error ? err.message : "Could not load synced data",
      });
    }
  }, [token, sinceDate]);

  useEffect(() => {
    // Fetching data in response to a changed dependency (the token) is the
    // canonical valid use of an effect; the state updates happen inside
    // refetch's async body, not synchronously here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refetch();
  }, [refetch]);

  return { ...state, refetch, hasToken: Boolean(token) };
}
