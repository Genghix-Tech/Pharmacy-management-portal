"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { friendlyError, type ActionResult, actionError, actionSuccess } from "@/lib/utils/errors";

export async function markNotificationRead(id: string): Promise<ActionResult<undefined>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    if (error) return actionError(friendlyError(error));
    revalidatePath("/dashboard", "layout");
    return actionSuccess(undefined);
  } catch (error) {
    return actionError(friendlyError(error));
  }
}

export async function markAllNotificationsRead(pharmacyId: string): Promise<ActionResult<undefined>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("pharmacy_id", pharmacyId)
      .eq("is_read", false);
    if (error) return actionError(friendlyError(error));
    revalidatePath("/dashboard", "layout");
    return actionSuccess(undefined);
  } catch (error) {
    return actionError(friendlyError(error));
  }
}
