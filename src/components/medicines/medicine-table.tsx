"use client";

import Link from "next/link";
import { Eye, Pencil } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExpiryStatusBadge, StockStatusBadge } from "@/components/shared/status-badge";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { StockAdjustDialog } from "@/components/medicines/stock-adjust-dialog";
import { deleteMedicine } from "@/lib/actions/medicines";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { MedicineStatusRow } from "@/lib/types/database";

export type MedicineRow = MedicineStatusRow & {
  categories: { name: string } | null;
  suppliers: { name: string } | null;
};

export function MedicineTable({
  medicines,
  currency,
  canManage,
}: {
  medicines: MedicineRow[];
  currency: string;
  canManage: boolean;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Medicine</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead className="hidden md:table-cell">Batch</TableHead>
            <TableHead className="text-right">Stock</TableHead>
            <TableHead className="hidden text-right lg:table-cell">Purchase price</TableHead>
            <TableHead className="text-right">Selling price</TableHead>
            <TableHead className="hidden md:table-cell">Expiry</TableHead>
            <TableHead className="hidden lg:table-cell">Supplier</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-1" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {medicines.map((m) => (
            <TableRow key={m.id}>
              <TableCell>
                <Link href={`/dashboard/medicines/${m.id}`} className="font-medium hover:underline">
                  {m.name}
                </Link>
                {(m.generic_name || m.brand) && (
                  <p className="text-xs text-muted-foreground">{[m.generic_name, m.brand].filter(Boolean).join(" · ")}</p>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">{m.sku || "—"}</TableCell>
              <TableCell className="hidden text-muted-foreground md:table-cell">{m.batch_number || "—"}</TableCell>
              <TableCell className="text-right">
                <div className="flex flex-col items-end gap-1">
                  <span className="tabular-nums">{m.quantity} {m.unit_type}(s)</span>
                  <StockStatusBadge status={m.stock_status} />
                </div>
              </TableCell>
              <TableCell className="hidden text-right tabular-nums lg:table-cell">{formatCurrency(m.purchase_price, currency)}</TableCell>
              <TableCell className="text-right tabular-nums font-medium">{formatCurrency(m.selling_price, currency)}</TableCell>
              <TableCell className="hidden md:table-cell">
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground">{formatDate(m.expiry_date)}</span>
                  <ExpiryStatusBadge status={m.expiry_status} />
                </div>
              </TableCell>
              <TableCell className="hidden text-muted-foreground lg:table-cell">{m.suppliers?.name || "—"}</TableCell>
              <TableCell className="capitalize text-muted-foreground">{m.status}</TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <Tooltip>
                    <TooltipTrigger render={<Link href={`/dashboard/medicines/${m.id}`} className={buttonVariants({ variant: "ghost", size: "icon-sm" })} />}>
                      <Eye />
                      <span className="sr-only">View</span>
                    </TooltipTrigger>
                    <TooltipContent>View</TooltipContent>
                  </Tooltip>
                  {canManage && (
                    <>
                      <Tooltip>
                        <TooltipTrigger render={<Link href={`/dashboard/medicines/${m.id}/edit`} className={buttonVariants({ variant: "ghost", size: "icon-sm" })} />}>
                          <Pencil />
                          <span className="sr-only">Edit</span>
                        </TooltipTrigger>
                        <TooltipContent>Edit</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger render={<span />}>
                          <StockAdjustDialog medicineId={m.id} currentQuantity={m.quantity} unitType={m.unit_type} compact />
                        </TooltipTrigger>
                        <TooltipContent>Adjust stock</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger render={<span />}>
                          <ConfirmDeleteButton
                            title={`Delete "${m.name}"?`}
                            description="This can't be undone. If it has sales or purchase history, mark it inactive instead."
                            onConfirm={() => deleteMedicine(m.id)}
                            successMessage="Medicine deleted."
                          />
                        </TooltipTrigger>
                        <TooltipContent>Delete</TooltipContent>
                      </Tooltip>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
