"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Bell, CalendarClock, CheckCheck, PackageX, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatRelative } from "@/lib/utils/format";
import { markAllNotificationsRead } from "@/lib/actions/notifications";
import type { AlertSummary } from "@/lib/supabase/queries";
import type { AppNotification } from "@/lib/types/database";

export function NotificationsMenu({
  pharmacyId,
  alertSummary,
  notifications,
}: {
  pharmacyId: string;
  alertSummary: AlertSummary;
  notifications: AppNotification[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const alerts = [
    alertSummary.outOfStock > 0 && {
      icon: PackageX,
      label: `${alertSummary.outOfStock} medicine${alertSummary.outOfStock === 1 ? "" : "s"} out of stock`,
      href: "/dashboard/inventory?status=out_of_stock",
      tone: "text-status-critical",
    },
    alertSummary.lowStock > 0 && {
      icon: TrendingDown,
      label: `${alertSummary.lowStock} medicine${alertSummary.lowStock === 1 ? "" : "s"} running low`,
      href: "/dashboard/inventory?status=low_stock",
      tone: "text-status-warning",
    },
    alertSummary.expired > 0 && {
      icon: AlertTriangle,
      label: `${alertSummary.expired} medicine${alertSummary.expired === 1 ? "" : "s"} expired`,
      href: "/dashboard/inventory?expiry=expired",
      tone: "text-status-critical",
    },
    alertSummary.expiringSoon > 0 && {
      icon: CalendarClock,
      label: `${alertSummary.expiringSoon} medicine${alertSummary.expiringSoon === 1 ? "" : "s"} expiring soon`,
      href: "/dashboard/inventory?expiry=expiring_soon",
      tone: "text-status-serious",
    },
  ].filter(Boolean) as { icon: typeof Bell; label: string; href: string; tone: string }[];

  const unreadCount = notifications.filter((n) => !n.is_read).length + alerts.length;

  function onMarkAllRead() {
    startTransition(async () => {
      await markAllNotificationsRead(pharmacyId);
      router.refresh();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="relative" />}>
        <Bell />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-4 min-w-4 justify-center rounded-full bg-status-critical p-0 px-1 text-[10px] text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        )}
        <span className="sr-only">Notifications</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-1.5 py-1">
          <DropdownMenuLabel className="p-0 text-sm">Notifications</DropdownMenuLabel>
          {notifications.some((n) => !n.is_read) && (
            <Button variant="ghost" size="xs" disabled={isPending} onClick={onMarkAllRead} className="text-xs">
              <CheckCheck className="size-3.5" /> Mark all read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />

        {alerts.length > 0 && (
          <>
            <p className="px-2.5 pt-1 pb-0.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
              Needs attention
            </p>
            {alerts.map((alert) => (
              <DropdownMenuItem key={alert.label} render={<Link href={alert.href} />}>
                <alert.icon className={alert.tone} />
                <span className="text-sm">{alert.label}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </>
        )}

        <p className="px-2.5 pt-1 pb-0.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
          Recent activity
        </p>
        {notifications.length === 0 ? (
          <p className="px-2.5 py-4 text-center text-sm text-muted-foreground">No activity yet.</p>
        ) : (
          <div className="max-h-72 overflow-y-auto">
            {notifications.slice(0, 8).map((n) => (
              <DropdownMenuItem key={n.id} className="flex-col items-start gap-0.5 whitespace-normal">
                <span className="flex items-center gap-1.5 text-sm font-medium">
                  {!n.is_read && <span className="size-1.5 shrink-0 rounded-full bg-primary" />}
                  {n.title}
                </span>
                <span className="pl-3 text-xs text-muted-foreground">{n.message}</span>
                <span className="pl-3 text-[11px] text-muted-foreground/70">{formatRelative(n.created_at)}</span>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
