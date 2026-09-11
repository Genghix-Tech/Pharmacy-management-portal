"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getPharmacyContext } from "@/lib/supabase/queries";
import { assertAccess } from "@/lib/utils/permissions";
import { friendlyError, actionError, actionSuccess, type ActionResult } from "@/lib/utils/errors";
import type { Purchase } from "@/lib/types/database";

const purchaseItemSchema = z.object({
  medicineId: z.string().uuid(),
  quantity: z.number().int().positive(),
  purchasePrice: z.number().min(0),
  batchNumber: z.string().trim().optional(),
  expiryDate: z.string().trim().optional(),
});

const createPurchaseSchema = z.object({
  supplierId: z.string().uuid().optional(),
  purchaseDate: z.string().trim().min(1, "Purchase date is required"),
  items: z.array(purchaseItemSchema).min(1, "Add at least one item"),
  notes: z.string().trim().optional(),
  amountPaid: z.number().min(0).optional(),
});
export type CreatePurchaseInput = z.infer<typeof createPurchaseSchema>;

export async function createPurchase(input: CreatePurchaseInput): Promise<ActionResult<Purchase>> {
  const parsed = createPurchaseSchema.safeParse(input);
  if (!parsed.success) return actionError(parsed.error.issues[0]?.message ?? "Please check the form and try again.");

  try {
    const context = await getPharmacyContext();
    if (!context) return actionError("Your session has expired. Please sign in again.");
    assertAccess(context.role, "purchases");

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("create_purchase", {
      p_pharmacy_id: context.pharmacy.id,
      p_items: parsed.data.items.map((i) => ({
        medicine_id: i.medicineId,
        quantity: i.quantity,
        purchase_price: i.purchasePrice,
        batch_number: i.batchNumber || undefined,
        expiry_date: i.expiryDate || undefined,
      })),
      p_supplier_id: parsed.data.supplierId ?? null,
      p_purchase_date: parsed.data.purchaseDate,
      p_notes: parsed.data.notes || null,
      p_amount_paid: parsed.data.amountPaid ?? null,
    });

    if (error) return actionError(friendlyError(error));

    revalidatePath("/dashboard/purchases");
    revalidatePath("/dashboard/medicines");
    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard/suppliers");
    return actionSuccess(data as Purchase);
  } catch (error) {
    return actionError(friendlyError(error));
  }
}
