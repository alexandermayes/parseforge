"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useCallback } from "react";

/**
 * Tab state backed by a URL search param, so the active sub-view is shareable
 * and deep-linkable (the Share button copies window.location.href). Defaults
 * are omitted from the URL to keep it clean, and an optional allow-list guards
 * against stale or hand-edited values that wouldn't match any tab.
 */
export function useUrlTabState(
  key: string,
  defaultValue: string,
  allowed?: readonly string[],
): [string, (value: string) => void] {
  const searchParams = useSearchParams();
  const router = useRouter();

  const raw = searchParams.get(key);
  const value = raw && (!allowed || allowed.includes(raw)) ? raw : defaultValue;

  const setValue = useCallback(
    (next: string) => {
      const params = new URLSearchParams(window.location.search);
      if (next === defaultValue) params.delete(key);
      else params.set(key, next);
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [key, defaultValue, router],
  );

  return [value, setValue];
}
