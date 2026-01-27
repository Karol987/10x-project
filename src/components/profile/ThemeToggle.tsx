// src/components/profile/ThemeToggle.tsx

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Theme toggle component for switching between light and dark mode
 * Uses localStorage for persistence and applies .dark class to html element
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    setMounted(true);
    const storedTheme = localStorage.getItem("theme") as "light" | "dark" | null;

    if (storedTheme) {
      setTheme(storedTheme);
      applyTheme(storedTheme);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const initialTheme = prefersDark ? "dark" : "light";
      setTheme(initialTheme);
      applyTheme(initialTheme);
    }
  }, []);

  const applyTheme = (newTheme: "light" | "dark") => {
    const root = document.documentElement;
    if (newTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card">
        <div className="space-y-1">
          <h3 className="text-sm font-medium">Motyw</h3>
          <p className="text-xs text-muted-foreground">Wybierz wygląd aplikacji</p>
        </div>
        <div className="size-10 rounded-md bg-muted animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card">
      <div className="space-y-1">
        <h3 className="text-sm font-medium">Motyw</h3>
        <p className="text-xs text-muted-foreground">{theme === "light" ? "Jasny" : "Ciemny"}</p>
      </div>

      <button
        type="button"
        onClick={toggleTheme}
        className={cn(
          "relative inline-flex h-10 w-[72px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent",
          "transition-colors duration-200 ease-in-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          theme === "dark" ? "bg-primary" : "bg-muted"
        )}
        role="switch"
        aria-checked={theme === "dark"}
        aria-label={`Przełącz na ${theme === "light" ? "ciemny" : "jasny"} motyw`}
      >
        <span
          className={cn(
            "pointer-events-none inline-flex size-8 transform rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out",
            "items-center justify-center",
            theme === "dark" ? "translate-x-9" : "translate-x-1"
          )}
        >
          {theme === "dark" ? (
            <Moon className="size-4 text-primary" aria-hidden="true" />
          ) : (
            <Sun className="size-4 text-muted-foreground" aria-hidden="true" />
          )}
        </span>
      </button>
    </div>
  );
}
