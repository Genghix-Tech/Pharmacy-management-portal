"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getPharmacyContext } from "@/lib/supabase/queries";
import { assertAccess } from "@/lib/utils/permissions";
import { friendlyError, actionError, actionSuccess, type ActionResult } from "@/lib/utils/errors";
import type { PaymentMethod, Sale } from "@/lib/types/database";

const saleItemSchema = z.object({
  medicineId: z.string().uuid(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().min(0),
  discountAmount: z.number().min(0).default(0),
  taxAmount: z.number().min(0).default(0),
});

const createSaleSchema = z.object({
  items: z.array(saleItemSchema).min(1, "Add at least one item to the cart"),
  customerId: z.string().uuid().optional(),
  paymentMethod: z.enum(["cash", "card", "bank_transfer", "other"]),
  notes: z.string().trim().optional(),
});
export type CreateSaleInput = z.infer<typeof createSaleSchema>;

export async function createSale(input: CreateSaleInput): Promise<ActionResult<Sale>> {
  const parsed = createSaleSchema.safeParse(input);
  if (!parsed.success) return actionError(parsed.error.issues[0]?.message ?? "Please check the cart and try again.");

  try {
    const context = await getPharmacyContext();
    if (!context) return actionError("Your session has expired. Please sign in again.");
    assertAccess(context.role, "pos");

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("create_sale", {
      p_pharmacy_id: context.pharmacy.id,
      p_items: parsed.data.items.map((i) => ({
        medicine_id: i.medicineId,
        quantity: i.quantity,
        unit_price: i.unitPrice,
        discount_amount: i.discountAmount,
        tax_amount: i.taxAmount,
      })),
      p_customer_id: parsed.data.customerId ?? null,
      p_payment_method: parsed.data.paymentMethod as PaymentMethod,
      p_notes: parsed.data.notes || null,
    });

    if (error) return actionError(friendlyError(error));

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/sales");
    revalidatePath("/dashboard/invoices");
    revalidatePath("/dashboard/medicines");
    revalidatePath("/dashboard/inventory");
    return actionSuccess(data as Sale);
  } catch (error) {
    return actionError(friendlyError(error));
  }
}

export async function refundSale(saleId: string, reason?: string): Promise<ActionResult<Sale>> {
  try {
    const context = await getPharmacyContext();
    if (!context) return actionError("Your session has expired. Please sign in again.");
    assertAccess(context.role, "sales");

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("refund_sale", { p_sale_id: saleId, p_reason: reason || null });
    if (error) return actionError(friendlyError(error));

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/sales");
    revalidatePath(`/dashboard/sales/${saleId}`);
    revalidatePath("/dashboard/medicines");
    revalidatePath("/dashboard/inventory");
    return actionSuccess(data as Sale);
  } catch (error) {
    return actionError(friendlyError(error));
  }
}
