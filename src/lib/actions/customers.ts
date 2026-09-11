"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getPharmacyContext } from "@/lib/supabase/queries";
import { assertAccess } from "@/lib/utils/permissions";
import { friendlyError, actionError, actionSuccess, type ActionResult } from "@/lib/utils/errors";
import type { Customer } from "@/lib/types/database";

const customerSchema = z.object({
  name: z.string().trim().min(2, "Customer name is required"),
  phone: z.string().trim().optional(),
  email: z.string().trim().email("Enter a valid email").optional().or(z.literal("")),
  address: z.string().trim().optional(),
  dateOfBirth: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});
export type CustomerInput = z.infer<typeof customerSchema>;

function toRow(input: CustomerInput) {
  return {
    name: input.name,
    phone: input.phone || null,
    email: input.email || null,
    address: input.address || null,
    date_of_birth: input.dateOfBirth || null,
    notes: input.notes || null,
  };
}

export async function createCustomer(input: CustomerInput): Promise<ActionResult<Customer>> {
  const parsed = customerSchema.safeParse(input);
  if (!parsed.success) return actionError(parsed.error.issues[0]?.message ?? "Invalid customer");

  try {
    const context = await getPharmacyContext();
    if (!context) return actionError("Your session has expired. Please sign in again.");
    assertAccess(context.role, "customers");

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("customers")
      .insert({ pharmacy_id: context.pharmacy.id, ...toRow(parsed.data) })
      .select()
      .single();

    if (error) return actionError(friendlyError(error));
    revalidatePath("/dashboard/customers");
    return actionSuccess(data as Customer);
  } catch (error) {
    return actionError(friendlyError(error));
  }
}

export async function updateCustomer(id: string, input: CustomerInput): Promise<ActionResult<Customer>> {
  const parsed = customerSchema.safeParse(input);
  if (!parsed.success) return actionError(parsed.error.issues[0]?.message ?? "Invalid customer");

  try {
    const context = await getPharmacyContext();
    if (!context) return actionError("Your session has expired. Please sign in again.");
    assertAccess(context.role, "customers");

    const supabase = await createClient();
    const { data, error } = await supabase.from("customers").update(toRow(parsed.data)).eq("id", id).select().single();
    if (error) return actionError(friendlyError(error));
    revalidatePath("/dashboard/customers");
    revalidatePath(`/dashboard/customers/${id}`);
    return actionSuccess(data as Customer);
  } catch (error) {
    return actionError(friendlyError(error));
  }
}

export async function deleteCustomer(id: string): Promise<ActionResult<undefined>> {
  try {
    const context = await getPharmacyContext();
    if (!context) return actionError("Your session has expired. Please sign in again.");
    assertAccess(context.role, "customers");

    const supabase = await createClient();
    const { error } = await supabase.from("customers").delete().eq("id", id);
    if (error) return actionError(friendlyError(error));
    revalidatePath("/dashboard/customers");
    return actionSuccess(undefined);
  } catch (error) {
    return actionError(friendlyError(error));
  }
}
