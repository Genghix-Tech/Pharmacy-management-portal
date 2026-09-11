"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getPharmacyContext } from "@/lib/supabase/queries";
import { assertAccess } from "@/lib/utils/permissions";
import { friendlyError, actionError, actionSuccess, type ActionResult } from "@/lib/utils/errors";
import type { Expense, PaymentMethod } from "@/lib/types/database";

const expenseSchema = z.object({
  title: z.string().trim().min(2, "Title is required"),
  category: z.string().trim().min(1, "Category is required"),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  expenseDate: z.string().trim().min(1, "Date is required"),
  paymentMethod: z.enum(["cash", "card", "bank_transfer", "other"]),
  description: z.string().trim().optional(),
});
export type ExpenseInput = z.infer<typeof expenseSchema>;

function toRow(input: ExpenseInput) {
  return {
    title: input.title,
    category: input.category,
    amount: input.amount,
    expense_date: input.expenseDate,
    payment_method: input.paymentMethod as PaymentMethod,
    description: input.description || null,
  };
}

export async function createExpense(input: ExpenseInput): Promise<ActionResult<Expense>> {
  const parsed = expenseSchema.safeParse(input);
  if (!parsed.success) return actionError(parsed.error.issues[0]?.message ?? "Please check the form and try again.");

  try {
    const context = await getPharmacyContext();
    if (!context) return actionError("Your session has expired. Please sign in again.");
    assertAccess(context.role, "expenses");

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("expenses")
      .insert({ pharmacy_id: context.pharmacy.id, created_by: context.userId, ...toRow(parsed.data) })
      .select()
      .single();

    if (error) return actionError(friendlyError(error));
    revalidatePath("/dashboard/expenses");
    revalidatePath("/dashboard/reports");
    return actionSuccess(data as Expense);
  } catch (error) {
    return actionError(friendlyError(error));
  }
}

export async function updateExpense(id: string, input: ExpenseInput): Promise<ActionResult<Expense>> {
  const parsed = expenseSchema.safeParse(input);
  if (!parsed.success) return actionError(parsed.error.issues[0]?.message ?? "Please check the form and try again.");

  try {
    const context = await getPharmacyContext();
    if (!context) return actionError("Your session has expired. Please sign in again.");
    assertAccess(context.role, "expenses");

    const supabase = await createClient();
    const { data, error } = await supabase.from("expenses").update(toRow(parsed.data)).eq("id", id).select().single();
    if (error) return actionError(friendlyError(error));
    revalidatePath("/dashboard/expenses");
    revalidatePath("/dashboard/reports");
    return actionSuccess(data as Expense);
  } catch (error) {
    return actionError(friendlyError(error));
  }
}

export async function deleteExpense(id: string): Promise<ActionResult<undefined>> {
  try {
    const context = await getPharmacyContext();
    if (!context) return actionError("Your session has expired. Please sign in again.");
    assertAccess(context.role, "expenses");

    const supabase = await createClient();
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) return actionError(friendlyError(error));
    revalidatePath("/dashboard/expenses");
    revalidatePath("/dashboard/reports");
    return actionSuccess(undefined);
  } catch (error) {
    return actionError(friendlyError(error));
  }
}
