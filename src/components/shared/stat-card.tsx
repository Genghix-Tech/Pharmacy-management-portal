import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  tone = "default",
  className,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  hint?: string;
  tone?: "default" | "warning" | "critical" | "good";
  className?: string;
}) {
  const toneClasses: Record<typeof tone, string> = {
    default: "bg-primary/10 text-primary",
    good: "bg-status-good/10 text-status-good",
    warning: "bg-status-warning/15 text-amber-600 dark:text-status-warning",
    critical: "bg-status-critical/10 text-status-critical",
  };

  return (
    <div className={cn("rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", toneClasses[tone])}>
          <Icon className="size-4.5" strokeWidth={2.25} />
        </div>
      </div>
    </div>
  );
}
