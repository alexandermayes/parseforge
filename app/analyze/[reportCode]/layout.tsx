import type { Metadata } from "next";

interface Props {
  params: Promise<{ reportCode: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { reportCode } = await params;

  return {
    title: `Report ${reportCode}`,
    description: `WoW Classic raid analysis for Warcraft Logs report ${reportCode} — DPS comparison, gear audit, buff tracking, and improvement suggestions.`,
    openGraph: {
      title: `ParseForge — Report ${reportCode}`,
      description:
        "WoW Classic raid performance analysis with DPS percentiles, gear audits, and improvement suggestions.",
    },
    robots: {
      index: false,
    },
  };
}

export default function AnalyzeLayout({ children }: Props) {
  return children;
}
