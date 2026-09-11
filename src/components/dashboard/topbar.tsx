"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Logo } from "@/components/brand/logo";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { GlobalSearch } from "@/components/dashboard/global-search";
import { NotificationsMenu } from "@/components/dashboard/notifications-menu";
import { UserMenu } from "@/components/dashboard/user-menu";
import type { AlertSummary } from "@/lib/supabase/queries";
import type { AppNotification, PharmacyRole } from "@/lib/types/database";

export function DashboardTopbar({
  pharmacyId,
  pharmacyName,
  currency,
  role,
  userName,
  userEmail,
  avatarUrl,
  alertSummary,
  notifications,
}: {
  pharmacyId: string;
  pharmacyName: string;
  currency: string;
  role: PharmacyRole;
  userName: string;
  userEmail: string;
  avatarUrl?: string | null;
  alertSummary: AlertSummary;
  notifications: AppNotification[];
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/80 sm:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileNavOpen(true)}>
        <Menu />
        <span className="sr-only">Open menu</span>
      </Button>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="h-16 justify-center border-b px-4 py-0">
            <SheetTitle className="sr-only">Navigation menu</SheetTitle>
            <Logo href="/dashboard" />
          </SheetHeader>
          <SidebarNav role={role} onNavigate={() => setMobileNavOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="hidden flex-col leading-tight md:flex">
        <span className="text-sm font-semibold">{pharmacyName}</span>
        <span className="text-xs text-muted-foreground">Pharmacy workspace</span>
      </div>

      <div className="ml-auto flex items-center justify-end gap-1.5">
        <GlobalSearch pharmacyId={pharmacyId} currency={currency} />
        <NotificationsMenu pharmacyId={pharmacyId} alertSummary={alertSummary} notifications={notifications} />
        <UserMenu name={userName} email={userEmail} role={role} avatarUrl={avatarUrl} />
      </div>
    </header>
  );
}
