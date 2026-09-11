"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getPharmacyContext } from "@/lib/supabase/queries";
import { assertAccess } from "@/lib/utils/permissions";
import { friendlyError, actionError, actionSuccess, type ActionResult } from "@/lib/utils/errors";
import type { Medicine } from "@/lib/types/database";

const medicineSchema = z.object({
  name: z.string().trim().min(2, "Medicine name is required"),
  genericName: z.string().trim().optional(),
  brand: z.string().trim().optional(),
  sku: z.string().trim().optional(),
  barcode: z.string().trim().optional(),
  categoryId: z.string().uuid().optional().or(z.literal("")),
  manufacturer: z.string().trim().optional(),
  supplierId: z.string().uuid().optional().or(z.literal("")),
  batchNumber: z.string().trim().optional(),
  purchasePrice: z.coerce.number().min(0, "Must be 0 or more"),
  sellingPrice: z.coerce.number().min(0, "Must be 0 or more"),
  quantity: z.coerce.number().int().min(0, "Must be 0 or more"),
  minStockLevel: z.coerce.number().int().min(0, "Must be 0 or more"),
  expiryDate: z.string().trim().optional(),
  manufacturingDate: z.string().trim().optional(),
  unitType: z.string().trim().min(1, "Unit type is required"),
  taxRate: z.coerce.number().min(0).max(100).default(0),
  discountRate: z.coerce.number().min(0).max(100).default(0),
  description: z.string().trim().optional(),
  status: z.enum(["active", "inactive"]).default("active"),
});
export type MedicineInput = z.infer<typeof medicineSchema>;

function toRow(input: MedicineInput) {
  return {
    name: input.name,
    generic_name: input.genericName || null,
    brand: input.brand || null,
    sku: input.sku || null,
    barcode: input.barcode || null,
    category_id: input.categoryId || null,
    manufacturer: input.manufacturer || null,
    supplier_id: input.supplierId || null,
    batch_number: input.batchNumber || null,
    purchase_price: input.purchasePrice,
    selling_price: input.sellingPrice,
    quantity: input.quantity,
    min_stock_level: input.minStockLevel,
    expiry_date: input.expiryDate || null,
    manufacturing_date: input.manufacturingDate || null,
    unit_type: input.unitType,
    tax_rate: input.taxRate,
    discount_rate: input.discountRate,
    description: input.description || null,
    status: input.status,
  };
}

function validateBusinessRules(input: MedicineInput): string | null {
  if (input.sellingPrice < input.purchasePrice) {
    return "Selling price is lower than purchase price — double-check these numbers.";
  }
  if (input.expiryDate && input.manufacturingDate && input.expiryDate < input.manufacturingDate) {
    return "Expiry date can't be before the manufacturing date.";
  }
  return null;
}

export async function createMedicine(input: MedicineInput): Promise<ActionResult<Medicine>> {
  const parsed = medicineSchema.safeParse(input);
  if (!parsed.success) return actionError(parsed.error.issues[0]?.message ?? "Please check the form and try again.");
  const businessError = validateBusinessRules(parsed.data);
  if (businessError) return actionError(businessError);

  try {
    const context = await getPharmacyContext();
    if (!context) return actionError("Your session has expired. Please sign in again.");
    assertAccess(context.role, "medicines");

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("medicines")
      .insert({ pharmacy_id: context.pharmacy.id, ...toRow(parsed.data) })
      .select()
      .single();

    if (error) return actionError(friendlyError(error));

    if (parsed.data.quantity > 0) {
      await supabase.from("inventory_transactions").insert({
        pharmacy_id: context.pharmacy.id,
        medicine_id: (data as Medicine).id,
        type: "initial",
        quantity_change: parsed.data.quantity,
        quantity_after: parsed.data.quantity,
        reason: "Opening stock",
        created_by: context.userId,
      });
    }

    revalidatePath("/dashboard/medicines");
    revalidatePath("/dashboard/inventory");
    return actionSuccess(data as Medicine);
  } catch (error) {
    return actionError(friendlyError(error));
  }
}

export async function updateMedicine(id: string, input: MedicineInput): Promise<ActionResult<Medicine>> {
  const parsed = medicineSchema.safeParse(input);
  if (!parsed.success) return actionError(parsed.error.issues[0]?.message ?? "Please check the form and try again.");
  const businessError = validateBusinessRules(parsed.data);
  if (businessError) return actionError(businessError);

  try {
    const context = await getPharmacyContext();
    if (!context) return actionError("Your session has expired. Please sign in again.");
    assertAccess(context.role, "medicines");

    const supabase = await createClient();

    // Quantity is edited through Adjust Stock (so every change is logged) —
    // this form updates everything else about the medicine.
    const { quantity: _quantity, ...rest } = toRow(parsed.data);
    void _quantity;

    const { data, error } = await supabase.from("medicines").update(rest).eq("id", id).select().single();
    if (error) return actionError(friendlyError(error));

    revalidatePath("/dashboard/medicines");
    revalidatePath(`/dashboard/medicines/${id}`);
    revalidatePath("/dashboard/inventory");
    return actionSuccess(data as Medicine);
  } catch (error) {
    return actionError(friendlyError(error));
  }
}

export async function deleteMedicine(id: string): Promise<ActionResult<undefined>> {
  try {
    const context = await getPharmacyContext();
    if (!context) return actionError("Your session has expired. Please sign in again.");
    assertAccess(context.role, "medicines");

    const supabase = await createClient();
    const { error } = await supabase.from("medicines").delete().eq("id", id);
    if (error) return actionError(friendlyError(error, "This medicine has sales or purchase history and can't be deleted. Mark it inactive instead."));
    revalidatePath("/dashboard/medicines");
    revalidatePath("/dashboard/inventory");
    return actionSuccess(undefined);
  } catch (error) {
    return actionError(friendlyError(error));
  }
}

export async function adjustStock(medicineId: string, quantityChange: number, reason: string): Promise<ActionResult<Medicine>> {
  try {
    const context = await getPharmacyContext();
    if (!context) return actionError("Your session has expired. Please sign in again.");
    assertAccess(context.role, "inventory");

    if (!Number.isInteger(quantityChange) || quantityChange === 0) {
      return actionError("Enter a non-zero whole number.");
    }

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("adjust_stock", {
      p_medicine_id: medicineId,
      p_quantity_change: quantityChange,
      p_reason: reason || "Manual adjustment",
    });
    if (error) return actionError(friendlyError(error));

    revalidatePath("/dashboard/medicines");
    revalidatePath(`/dashboard/medicines/${medicineId}`);
    revalidatePath("/dashboard/inventory");
    return actionSuccess(data as Medicine);
  } catch (error) {
    return actionError(friendlyError(error));
  }
}
