import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PharmacyProfileForm } from "@/components/settings/pharmacy-profile-form";
import { getPharmacyContext } from "@/lib/supabase/queries";

export const metadata: Metadata = { title: "Pharmacy Profile" };

export default async function PharmacyProfileSettingsPage() {
  const context = await getPharmacyContext();
  if (!context) redirect("/login");

  return <PharmacyProfileForm pharmacy={context.pharmacy} readOnly={context.role !== "owner" && context.role !== "manager"} />;
}
