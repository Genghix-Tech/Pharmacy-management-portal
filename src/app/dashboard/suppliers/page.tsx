import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Truck } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { AccessDenied } from "@/components/shared/access-denied";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { SupplierFormDialog } from "@/components/suppliers/supplier-form-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getPharmacyContext } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import { canAccess } from "@/lib/utils/permissions";
import { deleteSupplier } from "@/lib/actions/suppliers";
import { formatCurrency } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Suppliers" };

export default async function SuppliersPage() {
  const context = await getPharmacyContext();
  if (!context) redirect("/login");
  if (!canAccess(context.role, "suppliers")) return <AccessDenied role={context.role} />;

  const supabase = await createClient();
  const [{ data: suppliers }, { data: purchases }] = await Promise.all([
    supabase.from("suppliers").select("*").eq("pharmacy_id", context.pharmacy.id).order("name"),
    supabase.from("purchases").select("supplier_id, total_amount, amount_paid").eq("pharmacy_id", context.pharmacy.id),
  ]);

  const totalsBySupplier = new Map<string, { total: number; outstanding: number }>();
  for (const p of purchases ?? []) {
    if (!p.supplier_id) continue;
    const entry = totalsBySupplier.get(p.supplier_id) ?? { total: 0, outstanding: 0 };
    entry.total += Number(p.total_amount);
    entry.outstanding += Number(p.total_amount) - Number(p.amount_paid);
    totalsBySupplier.set(p.supplier_id, entry);
  }

  const currency = context.pharmacy.currency;

  return (
    <div>
      <PageHeader title="Suppliers" description="Manage your medicine suppliers and track purchase history." actions={<SupplierFormDialog />} />

      {!suppliers?.length ? (
        <EmptyState icon={Truck} title="No suppliers added yet" description="Add your first supplier to start recording purchases." action={<SupplierFormDialog />} />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Supplier</TableHead>
                <TableHead className="hidden sm:table-cell">Contact</TableHead>
                <TableHead className="text-right">Total Purchases</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead className="w-1" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.map((s) => {
                const totals = totalsBySupplier.get(s.id) ?? { total: 0, outstanding: 0 };
                return (
                  <TableRow key={s.id}>
                    <TableCell>
                      <Link href={`/dashboard/suppliers/${s.id}`} className="font-medium hover:underline">
                        {s.name}
                      </Link>
                      {s.company && <p className="text-xs text-muted-foreground">{s.company}</p>}
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                      {s.phone || s.email || "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(totals.total, currency)}</TableCell>
                    <TableCell className={`text-right tabular-nums ${totals.outstanding > 0 ? "font-medium text-status-warning" : ""}`}>
                      {formatCurrency(totals.outstanding, currency)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <ConfirmDeleteButton
                          title={`Delete "${s.name}"?`}
                          description="Existing purchases will keep this supplier's name but the record will be removed."
                          onConfirm={deleteSupplier.bind(null, s.id)}
                          successMessage="Supplier deleted."
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
