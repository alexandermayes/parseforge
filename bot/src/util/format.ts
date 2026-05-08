export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(0);
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function formatPercentile(p: number): string {
  if (p >= 95) return `**${p}** (Legendary)`;
  if (p >= 75) return `**${p}** (Epic)`;
  if (p >= 50) return `**${p}** (Rare)`;
  if (p >= 25) return `**${p}** (Common)`;
  return `**${p}** (Grey)`;
}
