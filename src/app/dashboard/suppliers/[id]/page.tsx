import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, DollarSign, Mail, MapPin, Package, Phone, Receipt, Wallet } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { AccessDenied } from "@/components/shared/access-denied";
import { EmptyState } from "@/components/shared/empty-state";
import { SupplierFormDialog } from "@/components/suppliers/supplier-form-dialog";
import { RecordPaymentDialog } from "@/components/suppliers/record-payment-dialog";
import { StatCard } from "@/components/shared/stat-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { getPharmacyContext } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import { canAccess } from "@/lib/utils/permissions";
import { formatCurrency, formatDate } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Supplier" };

export default async function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = await getPharmacyContext();
  if (!context) redirect("/login");
  if (!canAccess(context.role, "suppliers")) return <AccessDenied role={context.role} />;

  const supabase = await createClient();
  const [{ data: supplier }, { data: purchases }] = await Promise.all([
    supabase.from("suppliers").select("*").eq("id", id).eq("pharmacy_id", context.pharmacy.id).maybeSingle(),
    supabase
      .from("purchases")
      .select("*")
      .eq("supplier_id", id)
      .eq("pharmacy_id", context.pharmacy.id)
      .order("purchase_date", { ascending: false }),
  ]);

  if (!supplier) notFound();

  const currency = context.pharmacy.currency;
  const totalPurchases = (purchases ?? []).reduce((s, p) => s + Number(p.total_amount), 0);
  const outstanding = (purchases ?? []).reduce((s, p) => s + (Number(p.total_amount) - Number(p.amount_paid)), 0);

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" render={<Link href="/dashboard/suppliers" />} className="-ml-2 text-muted-foreground">
        <ArrowLeft /> Back to suppliers
      </Button>

      <PageHeader title={supplier.name} description={supplier.company ?? undefined} actions={<SupplierFormDialog supplier={supplier} />} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-4 text-sm">
          <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Contact</p>
          <div className="space-y-1.5">
            {supplier.phone && <p className="flex items-center gap-2"><Phone className="size-3.5 text-muted-foreground" /> {supplier.phone}</p>}
            {supplier.email && <p className="flex items-center gap-2"><Mail className="size-3.5 text-muted-foreground" /> {supplier.email}</p>}
            {supplier.address && <p className="flex items-center gap-2"><MapPin className="size-3.5 text-muted-foreground" /> {supplier.address}</p>}
            {!supplier.phone && !supplier.email && !supplier.address && <p className="text-muted-foreground">No contact details yet.</p>}
          </div>
        </div>
        <StatCard label="Total Purchases" value={formatCurrency(totalPurchases, currency)} icon={DollarSign} />
        <StatCard label="Outstanding Balance" value={formatCurrency(outstanding, currency)} icon={Wallet} tone={outstanding > 0 ? "warning" : "good"} />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold">Purchase history</h2>
        {!purchases?.length ? (
          <EmptyState icon={Package} title="No purchases recorded yet" description="Purchases from this supplier will show up here." />
        ) : (
          <div className="overflow-x-auto rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Purchase #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="w-1" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases.map((p) => {
                  const balance = Number(p.total_amount) - Number(p.amount_paid);
                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <Link href={`/dashboard/purchases/${p.id}`} className="flex items-center gap-1.5 font-medium hover:underline">
                          <Receipt className="size-3.5 text-muted-foreground" /> {p.purchase_number}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(p.purchase_date)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(p.total_amount, currency)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(p.amount_paid, currency)}</TableCell>
                      <TableCell className={`text-right tabular-nums ${balance > 0 ? "text-status-warning" : "text-muted-foreground"}`}>
                        {formatCurrency(balance, currency)}
                      </TableCell>
                      <TableCell>
                        {balance > 0 && <RecordPaymentDialog purchaseId={p.id} outstanding={balance} currency={currency} />}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
