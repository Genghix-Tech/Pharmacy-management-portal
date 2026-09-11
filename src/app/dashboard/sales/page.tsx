import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Printer, Receipt } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { AccessDenied } from "@/components/shared/access-denied";
import { PageNav } from "@/components/shared/page-nav";
import { SalesFilters } from "@/components/sales/sales-filters";
import { SaleStatusBadge } from "@/components/shared/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { getPharmacyContext } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import { canAccess } from "@/lib/utils/permissions";
import { formatCurrency, formatDateTime } from "@/lib/utils/format";
import { PAYMENT_METHOD_LABEL } from "@/lib/utils/status";
import type { PaymentMethod, SaleStatus } from "@/lib/types/database";

export const metadata: Metadata = { title: "Sales" };

const PAGE_SIZE = 20;

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const context = await getPharmacyContext();
  if (!context) redirect("/login");
  if (!canAccess(context.role, "sales")) return <AccessDenied role={context.role} />;

  const supabase = await createClient();
  const page = Math.max(1, Number(params.page) || 1);
  const from = (page - 1) * PAGE_SIZE;

  let query = supabase
    .from("sales")
    .select("*, customers(name)", { count: "exact" })
    .eq("pharmacy_id", context.pharmacy.id);

  if (params.q) query = query.ilike("invoice_number", `%${params.q}%`);
  if (params.payment) query = query.eq("payment_method", params.payment as PaymentMethod);
  if (params.status) query = query.eq("status", params.status as SaleStatus);
  if (params.from) query = query.gte("created_at", params.from);
  if (params.to) query = query.lte("created_at", `${params.to}T23:59:59`);

  const { data: sales, count } = await query.order("created_at", { ascending: false }).range(from, from + PAGE_SIZE - 1);
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const currency = context.pharmacy.currency;

  return (
    <div>
      <PageHeader title="Sales" description="Every sale made through the POS, with profit at a glance." />
      <SalesFilters />

      {!sales?.length ? (
        <EmptyState icon={Receipt} title="No sales yet" description="Sales completed at the POS will show up here." />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="hidden sm:table-cell">Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="hidden text-right lg:table-cell">Profit</TableHead>
                  <TableHead className="w-1" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <Link href={`/dashboard/sales/${s.id}`} className="font-medium hover:underline">{s.invoice_number}</Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{(s.customers as unknown as { name: string } | null)?.name ?? "Walk-in"}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDateTime(s.created_at)}</TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">{PAYMENT_METHOD_LABEL[s.payment_method]}</TableCell>
                    <TableCell><SaleStatusBadge status={s.status} /></TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{formatCurrency(s.total_amount, currency)}</TableCell>
                    <TableCell className="hidden text-right tabular-nums text-status-good lg:table-cell">{formatCurrency(s.profit_amount, currency)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon-sm" render={<Link href={`/invoices/${s.id}/print`} target="_blank" />}>
                        <Printer />
                        <span className="sr-only">Print</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <PageNav page={page} totalPages={totalPages} basePath="/dashboard/sales" searchParams={params} />
        </>
      )}
    </div>
  );
}
