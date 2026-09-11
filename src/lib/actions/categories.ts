"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getPharmacyContext } from "@/lib/supabase/queries";
import { assertAccess } from "@/lib/utils/permissions";
import { friendlyError, actionError, actionSuccess, type ActionResult } from "@/lib/utils/errors";
import type { Category } from "@/lib/types/database";

const categorySchema = z.object({
  name: z.string().trim().min(2, "Category name is required"),
  description: z.string().trim().optional(),
});

export async function createCategory(input: z.infer<typeof categorySchema>): Promise<ActionResult<Category>> {
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return actionError(parsed.error.issues[0]?.message ?? "Invalid category");

  try {
    const context = await getPharmacyContext();
    if (!context) return actionError("Your session has expired. Please sign in again.");
    assertAccess(context.role, "categories");

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("categories")
      .insert({ pharmacy_id: context.pharmacy.id, name: parsed.data.name, description: parsed.data.description || null })
      .select()
      .single();

    if (error) return actionError(friendlyError(error));
    revalidatePath("/dashboard/categories");
    return actionSuccess(data as Category);
  } catch (error) {
    return actionError(friendlyError(error));
  }
}

export async function updateCategory(id: string, input: z.infer<typeof categorySchema>): Promise<ActionResult<Category>> {
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return actionError(parsed.error.issues[0]?.message ?? "Invalid category");

  try {
    const context = await getPharmacyContext();
    if (!context) return actionError("Your session has expired. Please sign in again.");
    assertAccess(context.role, "categories");

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("categories")
      .update({ name: parsed.data.name, description: parsed.data.description || null })
      .eq("id", id)
      .select()
      .single();

    if (error) return actionError(friendlyError(error));
    revalidatePath("/dashboard/categories");
    return actionSuccess(data as Category);
  } catch (error) {
    return actionError(friendlyError(error));
  }
}

export async function deleteCategory(id: string): Promise<ActionResult<undefined>> {
  try {
    const context = await getPharmacyContext();
    if (!context) return actionError("Your session has expired. Please sign in again.");
    assertAccess(context.role, "categories");

    const supabase = await createClient();
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) return actionError(friendlyError(error, "This category may still have medicines assigned to it."));
    revalidatePath("/dashboard/categories");
    return actionSuccess(undefined);
  } catch (error) {
    return actionError(friendlyError(error));
  }
}
