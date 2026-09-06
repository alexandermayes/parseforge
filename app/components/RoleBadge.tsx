"use client";

import type { RaidRole } from "@/lib/wcl-types";
import { roleColor, roleColorAlpha } from "@/lib/constants";

export default function RoleBadge({ role }: { role: RaidRole }) {
  return (
    <span
      className="text-xs font-semibold px-1.5 py-0.5 rounded"
      style={{
        color: roleColor(role),
        backgroundColor: roleColorAlpha(role, 20),
      }}
    >
      {role}
    </span>
  );
}
