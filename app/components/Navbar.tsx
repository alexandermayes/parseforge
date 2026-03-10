"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === "/";

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
            <a
              href="https://classic.warcraftlogs.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-gold-from transition-interactive"
            >
              Warcraft Logs
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
