"use client";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size={"icon"}
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      aria-label={`${theme} - theme`}
    >
      <Moon className="w-5 block dark:hidden h-5" />
      <Sun className="w-5 hidden dark:block h-5" />
    </Button>
  );
}
