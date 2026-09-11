"use client";

import { useMemo } from "react";
import { useTheme } from "next-themes";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, parseISO } from "date-fns";
import { CHART_PALETTE } from "@/lib/chart-colors";
import { formatCurrency, formatNumber } from "@/lib/utils/format";
import type { CategorySales, DailyPoint, TopMedicine } from "@/lib/supabase/analytics";

function usePalette() {
  const { resolvedTheme } = useTheme();
  return resolvedTheme === "dark" ? CHART_PALETTE.dark : CHART_PALETTE.light;
}

function ChartCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="mb-4 space-y-0.5">
        <h3 className="text-sm font-semibold">{title}</h3>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function TooltipCard({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">{children}</div>;
}

export function SalesTrendChart({ data, currency }: { data: DailyPoint[]; currency: string }) {
  const palette = usePalette();
  const [revenueColor, profitColor] = palette.series;

  return (
    <ChartCard title="Sales over time" description="Revenue vs. profit — last 14 days">
      <div className="flex items-center gap-4 pb-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full" style={{ background: revenueColor }} /> Revenue
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full" style={{ background: profitColor }} /> Profit
        </span>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={palette.grid} strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickFormatter={(v: string) => format(parseISO(v), "MMM d")}
            tick={{ fill: palette.axis, fontSize: 11 }}
            axisLine={{ stroke: palette.grid }}
            tickLine={false}
            minTickGap={24}
          />
          <YAxis
            tick={{ fill: palette.axis, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={48}
            tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v))}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <TooltipCard>
                  <p className="mb-1 font-medium text-foreground">{format(parseISO(String(label)), "MMM d, yyyy")}</p>
                  {payload.map((p) => (
                    <p key={p.dataKey as string} className="flex items-center justify-between gap-4">
                      <span style={{ color: p.color }}>{p.name}</span>
                      <span className="font-medium tabular-nums">{formatCurrency(p.value as number, currency)}</span>
                    </p>
                  ))}
                </TooltipCard>
              );
            }}
          />
          <Line type="monotone" dataKey="revenue" name="Revenue" stroke={revenueColor} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          <Line type="monotone" dataKey="profit" name="Profit" stroke={profitColor} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function TopMedicinesChart({ data, currency }: { data: TopMedicine[]; currency: string }) {
  const palette = usePalette();
  const color = palette.series[0];

  return (
    <ChartCard title="Top-selling medicines" description="By units sold — last 30 days">
      {data.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">No sales recorded yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(180, data.length * 42)}>
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 24, left: 0, bottom: 0 }}>
            <CartesianGrid horizontal={false} stroke={palette.grid} strokeDasharray="3 3" />
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: palette.ink, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={140}
            />
            <Tooltip
              cursor={{ fill: "transparent" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const item = payload[0].payload as TopMedicine;
                return (
                  <TooltipCard>
                    <p className="font-medium text-foreground">{item.name}</p>
                    <p>{formatNumber(item.quantity)} units · {formatCurrency(item.revenue, currency)}</p>
                  </TooltipCard>
                );
              }}
            />
            <Bar dataKey="quantity" name="Units sold" fill={color} radius={[0, 4, 4, 0]} maxBarSize={18} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

export function CategorySalesChart({ data, currency }: { data: CategorySales[]; currency: string }) {
  const palette = usePalette();

  // Color is assigned by the category's identity (alphabetical order), never
  // by its current rank — so a category keeps its color across refreshes
  // even as the revenue-sorted bar order changes.
  const colorByCategory = useMemo(() => {
    const stableOrder = [...data].map((d) => d.category).sort((a, b) => a.localeCompare(b));
    const map = new Map<string, string>();
    stableOrder.forEach((name, i) => map.set(name, palette.series[i % palette.series.length]));
    return map;
  }, [data, palette]);

  return (
    <ChartCard title="Sales by category" description="Revenue share — last 30 days">
      {data.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">No sales recorded yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(180, data.length * 42)}>
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 24, left: 0, bottom: 0 }}>
            <CartesianGrid horizontal={false} stroke={palette.grid} strokeDasharray="3 3" />
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="category"
              tick={{ fill: palette.ink, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={110}
            />
            <Tooltip
              cursor={{ fill: "transparent" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const item = payload[0].payload as CategorySales;
                return (
                  <TooltipCard>
                    <p className="font-medium text-foreground">{item.category}</p>
                    <p>{formatCurrency(item.revenue, currency)}</p>
                  </TooltipCard>
                );
              }}
            />
            <Bar dataKey="revenue" name="Revenue" radius={[0, 4, 4, 0]} maxBarSize={18}>
              {data.map((entry) => (
                <Cell key={entry.category} fill={colorByCategory.get(entry.category)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}
