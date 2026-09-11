import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, History, Pencil } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { AccessDenied } from "@/components/shared/access-denied";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { ExpiryStatusBadge, StockStatusBadge } from "@/components/shared/status-badge";
import { StockAdjustDialog } from "@/components/medicines/stock-adjust-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getPharmacyContext } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import { canAccess } from "@/lib/utils/permissions";
import { deleteMedicine } from "@/lib/actions/medicines";
import { formatCurrency, formatDateTime, formatDate } from "@/lib/utils/format";
import { attachCategoryAndSupplier } from "@/lib/utils/attach-names";
import type { MedicineStatusRow } from "@/lib/types/database";

export const metadata: Metadata = { title: "Medicine details" };

export default async function MedicineDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = await getPharmacyContext();
  if (!context) redirect("/login");
  if (!canAccess(context.role, "medicines")) return <AccessDenied role={context.role} />;

  const supabase = await createClient();
  const [{ data: medicine }, { data: transactions }, { data: categories }, { data: suppliers }] = await Promise.all([
    supabase.from("medicine_status").select("*").eq("id", id).eq("pharmacy_id", context.pharmacy.id).maybeSingle(),
    supabase
      .from("inventory_transactions")
      .select("*")
      .eq("medicine_id", id)
      .eq("pharmacy_id", context.pharmacy.id)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.from("categories").select("id, name").eq("pharmacy_id", context.pharmacy.id),
    supabase.from("suppliers").select("id, name").eq("pharmacy_id", context.pharmacy.id),
  ]);

  if (!medicine) notFound();
  const [m] = attachCategoryAndSupplier([medicine as unknown as MedicineStatusRow], categories ?? [], suppliers ?? []);
  const currency = context.pharmacy.currency;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" render={<Link href="/dashboard/medicines" />} className="-ml-2 text-muted-foreground">
        <ArrowLeft /> Back to medicines
      </Button>

      <PageHeader
        title={m.name}
        description={[m.generic_name, m.brand].filter(Boolean).join(" · ") || undefined}
        actions={
          <>
            <StockAdjustDialog medicineId={m.id} currentQuantity={m.quantity} unitType={m.unit_type} />
            <Button variant="outline" render={<Link href={`/dashboard/medicines/${m.id}/edit`} />}>
              <Pencil /> Edit
            </Button>
            <ConfirmDeleteButton
              title={`Delete "${m.name}"?`}
              description="This can't be undone. If this medicine has sales or purchase history, mark it inactive instead of deleting."
              onConfirm={deleteMedicine.bind(null, m.id)}
              successMessage="Medicine deleted."
              trigger={<Button variant="outline" className="text-destructive hover:text-destructive" />}
            />
          </>
        }
      />

      <div className="flex flex-wrap gap-2">
        <StockStatusBadge status={m.stock_status} />
        <ExpiryStatusBadge status={m.expiry_status} />
        <Badge variant="outline" className="capitalize">{m.status}</Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-5 lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold">Details</h2>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
            <Detail label="SKU" value={m.sku} />
            <Detail label="Barcode" value={m.barcode} />
            <Detail label="Batch number" value={m.batch_number} />
            <Detail label="Category" value={m.categories?.name} />
            <Detail label="Manufacturer" value={m.manufacturer} />
            <Detail label="Supplier" value={m.suppliers?.name} />
            <Detail label="Unit type" value={m.unit_type} className="capitalize" />
            <Detail label="Manufacturing date" value={formatDate(m.manufacturing_date)} />
            <Detail label="Expiry date" value={formatDate(m.expiry_date)} />
          </dl>
          {m.description && (
            <div className="mt-4 border-t pt-4">
              <p className="mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Description</p>
              <p className="text-sm">{m.description}</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-5">
            <h2 className="mb-3 text-sm font-semibold">Stock & pricing</h2>
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">In stock</dt><dd className="font-medium tabular-nums">{m.quantity} {m.unit_type}(s)</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Minimum level</dt><dd className="tabular-nums">{m.min_stock_level}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Purchase price</dt><dd className="tabular-nums">{formatCurrency(m.purchase_price, currency)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Selling price</dt><dd className="tabular-nums font-medium">{formatCurrency(m.selling_price, currency)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Tax rate</dt><dd className="tabular-nums">{m.tax_rate}%</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Discount rate</dt><dd className="tabular-nums">{m.discount_rate}%</dd></div>
              <div className="flex justify-between border-t pt-2.5"><dt className="text-muted-foreground">Stock value</dt><dd className="tabular-nums font-medium">{formatCurrency(m.quantity * m.purchase_price, currency)}</dd></div>
            </dl>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
          <History className="size-4" /> Stock history
        </h2>
        {!transactions?.length ? (
          <EmptyState icon={History} title="No stock movements yet" />
        ) : (
          <div className="overflow-x-auto rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Change</TableHead>
                  <TableHead className="text-right">Balance after</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="text-muted-foreground">{formatDateTime(t.created_at)}</TableCell>
                    <TableCell className="capitalize">{t.type.replace("_", " ")}</TableCell>
                    <TableCell className={`text-right tabular-nums font-medium ${t.quantity_change > 0 ? "text-status-good" : "text-status-critical"}`}>
                      {t.quantity_change > 0 ? "+" : ""}{t.quantity_change}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{t.quantity_after}</TableCell>
                    <TableCell className="text-muted-foreground">{t.reason || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}

function Detail({ label, value, className }: { label: string; value?: string | null; className?: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={`font-medium ${className ?? ""}`}>{value || "—"}</dd>
    </div>
  );
}
