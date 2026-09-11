"use client";

import { useState, useTransition } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateInvoiceSettings } from "@/lib/actions/settings";
import type { Pharmacy } from "@/lib/types/database";

export function InvoiceSettingsForm({ pharmacy, readOnly }: { pharmacy: Pharmacy; readOnly: boolean }) {
  const [values, setValues] = useState({
    invoicePrefix: pharmacy.invoice_prefix,
    invoiceFooter: pharmacy.invoice_footer,
    currency: pharmacy.currency,
    taxRate: pharmacy.tax_rate,
    expiryAlertDays: pharmacy.expiry_alert_days,
  });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function update<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await updateInvoiceSettings(values);
      if (!result.success) {
        setError(result.error);
        return;
      }
      toast.success("Invoice settings updated.");
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl border bg-card p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Invoice prefix</Label>
          <Input disabled={readOnly} value={values.invoicePrefix} onChange={(e) => update("invoicePrefix", e.target.value)} placeholder="INV" />
          <p className="text-xs text-muted-foreground">Invoices look like {values.invoicePrefix || "INV"}-2026-00001</p>
        </div>
        <div className="space-y-1.5">
          <Label>Currency (3-letter code)</Label>
          <Input disabled={readOnly} value={values.currency} maxLength={3} onChange={(e) => update("currency", e.target.value.toUpperCase())} placeholder="USD" />
        </div>
        <div className="space-y-1.5">
          <Label>Default tax rate (%)</Label>
          <Input type="number" min="0" max="100" step="0.1" disabled={readOnly} value={values.taxRate} onChange={(e) => update("taxRate", Number(e.target.value))} />
        </div>
        <div className="space-y-1.5">
          <Label>Expiry alert window (days)</Label>
          <Input type="number" min="1" max="365" step="1" disabled={readOnly} value={values.expiryAlertDays} onChange={(e) => update("expiryAlertDays", Number(e.target.value))} />
          <p className="text-xs text-muted-foreground">Medicines expiring within this many days are flagged &ldquo;Expiring Soon&rdquo;.</p>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Invoice footer message</Label>
        <Textarea disabled={readOnly} rows={2} value={values.invoiceFooter} onChange={(e) => update("invoiceFooter", e.target.value)} />
      </div>
      {error && (
        <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      {!readOnly && (
        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? <Loader2 className="animate-spin" /> : <Save />}
            Save changes
          </Button>
        </div>
      )}
    </form>
  );
}
