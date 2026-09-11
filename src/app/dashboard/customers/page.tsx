import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { AccessDenied } from "@/components/shared/access-denied";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { CustomerFormDialog } from "@/components/customers/customer-form-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getPharmacyContext } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import { canAccess } from "@/lib/utils/permissions";
import { deleteCustomer } from "@/lib/actions/customers";
import { formatCurrency } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Customers" };

export default async function CustomersPage() {
  const context = await getPharmacyContext();
  if (!context) redirect("/login");
  if (!canAccess(context.role, "customers")) return <AccessDenied role={context.role} />;

  const supabase = await createClient();
  const [{ data: customers }, { data: sales }] = await Promise.all([
    supabase.from("customers").select("*").eq("pharmacy_id", context.pharmacy.id).order("name"),
    supabase.from("sales").select("customer_id, total_amount, status").eq("pharmacy_id", context.pharmacy.id),
  ]);

  const spendingByCustomer = new Map<string, { total: number; count: number }>();
  for (const s of sales ?? []) {
    if (!s.customer_id || s.status === "refunded") continue;
    const entry = spendingByCustomer.get(s.customer_id) ?? { total: 0, count: 0 };
    entry.total += Number(s.total_amount);
    entry.count += 1;
    spendingByCustomer.set(s.customer_id, entry);
  }

  const currency = context.pharmacy.currency;

  return (
    <div>
      <PageHeader title="Customers" description="Manage customer contacts and see their purchase history." actions={<CustomerFormDialog />} />

      {!customers?.length ? (
        <EmptyState icon={Users} title="No customers added yet" description="Add customers to build purchase history and speed up checkout at the POS." action={<CustomerFormDialog />} />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead className="hidden sm:table-cell">Contact</TableHead>
                <TableHead className="text-right">Purchases</TableHead>
                <TableHead className="text-right">Total Spent</TableHead>
                <TableHead className="w-1" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((c) => {
                const stats = spendingByCustomer.get(c.id) ?? { total: 0, count: 0 };
                return (
                  <TableRow key={c.id}>
                    <TableCell>
                      <Link href={`/dashboard/customers/${c.id}`} className="font-medium hover:underline">
                        {c.name}
                      </Link>
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">{c.phone || c.email || "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">{stats.count}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">{formatCurrency(stats.total, currency)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <ConfirmDeleteButton
                          title={`Delete "${c.name}"?`}
                          description="Their past sales history will be kept, but this customer record will be removed."
                          onConfirm={deleteCustomer.bind(null, c.id)}
                          successMessage="Customer deleted."
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
