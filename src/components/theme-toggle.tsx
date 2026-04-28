"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Pređi na svetlu temu" : "Pređi na tamnu temu"}
    >
      {mounted ? (
        isDark ? (
          <Sun className="size-[18px]" strokeWidth={1.75} />
        ) : (
          <Moon className="size-[18px]" strokeWidth={1.75} />
        )
      ) : (
        <span className="size-[18px]" />
      )}
    </Button>
  );
}
