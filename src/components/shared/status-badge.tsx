import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { EXPIRY_STATUS_META, SALE_STATUS_META, STOCK_STATUS_META } from "@/lib/utils/status";
import type { ExpiryStatus, StockStatus } from "@/lib/types/database";

export function StockStatusBadge({ status, className }: { status: StockStatus; className?: string }) {
  const meta = STOCK_STATUS_META[status];
  return (
    <Badge variant="outline" className={cn("border", meta.className, className)}>
      {meta.label}
    </Badge>
  );
}

export function ExpiryStatusBadge({ status, className }: { status: ExpiryStatus; className?: string }) {
  const meta = EXPIRY_STATUS_META[status];
  if (!meta) return null;
  return (
    <Badge variant="outline" className={cn("border", meta.className, className)}>
      {meta.label}
    </Badge>
  );
}

export function SaleStatusBadge({ status, className }: { status: string; className?: string }) {
  const meta = SALE_STATUS_META[status] ?? SALE_STATUS_META.completed;
  return (
    <Badge variant="outline" className={cn("border", meta.className, className)}>
      {meta.label}
    </Badge>
  );
}
