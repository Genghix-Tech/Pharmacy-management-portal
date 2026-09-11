import { redirect } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import { getAlertSummary, getPharmacyContext, getRecentNotifications } from "@/lib/supabase/queries";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const context = await getPharmacyContext();
  if (!context) redirect("/login");

  const { pharmacy, profile, role, email } = context;

  const [alertSummary, notifications] = await Promise.all([
    getAlertSummary(pharmacy.id),
    getRecentNotifications(pharmacy.id),
  ]);

  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardSidebar role={role} />
      <div className="flex min-h-screen flex-col lg:pl-64">
        <DashboardTopbar
          pharmacyId={pharmacy.id}
          pharmacyName={pharmacy.name}
          currency={pharmacy.currency}
          role={role}
          userName={profile.full_name || pharmacy.name}
          userEmail={email}
          avatarUrl={profile.avatar_url}
          alertSummary={alertSummary}
          notifications={notifications}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
