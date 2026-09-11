import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Eye, FileText, Printer } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { AccessDenied } from "@/components/shared/access-denied";
import { PageNav } from "@/components/shared/page-nav";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { getPharmacyContext } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import { canAccess } from "@/lib/utils/permissions";
import { formatCurrency, formatDate } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Invoices" };

const PAGE_SIZE = 20;

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const context = await getPharmacyContext();
  if (!context) redirect("/login");
  if (!canAccess(context.role, "invoices")) return <AccessDenied role={context.role} />;

  const supabase = await createClient();
  const page = Math.max(1, Number(params.page) || 1);
  const from = (page - 1) * PAGE_SIZE;

  const { data: invoices, count } = await supabase
    .from("invoices")
    .select("*, sales(total_amount, status)", { count: "exact" })
    .eq("pharmacy_id", context.pharmacy.id)
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const currency = context.pharmacy.currency;

  return (
    <div>
      <PageHeader title="Invoices" description="Every invoice generated at checkout, ready to view, print or download." />

      {!invoices?.length ? (
        <EmptyState icon={FileText} title="No invoices yet" description="Invoices are generated automatically for every completed sale." />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-1" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => {
                  const sale = inv.sales as unknown as { total_amount: number; status: string } | null;
                  return (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">{inv.invoice_number}</TableCell>
                      <TableCell className="text-muted-foreground">{inv.customer_snapshot?.name ?? "Walk-in customer"}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(inv.created_at)}</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">{formatCurrency(sale?.total_amount ?? 0, currency)}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon-sm" render={<Link href={`/dashboard/sales/${inv.sale_id}`} />}>
                            <Eye />
                            <span className="sr-only">View sale</span>
                          </Button>
                          <Button variant="ghost" size="icon-sm" render={<Link href={`/invoices/${inv.sale_id}/print`} target="_blank" />}>
                            <Printer />
                            <span className="sr-only">Print</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <PageNav page={page} totalPages={totalPages} basePath="/dashboard/invoices" searchParams={params} />
        </>
      )}
    </div>
  );
}
