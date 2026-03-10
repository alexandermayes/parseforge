import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "ParseForge — WoW Classic Log Analyzer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#1b1b2e",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Subtle gradient accent */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "4px",
            background: "linear-gradient(90deg, #D4A843, #F59E0B, #D4A843)",
          }}
        />

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "24px",
          }}
        >
          {/* Logo + Title */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "20px",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://parseforge.gg/logo.png"
              width={64}
              height={64}
              alt=""
            />
            <span
              style={{
                fontSize: "64px",
                fontWeight: 800,
                background: "linear-gradient(135deg, #D4A843, #F59E0B)",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              ParseForge
            </span>
          </div>

          {/* Tagline */}
          <p
            style={{
              fontSize: "28px",
              color: "#a1a1aa",
              margin: 0,
              textAlign: "center",
              maxWidth: "700px",
            }}
          >
            Analyze your WoW Classic raid logs against top-ranked players
          </p>

          {/* Feature pills */}
          <div
            style={{
              display: "flex",
              gap: "12px",
              marginTop: "16px",
            }}
          >
            {["DPS Analysis", "Gear Audit", "Raid Overview", "Buff Tracking"].map(
              (label) => (
                <div
                  key={label}
                  style={{
                    padding: "8px 20px",
                    borderRadius: "9999px",
                    border: "1px solid rgba(212, 168, 67, 0.3)",
                    color: "#D4A843",
                    fontSize: "16px",
                    fontWeight: 600,
                  }}
                >
                  {label}
                </div>
              )
            )}
          </div>
        </div>

        {/* URL */}
        <p
          style={{
            position: "absolute",
            bottom: "32px",
            fontSize: "18px",
            color: "#52525b",
            fontWeight: 500,
          }}
        >
          parseforge.gg
        </p>
      </div>
    ),
    { ...size }
  );
}
