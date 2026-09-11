import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountForm } from "@/components/settings/account-form";
import { ChangePasswordForm } from "@/components/settings/change-password-form";
import { getPharmacyContext } from "@/lib/supabase/queries";

export const metadata: Metadata = { title: "Account Settings" };

export default async function AccountSettingsPage() {
  const context = await getPharmacyContext();
  if (!context) redirect("/login");

  return (
    <div className="space-y-6">
      <AccountForm profile={context.profile} email={context.email} />
      <ChangePasswordForm />
    </div>
  );
}
