"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createExpense, updateExpense, type ExpenseInput } from "@/lib/actions/expenses";
import { EXPENSE_CATEGORIES, PAYMENT_METHOD_LABEL } from "@/lib/utils/status";
import type { Expense, PaymentMethod } from "@/lib/types/database";

function empty(): ExpenseInput {
  return { title: "", category: "Rent", amount: 0, expenseDate: new Date().toISOString().slice(0, 10), paymentMethod: "cash", description: "" };
}

export function ExpenseFormDialog({ expense }: { expense?: Expense }) {
  const router = useRouter();
  const isEdit = !!expense;
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<ExpenseInput>(
    expense
      ? {
          title: expense.title,
          category: expense.category,
          amount: expense.amount,
          expenseDate: expense.expense_date,
          paymentMethod: expense.payment_method,
          description: expense.description ?? "",
        }
      : empty()
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function update<K extends keyof ExpenseInput>(key: K, value: ExpenseInput[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = isEdit ? await updateExpense(expense!.id, values) : await createExpense(values);
      if (!result.success) {
        setError(result.error);
        return;
      }
      toast.success(isEdit ? "Expense updated." : "Expense added.");
      setOpen(false);
      if (!isEdit) setValues(empty());
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant={isEdit ? "ghost" : "default"} size={isEdit ? "icon-sm" : "default"} />}>
        {isEdit ? (
          <>
            <Pencil /> <span className="sr-only">Edit</span>
          </>
        ) : (
          <>
            <Plus /> Add Expense
          </>
        )}
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit expense" : "Add expense"}</DialogTitle>
            <DialogDescription>Track operating costs like rent, salaries and utilities.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="e-title">Title</Label>
              <Input id="e-title" required value={values.title} onChange={(e) => update("title", e.target.value)} placeholder="e.g. Monthly rent" />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={values.category} onValueChange={(v) => v && update("category", v)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="e-amount">Amount</Label>
              <Input id="e-amount" type="number" min="0.01" step="0.01" required value={values.amount} onChange={(e) => update("amount", Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="e-date">Date</Label>
              <Input id="e-date" type="date" required value={values.expenseDate} onChange={(e) => update("expenseDate", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Payment method</Label>
              <Select value={values.paymentMethod} onValueChange={(v) => v && update("paymentMethod", v as PaymentMethod)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PAYMENT_METHOD_LABEL).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="e-desc">Description</Label>
              <Textarea id="e-desc" rows={2} value={values.description} onChange={(e) => update("description", e.target.value)} />
            </div>
            {error && (
              <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive sm:col-span-2">
                {error}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              {isEdit ? "Save changes" : "Add expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
