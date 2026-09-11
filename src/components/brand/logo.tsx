import { Pill } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function LogoMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-teal-700 text-white shadow-sm",
        className
      )}
    >
      <Pill className="size-4.5" strokeWidth={2.5} />
    </div>
  );
}

export function Logo({ className, href = "/" }: { className?: string; href?: string | null }) {
  const content = (
    <span className={cn("inline-flex items-center gap-2 font-semibold tracking-tight", className)}>
      <LogoMark />
      <span className="text-lg">PharmaFlow</span>
    </span>
  );

  if (!href) return content;
  return <Link href={href}>{content}</Link>;
}
