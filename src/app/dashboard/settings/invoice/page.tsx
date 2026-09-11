import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { InvoiceSettingsForm } from "@/components/settings/invoice-settings-form";
import { getPharmacyContext } from "@/lib/supabase/queries";

export const metadata: Metadata = { title: "Invoice Settings" };

export default async function InvoiceSettingsPage() {
  const context = await getPharmacyContext();
  if (!context) redirect("/login");

  return <InvoiceSettingsForm pharmacy={context.pharmacy} readOnly={context.role !== "owner" && context.role !== "manager"} />;
}
