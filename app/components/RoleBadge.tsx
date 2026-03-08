"use client";

import type { RaidRole } from "@/lib/wcl-types";
import { ROLE_COLORS } from "@/lib/constants";

export default function RoleBadge({ role }: { role: RaidRole }) {
  return (
    <span
      className="text-xs font-semibold px-1.5 py-0.5 rounded"
      style={{
        color: ROLE_COLORS[role],
        backgroundColor: ROLE_COLORS[role] + "20",
      }}
    >
      {role}
    </span>
  );
}
