import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Wallet } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { AccessDenied } from "@/components/shared/access-denied";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { ExpenseFormDialog } from "@/components/expenses/expense-form-dialog";
import { StatCard } from "@/components/shared/stat-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getPharmacyContext } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import { canAccess } from "@/lib/utils/permissions";
import { deleteExpense } from "@/lib/actions/expenses";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { PAYMENT_METHOD_LABEL } from "@/lib/utils/status";
import { startOfMonth } from "date-fns";

export const metadata: Metadata = { title: "Expenses" };

export default async function ExpensesPage() {
  const context = await getPharmacyContext();
  if (!context) redirect("/login");
  if (!canAccess(context.role, "expenses")) return <AccessDenied role={context.role} />;

  const supabase = await createClient();
  const { data: expenses } = await supabase
    .from("expenses")
    .select("*")
    .eq("pharmacy_id", context.pharmacy.id)
    .order("expense_date", { ascending: false })
    .limit(200);

  const currency = context.pharmacy.currency;
  const all = expenses ?? [];
  const monthStart = startOfMonth(new Date()).toISOString().slice(0, 10);
  const totalAll = all.reduce((s, e) => s + Number(e.amount), 0);
  const totalMonth = all.filter((e) => e.expense_date >= monthStart).reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div>
      <PageHeader title="Expenses" description="Track your pharmacy's operating costs." actions={<ExpenseFormDialog />} />

      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <StatCard label="This Month" value={formatCurrency(totalMonth, currency)} icon={Wallet} />
        <StatCard label="All Time" value={formatCurrency(totalAll, currency)} icon={Wallet} />
      </div>

      {!all.length ? (
        <EmptyState icon={Wallet} title="No expenses recorded yet" description="Track rent, salaries, utilities and other costs here." action={<ExpenseFormDialog />} />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="hidden sm:table-cell">Payment</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="w-1" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {all.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>
                    <p className="font-medium">{e.title}</p>
                    {e.description && <p className="line-clamp-1 text-xs text-muted-foreground">{e.description}</p>}
                  </TableCell>
                  <TableCell><Badge variant="outline">{e.category}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(e.expense_date)}</TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">{PAYMENT_METHOD_LABEL[e.payment_method]}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{formatCurrency(e.amount, currency)}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <ExpenseFormDialog expense={e} />
                      <ConfirmDeleteButton title={`Delete "${e.title}"?`} onConfirm={deleteExpense.bind(null, e.id)} successMessage="Expense deleted." />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
