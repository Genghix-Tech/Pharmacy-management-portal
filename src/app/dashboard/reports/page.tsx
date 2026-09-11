import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { format, startOfMonth } from "date-fns";
import { AlertTriangle, Boxes, CalendarClock, DollarSign, PackageX, Receipt, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { AccessDenied } from "@/components/shared/access-denied";
import { StatCard } from "@/components/shared/stat-card";
import { ReportControls } from "@/components/reports/report-controls";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getPharmacyContext } from "@/lib/supabase/queries";
import { getReportsData } from "@/lib/supabase/reports";
import { canAccess } from "@/lib/utils/permissions";
import { formatCurrency, formatNumber } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Reports" };

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const context = await getPharmacyContext();
  if (!context) redirect("/login");
  if (!canAccess(context.role, "reports")) return <AccessDenied role={context.role} />;

  const from = params.from || format(startOfMonth(new Date()), "yyyy-MM-dd");
  const to = params.to || format(new Date(), "yyyy-MM-dd");
  const data = await getReportsData(context.pharmacy.id, from, to);
  const currency = context.pharmacy.currency;

  return (
    <div className="report-print">
      <PageHeader title="Reports" description={`${format(new Date(from), "MMM d, yyyy")} — ${format(new Date(to), "MMM d, yyyy")}`} />
      <ReportControls from={from} to={to} />

      <div className="space-y-8">
        <ReportSection title="Sales Report">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Revenue" value={formatCurrency(data.sales.revenue, currency)} icon={DollarSign} />
            <StatCard label="Orders" value={formatNumber(data.sales.orders)} icon={Receipt} />
            <StatCard label="Average Order Value" value={formatCurrency(data.sales.avgOrderValue, currency)} icon={TrendingUp} />
          </div>
        </ReportSection>

        <ReportSection title="Profit Report">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Revenue" value={formatCurrency(data.profit.revenue, currency)} icon={DollarSign} />
            <StatCard label="Cost of Goods" value={formatCurrency(data.profit.costOfGoods, currency)} icon={TrendingDown} />
            <StatCard label="Expenses" value={formatCurrency(data.profit.expenses, currency)} icon={Wallet} />
            <StatCard label="Net Profit" value={formatCurrency(data.profit.netProfit, currency)} icon={TrendingUp} tone={data.profit.netProfit >= 0 ? "good" : "critical"} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Net Profit = Revenue − Cost of Goods − Expenses</p>
        </ReportSection>

        <ReportSection title="Inventory Report">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Products" value={formatNumber(data.inventory.totalProducts)} icon={Boxes} />
            <StatCard label="Total Units" value={formatNumber(data.inventory.totalUnits)} icon={Boxes} />
            <StatCard label="Inventory Value" value={formatCurrency(data.inventory.inventoryValue, currency)} icon={DollarSign} />
            <StatCard label="Low Stock" value={formatNumber(data.inventory.lowStock)} icon={TrendingDown} tone={data.inventory.lowStock > 0 ? "warning" : "default"} />
            <StatCard label="Out of Stock" value={formatNumber(data.inventory.outOfStock)} icon={PackageX} tone={data.inventory.outOfStock > 0 ? "critical" : "default"} />
            <StatCard label="Expiring Soon" value={formatNumber(data.inventory.expiringSoon)} icon={CalendarClock} tone={data.inventory.expiringSoon > 0 ? "warning" : "default"} />
            <StatCard label="Expired" value={formatNumber(data.inventory.expired)} icon={AlertTriangle} tone={data.inventory.expired > 0 ? "critical" : "default"} />
          </div>
        </ReportSection>

        <ReportSection title="Purchase Report">
          <StatCard label="Total Purchases" value={formatCurrency(data.purchases.total, currency)} icon={DollarSign} className="mb-4 max-w-xs" />
          {data.purchases.bySupplier.length === 0 ? (
            <p className="text-sm text-muted-foreground">No purchases in this period.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border bg-card">
              <Table>
                <TableHeader><TableRow><TableHead>Supplier</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
                <TableBody>
                  {data.purchases.bySupplier.map((row) => (
                    <TableRow key={row.supplier}>
                      <TableCell>{row.supplier}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(row.amount, currency)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </ReportSection>

        <ReportSection title="Expense Report">
          <StatCard label="Total Expenses" value={formatCurrency(data.expenses.total, currency)} icon={Wallet} className="mb-4 max-w-xs" />
          {data.expenses.byCategory.length === 0 ? (
            <p className="text-sm text-muted-foreground">No expenses in this period.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border bg-card">
              <Table>
                <TableHeader><TableRow><TableHead>Category</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
                <TableBody>
                  {data.expenses.byCategory.map((row) => (
                    <TableRow key={row.category}>
                      <TableCell>{row.category}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(row.amount, currency)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </ReportSection>
      </div>
    </div>
  );
}

function ReportSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="break-inside-avoid">
      <h2 className="mb-3 text-base font-semibold">{title}</h2>
      {children}
    </section>
  );
}
