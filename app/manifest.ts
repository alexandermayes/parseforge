import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ParseForge",
    short_name: "ParseForge",
    description:
      "Analyze your WoW Classic raid logs against top-ranked players",
    start_url: "/",
    display: "standalone",
    background_color: "#0c0c0f",
    theme_color: "#D4A843",
    icons: [
      {
        src: "/icon.png",
        sizes: "64x64",
        type: "image/png",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
