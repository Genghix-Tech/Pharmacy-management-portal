"use client";

import { useState } from "react";
import { Download, Printer, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/brand/logo";
import { formatCurrency, formatDateTime } from "@/lib/utils/format";
import { PAYMENT_METHOD_LABEL, SALE_STATUS_META } from "@/lib/utils/status";
import type { Invoice, Sale, SaleItem } from "@/lib/types/database";

export function InvoiceDocument({
  sale,
  items,
  invoice,
}: {
  sale: Sale;
  items: SaleItem[];
  invoice: Invoice;
}) {
  const [receiptMode, setReceiptMode] = useState(false);
  const pharmacy = invoice.pharmacy_snapshot;
  const customer = invoice.customer_snapshot;
  const currency = pharmacy.currency;
  const statusMeta = SALE_STATUS_META[sale.status] ?? SALE_STATUS_META.completed;

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: `Invoice ${invoice.invoice_number}`, url });
        return;
      } catch {
        // user cancelled — fall through to clipboard
      }
    }
    await navigator.clipboard.writeText(url);
    toast.success("Invoice link copied to clipboard.");
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Invoice</p>
          <h1 className="text-xl font-semibold">{invoice.invoice_number}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => setReceiptMode((v) => !v)}>
            {receiptMode ? "A4 view" : "Receipt view"}
          </Button>
          <Button variant="outline" onClick={handleShare}>
            <Share2 /> Share
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Download /> Download PDF
          </Button>
          <Button onClick={() => window.print()}>
            <Printer /> Print Invoice
          </Button>
        </div>
      </div>

      <div
        className={`invoice-print rounded-2xl border bg-card shadow-sm ${receiptMode ? "mx-auto max-w-xs p-4 text-xs" : "p-8"}`}
      >
        <div className={`flex items-start justify-between gap-4 ${receiptMode ? "flex-col items-center text-center" : ""}`}>
          <div className={receiptMode ? "flex flex-col items-center" : ""}>
            <Logo href={null} className={receiptMode ? "justify-center" : ""} />
            <div className="mt-2 space-y-0.5 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">{pharmacy.name}</p>
              {pharmacy.address && <p>{pharmacy.address}{pharmacy.city ? `, ${pharmacy.city}` : ""}</p>}
              {pharmacy.phone && <p>{pharmacy.phone}</p>}
              {pharmacy.email && <p>{pharmacy.email}</p>}
              {pharmacy.tax_number && <p>Tax ID: {pharmacy.tax_number}</p>}
            </div>
          </div>
          {!receiptMode && (
            <div className="text-right">
              <p className="text-lg font-semibold tracking-tight">INVOICE</p>
              <p className="text-sm text-muted-foreground">{invoice.invoice_number}</p>
              <p className="text-sm text-muted-foreground">{formatDateTime(sale.created_at)}</p>
              <Badge variant="outline" className={`mt-2 border ${statusMeta.className}`}>{statusMeta.label}</Badge>
            </div>
          )}
        </div>

        {receiptMode && (
          <div className="my-3 border-t border-dashed pt-2 text-center">
            <p>{invoice.invoice_number}</p>
            <p className="text-muted-foreground">{formatDateTime(sale.created_at)}</p>
          </div>
        )}

        <div className={`mt-6 ${receiptMode ? "border-t border-dashed pt-2" : "border-t pt-4"}`}>
          <p className="mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Billed to</p>
          <p className="font-medium">{customer?.name ?? "Walk-in customer"}</p>
          {customer?.phone && <p className="text-muted-foreground">{customer.phone}</p>}
          {customer?.email && <p className="text-muted-foreground">{customer.email}</p>}
        </div>

        <table className="mt-6 w-full text-left">
          <thead>
            <tr className={`border-b text-xs text-muted-foreground uppercase ${receiptMode ? "border-dashed" : ""}`}>
              <th className="pb-2 font-medium">Item</th>
              <th className="pb-2 text-right font-medium">Qty</th>
              {!receiptMode && <th className="pb-2 text-right font-medium">Unit Price</th>}
              {!receiptMode && <th className="pb-2 text-right font-medium">Discount</th>}
              {!receiptMode && <th className="pb-2 text-right font-medium">Tax</th>}
              <th className="pb-2 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className={`border-b ${receiptMode ? "border-dashed" : ""}`}>
                <td className="py-2 pr-2">{item.medicine_name}</td>
                <td className="py-2 text-right tabular-nums">{item.quantity}</td>
                {!receiptMode && <td className="py-2 text-right tabular-nums">{formatCurrency(item.unit_price, currency)}</td>}
                {!receiptMode && <td className="py-2 text-right tabular-nums">{formatCurrency(item.discount_amount, currency)}</td>}
                {!receiptMode && <td className="py-2 text-right tabular-nums">{formatCurrency(item.tax_amount, currency)}</td>}
                <td className="py-2 text-right font-medium tabular-nums">{formatCurrency(item.total, currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className={`mt-4 ml-auto space-y-1 text-sm ${receiptMode ? "w-full" : "w-64"}`}>
          <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="tabular-nums">{formatCurrency(sale.subtotal, currency)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span className="tabular-nums">-{formatCurrency(sale.discount_amount, currency)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span className="tabular-nums">{formatCurrency(sale.tax_amount, currency)}</span></div>
          <div className={`flex justify-between font-semibold ${receiptMode ? "border-t border-dashed pt-1" : "border-t pt-1.5 text-base"}`}>
            <span>Grand Total</span><span className="tabular-nums">{formatCurrency(sale.total_amount, currency)}</span>
          </div>
          <div className="flex justify-between pt-1 text-muted-foreground"><span>Payment method</span><span>{PAYMENT_METHOD_LABEL[sale.payment_method]}</span></div>
        </div>

        <div className={`mt-8 text-center text-sm text-muted-foreground ${receiptMode ? "border-t border-dashed pt-2" : "border-t pt-4"}`}>
          {pharmacy.invoice_footer}
        </div>
      </div>
    </div>
  );
}
