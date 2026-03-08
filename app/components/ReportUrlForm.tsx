"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { parseWCLUrl } from "@/lib/url-parser";

export default function ReportUrlForm() {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const parsed = parseWCLUrl(url);
    if (!parsed) {
      setError(
        "Invalid Warcraft Logs URL. Paste a URL like: https://classic.warcraftlogs.com/reports/ABC123"
      );
      return;
    }

    setLoading(true);
    let path = `/analyze/${parsed.code}`;
    const params = new URLSearchParams();
    if (parsed.fightId) params.set("fight", String(parsed.fightId));
    if (parsed.sourceId) params.set("source", String(parsed.sourceId));
    if (params.toString()) path += `?${params.toString()}`;

    router.push(path);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      <div className="flex gap-2">
        <Input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste Warcraft Logs report URL..."
          className="flex-1 h-12 bg-surface-1 text-base focus-visible:glow-border-gold"
          disabled={loading}
        />
        <ShimmerButton
          type="submit"
          disabled={loading || !url.trim()}
          shimmerColor="#D4A843"
          shimmerSize="0.05em"
          background="linear-gradient(135deg, oklch(0.82 0.16 85), oklch(0.72 0.14 60))"
          borderRadius="8px"
          className="h-12 px-8 text-base font-semibold disabled:opacity-50 disabled:pointer-events-none"
        >
          {loading ? "Loading..." : "Analyze"}
        </ShimmerButton>
      </div>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <p className="text-caption">
        Supports Classic and Season of Discovery reports. Example:{" "}
        <code className="rounded bg-surface-2 px-1.5 py-0.5 text-xs">
          https://classic.warcraftlogs.com/reports/ABC123#fight=5&source=12
        </code>
      </p>
    </form>
  );
}
