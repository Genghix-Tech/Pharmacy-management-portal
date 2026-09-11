"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Check, Laptop, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Laptop },
] as const;

export function ThemeForm() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // Theme is unknown during SSR; flip after mount to avoid a hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  return (
    <div className="rounded-xl border bg-card p-5">
      <h2 className="mb-1 text-sm font-semibold">Theme</h2>
      <p className="mb-4 text-sm text-muted-foreground">Choose how PharmaFlow looks on this device.</p>
      <div className="grid grid-cols-3 gap-3">
        {OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const active = mounted && theme === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTheme(opt.value)}
              className={cn(
                "relative flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium transition-colors",
                active ? "border-primary bg-primary/5 text-primary" : "hover:bg-muted"
              )}
            >
              {active && <Check className="absolute top-2 right-2 size-3.5" />}
              <Icon className="size-5" />
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
