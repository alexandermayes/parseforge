import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a fight-relative millisecond offset as mm:ss.
 *
 * Shared by RaidOverview's death timeline (`app/components/RaidOverview.tsx`)
 * and the cast timeline (plan 02-02) so the two surfaces cannot drift apart
 * on how a fight time reads. A fight time is always relative to the fight's
 * own start, never to report start.
 */
export function formatFightTime(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${String(sec).padStart(2, "0")}`;
}
