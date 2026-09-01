"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store/useAppStore";

/**
 * Local persistence is skipped during SSR (no localStorage on the server),
 * so this hook reports when the client has finished rehydrating the store.
 * Screens that render persisted data should wait for this to avoid a
 * flash of default values or a hydration mismatch.
 */
export function useHasHydrated(): boolean {
  // useAppStore.persist can be unavailable during server-side prerendering
  // of this client component; the guard just defers to the client-side
  // effect below, which always has a real browser environment.
  const [hydrated, setHydrated] = useState(() => useAppStore.persist?.hasHydrated() ?? false);

  useEffect(() => {
    const persistApi = useAppStore.persist;
    if (!persistApi || persistApi.hasHydrated()) return;
    const unsub = persistApi.onFinishHydration(() => setHydrated(true));
    persistApi.rehydrate();
    return unsub;
  }, []);

  return hydrated;
}
