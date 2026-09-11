import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  Boxes,
  CalendarClock,
  DollarSign,
  PackageX,
  Receipt,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Truck,
  Users,
} from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { SeedDemoDataButton } from "@/components/dashboard/seed-demo-data-button";
import { SalesTrendChart, TopMedicinesChart, CategorySalesChart } from "@/components/dashboard/charts";
import { Button } from "@/components/ui/button";
import { getPharmacyContext } from "@/lib/supabase/queries";
import { getDashboardAnalytics } from "@/lib/supabase/analytics";
import { formatCurrency, formatNumber } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardHomePage() {
  const context = await getPharmacyContext();
  if (!context) redirect("/login");
  const { pharmacy } = context;

  const { stats, salesTrend, topMedicines, categorySales, hasAnyData } = await getDashboardAnalytics(pharmacy.id);
  const currency = pharmacy.currency;

  if (!hasAnyData) {
    return (
      <div className="mx-auto max-w-2xl py-10">
        <EmptyState
          icon={Sparkles}
          title={`Welcome to PharmaFlow, ${pharmacy.name}!`}
          description="Your pharmacy workspace is ready. Add your first medicines to get started, or load realistic demo data to see everything in action first."
          action={
            <div className="flex flex-wrap items-center justify-center gap-2">
              <SeedDemoDataButton pharmacyId={pharmacy.id} />
              <Button variant="outline" render={<Link href="/dashboard/medicines/new" />}>
                Add your first medicine
              </Button>
            </div>
          }
          className="py-20"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Good to see you, {pharmacy.name}</h1>
          <p className="text-sm text-muted-foreground">Here&apos;s what&apos;s happening in your pharmacy today.</p>
        </div>
        <Button render={<Link href="/dashboard/pos" />}>
          <Receipt /> New Sale
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Today's Sales" value={formatCurrency(stats.todaySales, currency)} icon={DollarSign} hint={`${stats.todayOrders} order${stats.todayOrders === 1 ? "" : "s"} today`} />
        <StatCard label="Today's Profit" value={formatCurrency(stats.todayProfit, currency)} icon={TrendingUp} tone="good" />
        <StatCard label="Total Inventory Value" value={formatCurrency(stats.inventoryValue, currency)} icon={Boxes} hint={`${formatNumber(stats.totalMedicines)} medicines`} />
        <StatCard label="Today's Orders" value={formatNumber(stats.todayOrders)} icon={Receipt} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Low Stock"
          value={formatNumber(stats.lowStockCount)}
          icon={TrendingDown}
          tone={stats.lowStockCount > 0 ? "warning" : "default"}
          hint="At or below minimum level"
        />
        <StatCard
          label="Out of Stock"
          value={formatNumber(stats.outOfStockCount)}
          icon={PackageX}
          tone={stats.outOfStockCount > 0 ? "critical" : "default"}
        />
        <StatCard
          label="Expiring Soon"
          value={formatNumber(stats.expiringSoonCount)}
          icon={CalendarClock}
          tone={stats.expiringSoonCount > 0 ? "warning" : "default"}
          hint={`Within ${pharmacy.expiry_alert_days} days`}
        />
        <StatCard
          label="Expired"
          value={formatNumber(stats.expiredCount)}
          icon={AlertTriangle}
          tone={stats.expiredCount > 0 ? "critical" : "default"}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Total Customers" value={formatNumber(stats.totalCustomers)} icon={Users} />
        <StatCard label="Total Suppliers" value={formatNumber(stats.totalSuppliers)} icon={Truck} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <SalesTrendChart data={salesTrend} currency={currency} />
        </div>
        <CategorySalesChart data={categorySales} currency={currency} />
      </div>

      <TopMedicinesChart data={topMedicines} currency={currency} />
    </div>
  );
}
