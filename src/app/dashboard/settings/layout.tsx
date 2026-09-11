import { PageHeader } from "@/components/shared/page-header";
import { SettingsNav } from "@/components/settings/settings-nav";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Settings" description="Manage your pharmacy profile, invoicing, account and appearance." />
      <SettingsNav />
      {children}
    </div>
  );
}
