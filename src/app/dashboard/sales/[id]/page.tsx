import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Printer } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { AccessDenied } from "@/components/shared/access-denied";
import { SaleStatusBadge } from "@/components/shared/status-badge";
import { RefundButton } from "@/components/sales/refund-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { getPharmacyContext } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import { canAccess } from "@/lib/utils/permissions";
import { formatCurrency, formatDateTime } from "@/lib/utils/format";
import { PAYMENT_METHOD_LABEL } from "@/lib/utils/status";

export const metadata: Metadata = { title: "Sale details" };

export default async function SaleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = await getPharmacyContext();
  if (!context) redirect("/login");
  if (!canAccess(context.role, "sales")) return <AccessDenied role={context.role} />;

  const supabase = await createClient();
  const [{ data: sale }, { data: items }] = await Promise.all([
    supabase.from("sales").select("*, customers(name, phone, email)").eq("id", id).eq("pharmacy_id", context.pharmacy.id).maybeSingle(),
    supabase.from("sale_items").select("*").eq("sale_id", id),
  ]);

  if (!sale) notFound();
  const currency = context.pharmacy.currency;
  const customer = sale.customers as unknown as { name: string; phone: string | null; email: string | null } | null;
  const canManage = canAccess(context.role, "sales");

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" render={<Link href="/dashboard/sales" />} className="-ml-2 text-muted-foreground">
        <ArrowLeft /> Back to sales
      </Button>

      <PageHeader
        title={sale.invoice_number}
        description={formatDateTime(sale.created_at)}
        actions={
          <>
            <Button variant="outline" render={<Link href={`/invoices/${sale.id}/print`} target="_blank" />}>
              <Printer /> Print invoice
            </Button>
            {canManage && sale.status === "completed" && <RefundButton saleId={sale.id} invoiceNumber={sale.invoice_number} />}
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Info label="Status"><SaleStatusBadge status={sale.status} /></Info>
        <Info label="Customer" value={customer?.name ?? "Walk-in customer"} />
        <Info label="Payment method" value={PAYMENT_METHOD_LABEL[sale.payment_method]} />
        <Info label="Profit" value={formatCurrency(sale.profit_amount, currency)} valueClassName="text-status-good font-medium" />
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Medicine</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Unit Price</TableHead>
              <TableHead className="text-right">Discount</TableHead>
              <TableHead className="text-right">Tax</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(items ?? []).map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.medicine_name}</TableCell>
                <TableCell className="text-right tabular-nums">{item.quantity}</TableCell>
                <TableCell className="text-right tabular-nums">{formatCurrency(item.unit_price, currency)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatCurrency(item.discount_amount, currency)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatCurrency(item.tax_amount, currency)}</TableCell>
                <TableCell className="text-right font-medium tabular-nums">{formatCurrency(item.total, currency)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="ml-auto w-full max-w-xs space-y-1.5 text-sm">
        <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="tabular-nums">{formatCurrency(sale.subtotal, currency)}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span className="tabular-nums">-{formatCurrency(sale.discount_amount, currency)}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span className="tabular-nums">{formatCurrency(sale.tax_amount, currency)}</span></div>
        <div className="flex justify-between border-t pt-1.5 text-base font-semibold"><span>Total</span><span className="tabular-nums">{formatCurrency(sale.total_amount, currency)}</span></div>
      </div>
    </div>
  );
}

function Info({ label, value, valueClassName, children }: { label: string; value?: string; valueClassName?: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="mb-1 text-xs text-muted-foreground">{label}</p>
      {children ?? <p className={`font-medium ${valueClassName ?? ""}`}>{value}</p>}
    </div>
  );
}
