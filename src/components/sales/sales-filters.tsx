"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PAYMENT_METHOD_LABEL } from "@/lib/utils/status";

const ALL = "__all__";

export function SalesFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [, startTransition] = useTransition();

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== ALL) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  function onSearchKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") setParam("q", search || null);
  }

  return (
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative flex-1 sm:max-w-56">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search invoice #…"
          className="pl-8"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={onSearchKeyDown}
          onBlur={() => setParam("q", search || null)}
        />
      </div>
      <Select defaultValue={searchParams.get("payment") ?? ALL} onValueChange={(v) => setParam("payment", v)}>
        <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Payment method" /></SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All payment methods</SelectItem>
          {Object.entries(PAYMENT_METHOD_LABEL).map(([value, label]) => (
            <SelectItem key={value} value={value}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select defaultValue={searchParams.get("status") ?? ALL} onValueChange={(v) => setParam("status", v)}>
        <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All statuses</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="refunded">Refunded</SelectItem>
        </SelectContent>
      </Select>
      <Input type="date" className="w-full sm:w-40" defaultValue={searchParams.get("from") ?? ""} onChange={(e) => setParam("from", e.target.value || null)} />
      <Input type="date" className="w-full sm:w-40" defaultValue={searchParams.get("to") ?? ""} onChange={(e) => setParam("to", e.target.value || null)} />
    </div>
  );
}
