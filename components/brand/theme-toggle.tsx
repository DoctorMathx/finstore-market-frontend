"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHydrated } from "@/lib/client-store";

/**
 * Dark is the default, matching finstore.africa. The toggle is here because a
 * white catalog is easier to read in direct sunlight, which is most of the
 * daytime traffic on this market.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useHydrated();

  const isDark = resolvedTheme !== "light";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      // Before mount the resolved theme is unknown; the label would be a guess.
      aria-label={mounted ? (isDark ? "Switch to light theme" : "Switch to dark theme") : "Switch theme"}
      className={`tap-target text-chrome-muted hover:bg-chrome-hover hover:text-chrome-foreground ${className}`}
    >
      {mounted && !isDark ? <Moon size={18} /> : <Sun size={18} />}
    </Button>
  );
}
