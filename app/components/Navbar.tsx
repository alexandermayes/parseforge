"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Hammer, Shield, TrendingUp, Sparkles, BarChart3, History } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: BarChart3,
    title: "DPS & HPS Analysis",
    description:
      "See how your throughput stacks up against the median and top players for your spec and encounter, with percentile rankings.",
  },
  {
    icon: Shield,
    title: "Gear & Enchant Audit",
    description:
      "Identify missing enchants, empty gem sockets, and compare your gear choices against what top-performing players use.",
  },
  {
    icon: TrendingUp,
    title: "Raid Overview",
    description:
      "View every player in the raid at a glance — throughput, deaths, consumables, activity, and avoidable damage taken.",
  },
  {
    icon: Sparkles,
    title: "Buff & Consumable Tracking",
    description:
      "Track flask, elixir, food, and weapon enhancement uptime for every player across all boss fights in the raid.",
  },
  {
    icon: Hammer,
    title: "Talent Comparison",
    description:
      "Compare your talent build against the consensus build used by top-ranked players for your spec.",
  },
  {
    icon: History,
    title: "Personal History",
    description:
      "Track your improvement over time. See DPS trends, percentile changes, and score deltas between raids on the same boss.",
  },
];

export default function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [open, setOpen] = useState(false);

  return (
    <nav className="navbar-fixed fixed top-0 left-0 right-0 z-50 glass-strong border-b border-white/[0.04]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo / Brand */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <Image src="/logo.png" alt="ParseForge" width={20} height={20} className="transition-transform group-hover:-rotate-12" />
            <span className="text-lg font-bold tracking-tight text-gradient-gold">
              ParseForge
            </span>
          </Link>

          {/* Right side nav items */}
          <div className="flex items-center gap-4">
            {!isHome && (
              <Link
                href="/"
                className="text-xs text-muted-foreground hover:text-foreground transition-interactive"
              >
                New Report
              </Link>
            )}

            <Link
              href="/guides"
              className="text-xs text-muted-foreground hover:text-gold-from transition-interactive"
            >
              Guides
            </Link>

            <a
              href="https://classic.warcraftlogs.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-gold-from transition-interactive"
            >
              Warcraft Logs
            </a>

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs">
                  How It Works
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto !z-[200]">
                <DialogHeader>
                  <DialogTitle className="text-xl text-gradient-gold">How ParseForge Works</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 mt-2">
                  {/* Steps */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-foreground">Get Started in Seconds</h3>
                    <ol className="space-y-2">
                      {[
                        "Paste a Warcraft Logs report URL",
                        "Select a boss fight and your character",
                        "Get a full performance breakdown with percentile rankings",
                        "Review personalized improvement suggestions ranked by impact",
                      ].map((step, i) => (
                        <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gold-from/10 text-gold-from text-xs font-bold flex items-center justify-center">
                            {i + 1}
                          </span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div className="h-px bg-border" />

                  {/* Features */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-foreground">Features</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {features.map((f) => (
                        <div key={f.title} className="space-y-1">
                          <div className="flex items-center gap-2">
                            <f.icon className="w-4 h-4 text-gold-from" />
                            <h4 className="text-sm font-medium text-foreground">{f.title}</h4>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{f.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="h-px bg-border" />

                  {/* Supported versions */}
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-foreground">Supported Versions</h3>
                    <p className="text-xs text-muted-foreground">
                      Classic Era, Season of Discovery, The Burning Crusade, Wrath of the Lich King, Cataclysm Classic, and Anniversary realms.
                    </p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </nav>
  );
}
