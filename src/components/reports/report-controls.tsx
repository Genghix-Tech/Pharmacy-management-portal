"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Printer } from "lucide-react";
import { format, startOfMonth, startOfWeek, subDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const iso = (d: Date) => format(d, "yyyy-MM-dd");

const PRESETS: Record<string, () => [string, string]> = {
  today: () => [iso(new Date()), iso(new Date())],
  week: () => [iso(startOfWeek(new Date())), iso(new Date())],
  month: () => [iso(startOfMonth(new Date())), iso(new Date())],
  last30: () => [iso(subDays(new Date(), 29)), iso(new Date())],
};

export function ReportControls({ from, to }: { from: string; to: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setRange(newFrom: string, newTo: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("from", newFrom);
    params.set("to", newTo);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="no-print mb-6 flex flex-wrap items-center gap-2">
      <Select onValueChange={(v: string | null) => v && PRESETS[v] && setRange(...PRESETS[v]())}>
        <SelectTrigger className="w-40"><SelectValue placeholder="Quick range" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="today">Today</SelectItem>
          <SelectItem value="week">This week</SelectItem>
          <SelectItem value="month">This month</SelectItem>
          <SelectItem value="last30">Last 30 days</SelectItem>
        </SelectContent>
      </Select>
      <Input type="date" value={from} onChange={(e) => setRange(e.target.value, to)} className="w-40" />
      <span className="text-sm text-muted-foreground">to</span>
      <Input type="date" value={to} onChange={(e) => setRange(from, e.target.value)} className="w-40" />
      <Button variant="outline" className="ml-auto" onClick={() => window.print()}>
        <Printer /> Print / Download
      </Button>
    </div>
  );
}
