"use client";

import { Hammer, Shield, TrendingUp, Sparkles, Heart } from "lucide-react";
import { BlurFade } from "@/components/ui/blur-fade";
import { MagicCard } from "@/components/ui/magic-card";
import { SparklesText } from "@/components/ui/sparkles-text";
import { Particles } from "@/components/ui/particles";
import { BorderBeam } from "@/components/ui/border-beam";
import { AnimatedShinyText } from "@/components/ui/animated-shiny-text";
import ReportUrlForm from "./ReportUrlForm";
import RecentReports from "./RecentReports";

const features = [
  {
    icon: Hammer,
    title: "DPS Analysis",
    description:
      "Compare your damage against top-ranked players with percentile breakdowns and rotation insights.",
  },
  {
    icon: Shield,
    title: "Gear & Enchant Audit",
    description:
      "Spot missing enchants, suboptimal gems, and gear upgrades at a glance.",
  },
  {
    icon: TrendingUp,
    title: "Raid Overview",
    description:
      "Full raid performance board — consumables, activity, deaths, and throughput for every player.",
  },
  {
    icon: Sparkles,
    title: "Buff & Gear Audit",
    description:
      "Consumable & buff uptime tracking across all fights with detailed per-player breakdowns.",
  },
];

export function LandingHero() {
  return (
    <div className="relative w-full max-w-3xl space-y-14 text-center">
      {/* Background particles */}
      <Particles
        className="absolute inset-0 -z-10"
        quantity={25}
        color="#D4A843"
        size={0.3}
        staticity={80}
      />

      {/* Title */}
      <BlurFade delay={0} inView>
        <SparklesText
          className="text-display sm:text-5xl text-gold-from"
          colors={{ first: "#D4A843", second: "#7C5CFC" }}
          sparklesCount={8}
        >
          ParseForge
        </SparklesText>
      </BlurFade>

      {/* Subtitle */}
      <BlurFade delay={0.1} inView>
        <p className="text-body text-lg text-muted-foreground">
          Compare your{" "}
          <AnimatedShinyText className="inline text-lg font-medium text-foreground" shimmerWidth={120}>
            WoW Classic
          </AnimatedShinyText>{" "}
          performance against{" "}
          <AnimatedShinyText className="inline text-lg font-medium text-foreground" shimmerWidth={120}>
            top-ranked players
          </AnimatedShinyText>
          .
          <br />
          Get actionable suggestions for DPS, gear, talents, buffs, and rotation.
        </p>
      </BlurFade>

      {/* Input form with border beam */}
      <BlurFade delay={0.2} inView>
        <div className="relative rounded-xl glass-strong p-6">
          <BorderBeam
            size={120}
            duration={8}
            colorFrom="#D4A843"
            colorTo="#7C5CFC"
            borderWidth={1}
          />
          <ReportUrlForm />
        </div>
      </BlurFade>

      {/* Recent reports */}
      <BlurFade delay={0.25} inView>
        <RecentReports />
      </BlurFade>

      {/* Feature cards */}
      <BlurFade delay={0.3} inView>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
          {features.map((f, i) => (
            <MagicCard
              key={f.title}
              className="rounded-xl p-4 cursor-default"
              gradientColor="oklch(0.21 0.015 270)"
              gradientFrom="#D4A843"
              gradientTo="#7C5CFC"
              gradientOpacity={0.15}
              gradientSize={250}
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <f.icon className="w-5 h-5 text-gold-from" />
                  <h3 className="font-semibold text-sm">{f.title}</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {f.description}
                </p>
              </div>
            </MagicCard>
          ))}
        </div>
      </BlurFade>

      {/* Footer */}
      <BlurFade delay={0.4} inView>
        <footer className="text-xs text-muted-foreground space-y-1">
          <p>
            Powered by the{" "}
            <a
              href="https://www.warcraftlogs.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold-from hover:underline"
            >
              Warcraft Logs
            </a>{" "}
            v2 API
          </p>
          <p>Supports Classic Era, Season of Discovery, and Anniversary</p>
          <p>Built with <Heart className="inline w-3 h-3 text-status-bad fill-status-bad -mt-0.5" /> by <a href="https://discord.gg/bigyikes" target="_blank" rel="noopener noreferrer" className="text-gold-from hover:underline">Big Yikes</a> for the WoW community.</p>
          <p><a href="https://github.com/alexandermayes/parseforge" target="_blank" rel="noopener noreferrer" className="text-gold-from hover:underline">GitHub</a></p>
        </footer>
      </BlurFade>
    </div>
  );
}
