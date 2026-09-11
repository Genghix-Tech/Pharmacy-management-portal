import { Logo } from "@/components/brand/logo";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import type { PharmacyRole } from "@/lib/types/database";

export function DashboardSidebar({ role }: { role: PharmacyRole }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
      <div className="flex h-16 shrink-0 items-center border-b border-sidebar-border px-4">
        <Logo href="/dashboard" className="text-sidebar-foreground" />
      </div>
      <SidebarNav role={role} />
    </aside>
  );
}
