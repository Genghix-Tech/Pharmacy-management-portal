import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { AccessDenied } from "@/components/shared/access-denied";
import { RecordPaymentDialog } from "@/components/suppliers/record-payment-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { getPharmacyContext } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import { canAccess } from "@/lib/utils/permissions";
import { formatCurrency, formatDate } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Purchase details" };

export default async function PurchaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = await getPharmacyContext();
  if (!context) redirect("/login");
  if (!canAccess(context.role, "purchases")) return <AccessDenied role={context.role} />;

  const supabase = await createClient();
  const [{ data: purchase }, { data: items }] = await Promise.all([
    supabase.from("purchases").select("*, suppliers(name, company, phone, email)").eq("id", id).eq("pharmacy_id", context.pharmacy.id).maybeSingle(),
    supabase.from("purchase_items").select("*, medicines(name, unit_type)").eq("purchase_id", id),
  ]);

  if (!purchase) notFound();
  const currency = context.pharmacy.currency;
  const supplier = purchase.suppliers as unknown as { name: string; company: string | null; phone: string | null; email: string | null } | null;
  const balance = Number(purchase.total_amount) - Number(purchase.amount_paid);

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" render={<Link href="/dashboard/purchases" />} className="-ml-2 text-muted-foreground">
        <ArrowLeft /> Back to purchases
      </Button>

      <PageHeader
        title={purchase.purchase_number}
        description={`${formatDate(purchase.purchase_date)}${supplier ? ` · ${supplier.name}` : ""}`}
        actions={balance > 0 && <RecordPaymentDialog purchaseId={purchase.id} outstanding={balance} currency={currency} />}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Total" value={formatCurrency(purchase.total_amount, currency)} />
        <Stat label="Paid" value={formatCurrency(purchase.amount_paid, currency)} />
        <Stat label="Balance" value={formatCurrency(balance, currency)} tone={balance > 0 ? "text-status-warning" : "text-status-good"} />
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Medicine</TableHead>
              <TableHead>Batch</TableHead>
              <TableHead>Expiry</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Unit Price</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(items ?? []).map((item) => {
              const medicine = item.medicines as unknown as { name: string; unit_type: string } | null;
              return (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{medicine?.name ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{item.batch_number || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(item.expiry_date)}</TableCell>
                  <TableCell className="text-right tabular-nums">{item.quantity} {medicine?.unit_type}(s)</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(item.purchase_price, currency)}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{formatCurrency(item.total, currency)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {purchase.notes && (
        <div className="rounded-xl border bg-card p-4 text-sm">
          <p className="mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Notes</p>
          {purchase.notes}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="mb-1 text-xs text-muted-foreground">{label}</p>
      <p className={`text-lg font-semibold tabular-nums ${tone ?? ""}`}>{value}</p>
    </div>
  );
}
