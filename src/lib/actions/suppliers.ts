"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getPharmacyContext } from "@/lib/supabase/queries";
import { assertAccess } from "@/lib/utils/permissions";
import { friendlyError, actionError, actionSuccess, type ActionResult } from "@/lib/utils/errors";
import type { Purchase, Supplier } from "@/lib/types/database";

const supplierSchema = z.object({
  name: z.string().trim().min(2, "Supplier name is required"),
  company: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  email: z.string().trim().email("Enter a valid email").optional().or(z.literal("")),
  address: z.string().trim().optional(),
  taxNumber: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});
export type SupplierInput = z.infer<typeof supplierSchema>;

function toRow(input: SupplierInput) {
  return {
    name: input.name,
    company: input.company || null,
    phone: input.phone || null,
    email: input.email || null,
    address: input.address || null,
    tax_number: input.taxNumber || null,
    notes: input.notes || null,
  };
}

export async function createSupplier(input: SupplierInput): Promise<ActionResult<Supplier>> {
  const parsed = supplierSchema.safeParse(input);
  if (!parsed.success) return actionError(parsed.error.issues[0]?.message ?? "Invalid supplier");

  try {
    const context = await getPharmacyContext();
    if (!context) return actionError("Your session has expired. Please sign in again.");
    assertAccess(context.role, "suppliers");

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("suppliers")
      .insert({ pharmacy_id: context.pharmacy.id, ...toRow(parsed.data) })
      .select()
      .single();

    if (error) return actionError(friendlyError(error));
    revalidatePath("/dashboard/suppliers");
    return actionSuccess(data as Supplier);
  } catch (error) {
    return actionError(friendlyError(error));
  }
}

export async function updateSupplier(id: string, input: SupplierInput): Promise<ActionResult<Supplier>> {
  const parsed = supplierSchema.safeParse(input);
  if (!parsed.success) return actionError(parsed.error.issues[0]?.message ?? "Invalid supplier");

  try {
    const context = await getPharmacyContext();
    if (!context) return actionError("Your session has expired. Please sign in again.");
    assertAccess(context.role, "suppliers");

    const supabase = await createClient();
    const { data, error } = await supabase.from("suppliers").update(toRow(parsed.data)).eq("id", id).select().single();
    if (error) return actionError(friendlyError(error));
    revalidatePath("/dashboard/suppliers");
    revalidatePath(`/dashboard/suppliers/${id}`);
    return actionSuccess(data as Supplier);
  } catch (error) {
    return actionError(friendlyError(error));
  }
}

export async function deleteSupplier(id: string): Promise<ActionResult<undefined>> {
  try {
    const context = await getPharmacyContext();
    if (!context) return actionError("Your session has expired. Please sign in again.");
    assertAccess(context.role, "suppliers");

    const supabase = await createClient();
    const { error } = await supabase.from("suppliers").delete().eq("id", id);
    if (error) return actionError(friendlyError(error, "This supplier may still be linked to medicines or purchases."));
    revalidatePath("/dashboard/suppliers");
    return actionSuccess(undefined);
  } catch (error) {
    return actionError(friendlyError(error));
  }
}

export async function recordPurchasePayment(purchaseId: string, amount: number): Promise<ActionResult<Purchase>> {
  try {
    const context = await getPharmacyContext();
    if (!context) return actionError("Your session has expired. Please sign in again.");
    assertAccess(context.role, "purchases");

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("record_purchase_payment", { p_purchase_id: purchaseId, p_amount: amount });
    if (error) return actionError(friendlyError(error));
    revalidatePath("/dashboard/suppliers");
    revalidatePath("/dashboard/purchases");
    return actionSuccess(data as Purchase);
  } catch (error) {
    return actionError(friendlyError(error));
  }
}
