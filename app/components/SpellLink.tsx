"use client";

/**
 * Build a map of guid → display name, appending "(Rank N)" when
 * multiple abilities share the same base name but have different guids.
 * Lower guid = lower rank (matches WoW's spell ID ordering).
 */
export function buildRankedNames(items: { name: string; guid: number }[]): Map<number, string> {
  // Group guids by base name
  const byName = new Map<string, number[]>();
  for (const item of items) {
    const existing = byName.get(item.name);
    if (existing) {
      if (!existing.includes(item.guid)) existing.push(item.guid);
    } else {
      byName.set(item.name, [item.guid]);
    }
  }

  const result = new Map<number, string>();
  for (const [name, guids] of byName) {
    if (guids.length === 1) {
      result.set(guids[0], name);
    } else {
      // Sort by guid ascending (lower guid = lower rank)
      guids.sort((a, b) => a - b);
      for (let i = 0; i < guids.length; i++) {
        result.set(guids[i], `${name} (Rank ${i + 1})`);
      }
    }
  }
  return result;
}

export default function SpellLink({
  name,
  guid,
  domain = "tbc",
  className = "",
}: {
  name: string;
  guid: number;
  domain?: string;
  className?: string;
}) {
  // Wowhead tooltips require <a> with data-wowhead. renameLinks replaces
  // the <a>'s text content, but cannot touch children inside a <span>.
  return (
    <a
      href={`#spell-${guid}`}
      onClick={(e) => e.preventDefault()}
      className={`no-underline ${className}`}
      data-wowhead={`spell=${guid}&domain=${domain}`}
    >
      <span className="pointer-events-none">{name}</span>
    </a>
  );
}
