"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    $WH?: {
      Tooltips?: {
        refreshLinks: () => void;
      };
    };
    $WowheadPower?: {
      refreshLinks: () => void;
    };
  }
}

/** Call after rendering any component with data-wowhead links */
export function useWowheadTooltips(deps: unknown[] = []) {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.$WH?.Tooltips?.refreshLinks?.();
      window.$WowheadPower?.refreshLinks?.();
    }, 100);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
