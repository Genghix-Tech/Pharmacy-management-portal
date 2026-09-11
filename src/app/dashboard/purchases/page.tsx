import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PackagePlus, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { AccessDenied } from "@/components/shared/access-denied";
import { PageNav } from "@/components/shared/page-nav";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getPharmacyContext } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import { canAccess } from "@/lib/utils/permissions";
import { formatCurrency, formatDate } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Purchases" };

const PAGE_SIZE = 20;

export default async function PurchasesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const context = await getPharmacyContext();
  if (!context) redirect("/login");
  if (!canAccess(context.role, "purchases")) return <AccessDenied role={context.role} />;

  const supabase = await createClient();
  const page = Math.max(1, Number(params.page) || 1);
  const from = (page - 1) * PAGE_SIZE;

  const { data: purchases, count } = await supabase
    .from("purchases")
    .select("*, suppliers(name)", { count: "exact" })
    .eq("pharmacy_id", context.pharmacy.id)
    .order("purchase_date", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const currency = context.pharmacy.currency;

  return (
    <div>
      <PageHeader
        title="Purchases"
        description="Every restock recorded from your suppliers."
        actions={
          <Button render={<Link href="/dashboard/purchases/new" />}>
            <Plus /> Record Purchase
          </Button>
        }
      />

      {!purchases?.length ? (
        <EmptyState icon={PackagePlus} title="No purchases recorded yet" description="Record a purchase to restock inventory and track supplier spending." action={<Button render={<Link href="/dashboard/purchases/new" />}><Plus /> Record Purchase</Button>} />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Purchase #</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases.map((p) => {
                  const balance = Number(p.total_amount) - Number(p.amount_paid);
                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <Link href={`/dashboard/purchases/${p.id}`} className="font-medium hover:underline">{p.purchase_number}</Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{(p.suppliers as unknown as { name: string } | null)?.name ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(p.purchase_date)}</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">{formatCurrency(p.total_amount, currency)}</TableCell>
                      <TableCell className="text-right">
                        {balance > 0 ? (
                          <Badge variant="outline" className="border-status-warning/30 bg-status-warning/10 text-amber-700 dark:text-status-warning">
                            {formatCurrency(balance, currency)} due
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">Paid</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <PageNav page={page} totalPages={totalPages} basePath="/dashboard/purchases" searchParams={params} />
        </>
      )}
    </div>
  );
}
