"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getPharmacyContext } from "@/lib/supabase/queries";
import { assertOwner } from "@/lib/utils/permissions";
import { friendlyError, actionError, actionSuccess, type ActionResult } from "@/lib/utils/errors";
import type { PharmacyRole, PharmacyUser } from "@/lib/types/database";

const addStaffSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  role: z.enum(["manager", "cashier", "inventory_manager"]),
});

export async function addStaffMember(input: z.infer<typeof addStaffSchema>): Promise<ActionResult<PharmacyUser>> {
  const parsed = addStaffSchema.safeParse(input);
  if (!parsed.success) return actionError(parsed.error.issues[0]?.message ?? "Please check the form and try again.");

  try {
    const context = await getPharmacyContext();
    if (!context) return actionError("Your session has expired. Please sign in again.");
    assertOwner(context.role);

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("add_staff_by_email", {
      p_pharmacy_id: context.pharmacy.id,
      p_email: parsed.data.email,
      p_role: parsed.data.role as PharmacyRole,
    });
    if (error) return actionError(friendlyError(error));

    revalidatePath("/dashboard/staff");
    return actionSuccess(data as PharmacyUser);
  } catch (error) {
    return actionError(friendlyError(error));
  }
}

export async function updateStaffRole(userId: string, role: "manager" | "cashier" | "inventory_manager"): Promise<ActionResult<PharmacyUser>> {
  try {
    const context = await getPharmacyContext();
    if (!context) return actionError("Your session has expired. Please sign in again.");
    assertOwner(context.role);

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("update_staff_role", {
      p_pharmacy_id: context.pharmacy.id,
      p_user_id: userId,
      p_role: role,
    });
    if (error) return actionError(friendlyError(error));

    revalidatePath("/dashboard/staff");
    return actionSuccess(data as PharmacyUser);
  } catch (error) {
    return actionError(friendlyError(error));
  }
}

export async function removeStaffMember(membershipId: string): Promise<ActionResult<undefined>> {
  try {
    const context = await getPharmacyContext();
    if (!context) return actionError("Your session has expired. Please sign in again.");
    assertOwner(context.role);

    const supabase = await createClient();
    const { error } = await supabase.from("pharmacy_users").delete().eq("id", membershipId);
    if (error) return actionError(friendlyError(error));

    revalidatePath("/dashboard/staff");
    return actionSuccess(undefined);
  } catch (error) {
    return actionError(friendlyError(error));
  }
}
