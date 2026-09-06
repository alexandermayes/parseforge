"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor, Check } from "lucide-react";
import posthog from "posthog-js";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const THEME_OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

export default function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  // resolvedTheme is undefined on the server and on the very first client
  // render; gate its use behind `mounted` so the server HTML and first
  // client render agree (see 01-RESEARCH.md Pitfall 4).
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Deliberately not "an effect we don't need": this exists solely to detect
    // that we're past hydration, so the SSR render and first client render
    // stay identical (react-hooks/set-state-in-effect otherwise flags this as
    // a cascading-render risk, but there's no external system to sync here —
    // the mismatch it's guarding against is React's own hydration diff).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const handleSelect = (value: "light" | "dark" | "system") => {
    setTheme(value);
    posthog.capture("theme_changed", { theme: value, resolved_theme: resolvedTheme });
  };

  const TriggerIcon = mounted && resolvedTheme === "light" ? Sun : Moon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Toggle theme"
          className="text-muted-foreground hover:text-foreground transition-interactive"
        >
          <TriggerIcon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
          <DropdownMenuItem key={value} onSelect={() => handleSelect(value)}>
            <Icon />
            {label}
            {theme === value && <Check className="ml-auto size-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
