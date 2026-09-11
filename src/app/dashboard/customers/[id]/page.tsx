import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Cake, DollarSign, Mail, MapPin, Phone, Receipt, ShoppingBag, Wallet } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { AccessDenied } from "@/components/shared/access-denied";
import { EmptyState } from "@/components/shared/empty-state";
import { CustomerFormDialog } from "@/components/customers/customer-form-dialog";
import { StatCard } from "@/components/shared/stat-card";
import { SaleStatusBadge } from "@/components/shared/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { getPharmacyContext } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import { canAccess } from "@/lib/utils/permissions";
import { formatCurrency, formatDate } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Customer" };

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = await getPharmacyContext();
  if (!context) redirect("/login");
  if (!canAccess(context.role, "customers")) return <AccessDenied role={context.role} />;

  const supabase = await createClient();
  const [{ data: customer }, { data: sales }] = await Promise.all([
    supabase.from("customers").select("*").eq("id", id).eq("pharmacy_id", context.pharmacy.id).maybeSingle(),
    supabase
      .from("sales")
      .select("*")
      .eq("customer_id", id)
      .eq("pharmacy_id", context.pharmacy.id)
      .order("created_at", { ascending: false }),
  ]);

  if (!customer) notFound();

  const currency = context.pharmacy.currency;
  const validSales = (sales ?? []).filter((s) => s.status !== "refunded");
  const totalSpent = validSales.reduce((s, r) => s + Number(r.total_amount), 0);

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" render={<Link href="/dashboard/customers" />} className="-ml-2 text-muted-foreground">
        <ArrowLeft /> Back to customers
      </Button>

      <PageHeader title={customer.name} actions={<CustomerFormDialog customer={customer} />} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-4 text-sm">
          <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Contact</p>
          <div className="space-y-1.5">
            {customer.phone && <p className="flex items-center gap-2"><Phone className="size-3.5 text-muted-foreground" /> {customer.phone}</p>}
            {customer.email && <p className="flex items-center gap-2"><Mail className="size-3.5 text-muted-foreground" /> {customer.email}</p>}
            {customer.address && <p className="flex items-center gap-2"><MapPin className="size-3.5 text-muted-foreground" /> {customer.address}</p>}
            {customer.date_of_birth && <p className="flex items-center gap-2"><Cake className="size-3.5 text-muted-foreground" /> {formatDate(customer.date_of_birth)}</p>}
            {!customer.phone && !customer.email && !customer.address && !customer.date_of_birth && (
              <p className="text-muted-foreground">No contact details yet.</p>
            )}
          </div>
        </div>
        <StatCard label="Total Spending" value={formatCurrency(totalSpent, currency)} icon={DollarSign} />
        <StatCard label="Number of Purchases" value={String(validSales.length)} icon={ShoppingBag} />
        <StatCard label="Outstanding Balance" value={formatCurrency(0, currency)} icon={Wallet} hint="PharmaFlow POS requires full payment at checkout" />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold">Purchase history</h2>
        {!sales?.length ? (
          <EmptyState icon={Receipt} title="No purchases yet" description="Sales made to this customer will appear here." />
        ) : (
          <div className="overflow-x-auto rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <Link href={`/dashboard/sales/${s.id}`} className="font-medium hover:underline">
                        {s.invoice_number}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(s.created_at)}</TableCell>
                    <TableCell><SaleStatusBadge status={s.status} /></TableCell>
                    <TableCell className="text-right tabular-nums font-medium">{formatCurrency(s.total_amount, currency)}</TableCell>
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
