"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { friendlyError, actionError, actionSuccess, type ActionResult } from "@/lib/utils/errors";

/** Populates a brand-new, empty pharmacy with a realistic catalogue via the seed_demo_data RPC (supabase/migrations/0006). */
export async function seedDemoData(pharmacyId: string): Promise<ActionResult<undefined>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc("seed_demo_data", { p_pharmacy_id: pharmacyId });
    if (error) return actionError(friendlyError(error, "Could not load demo data. Please try again."));
    revalidatePath("/dashboard", "layout");
    return actionSuccess(undefined);
  } catch (error) {
    return actionError(friendlyError(error));
  }
}
