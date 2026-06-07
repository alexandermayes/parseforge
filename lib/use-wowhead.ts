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
    // tooltips.js loads afterInteractive, so the global may not exist yet when
    // an async analysis result renders. A single timer can fire before the
    // script is ready, leaving links unprocessed (item names stuck on the
    // "Item #id" placeholder). Poll until the global appears, then refresh.
    let attempts = 0;
    const tryRefresh = () => {
      const power = window.$WowheadPower ?? window.$WH?.Tooltips;
      if (power?.refreshLinks) {
        window.$WH?.Tooltips?.refreshLinks?.();
        window.$WowheadPower?.refreshLinks?.();
        return true;
      }
      return false;
    };
    if (tryRefresh()) return;
    const interval = setInterval(() => {
      attempts++;
      if (tryRefresh() || attempts >= 25) clearInterval(interval);
    }, 200);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
