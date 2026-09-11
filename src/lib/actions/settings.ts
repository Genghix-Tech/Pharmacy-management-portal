"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getPharmacyContext } from "@/lib/supabase/queries";
import { assertManager } from "@/lib/utils/permissions";
import { friendlyError, actionError, actionSuccess, type ActionResult } from "@/lib/utils/errors";
import type { Pharmacy, Profile } from "@/lib/types/database";

const pharmacyProfileSchema = z.object({
  name: z.string().trim().min(2, "Pharmacy name is required"),
  logoUrl: z.string().trim().url("Enter a valid URL").optional().or(z.literal("")),
  email: z.string().trim().email("Enter a valid email").optional().or(z.literal("")),
  phone: z.string().trim().optional(),
  website: z.string().trim().url("Enter a valid URL").optional().or(z.literal("")),
  address: z.string().trim().optional(),
  city: z.string().trim().optional(),
  country: z.string().trim().optional(),
  taxNumber: z.string().trim().optional(),
});

export async function updatePharmacyProfile(input: z.infer<typeof pharmacyProfileSchema>): Promise<ActionResult<Pharmacy>> {
  const parsed = pharmacyProfileSchema.safeParse(input);
  if (!parsed.success) return actionError(parsed.error.issues[0]?.message ?? "Please check the form and try again.");

  try {
    const context = await getPharmacyContext();
    if (!context) return actionError("Your session has expired. Please sign in again.");
    assertManager(context.role);

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("pharmacies")
      .update({
        name: parsed.data.name,
        logo_url: parsed.data.logoUrl || null,
        email: parsed.data.email || null,
        phone: parsed.data.phone || null,
        website: parsed.data.website || null,
        address: parsed.data.address || null,
        city: parsed.data.city || null,
        country: parsed.data.country || null,
        tax_number: parsed.data.taxNumber || null,
      })
      .eq("id", context.pharmacy.id)
      .select()
      .single();

    if (error) return actionError(friendlyError(error));
    revalidatePath("/dashboard", "layout");
    return actionSuccess(data as Pharmacy);
  } catch (error) {
    return actionError(friendlyError(error));
  }
}

const invoiceSettingsSchema = z.object({
  invoicePrefix: z.string().trim().min(1, "Invoice prefix is required").max(10),
  invoiceFooter: z.string().trim().max(500).optional(),
  currency: z.string().trim().length(3, "Use a 3-letter currency code, e.g. USD"),
  taxRate: z.coerce.number().min(0).max(100),
  expiryAlertDays: z.coerce.number().int().min(1).max(365),
});

export async function updateInvoiceSettings(input: z.infer<typeof invoiceSettingsSchema>): Promise<ActionResult<Pharmacy>> {
  const parsed = invoiceSettingsSchema.safeParse(input);
  if (!parsed.success) return actionError(parsed.error.issues[0]?.message ?? "Please check the form and try again.");

  try {
    const context = await getPharmacyContext();
    if (!context) return actionError("Your session has expired. Please sign in again.");
    assertManager(context.role);

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("pharmacies")
      .update({
        invoice_prefix: parsed.data.invoicePrefix.toUpperCase(),
        invoice_footer: parsed.data.invoiceFooter || "",
        currency: parsed.data.currency.toUpperCase(),
        tax_rate: parsed.data.taxRate,
        expiry_alert_days: parsed.data.expiryAlertDays,
      })
      .eq("id", context.pharmacy.id)
      .select()
      .single();

    if (error) return actionError(friendlyError(error));
    revalidatePath("/dashboard", "layout");
    return actionSuccess(data as Pharmacy);
  } catch (error) {
    return actionError(friendlyError(error));
  }
}

const accountSchema = z.object({
  fullName: z.string().trim().min(2, "Name is required"),
  phone: z.string().trim().optional(),
  avatarUrl: z.string().trim().url("Enter a valid URL").optional().or(z.literal("")),
});

export async function updateAccount(input: z.infer<typeof accountSchema>): Promise<ActionResult<Profile>> {
  const parsed = accountSchema.safeParse(input);
  if (!parsed.success) return actionError(parsed.error.issues[0]?.message ?? "Please check the form and try again.");

  try {
    const context = await getPharmacyContext();
    if (!context) return actionError("Your session has expired. Please sign in again.");

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("profiles")
      .update({ full_name: parsed.data.fullName, phone: parsed.data.phone || null, avatar_url: parsed.data.avatarUrl || null })
      .eq("id", context.userId)
      .select()
      .single();

    if (error) return actionError(friendlyError(error));
    revalidatePath("/dashboard", "layout");
    return actionSuccess(data as Profile);
  } catch (error) {
    return actionError(friendlyError(error));
  }
}
