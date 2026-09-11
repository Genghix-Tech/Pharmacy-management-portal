"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarcodeScannerButton } from "@/components/shared/barcode-scanner";
import { createMedicine, updateMedicine, type MedicineInput } from "@/lib/actions/medicines";
import { UNIT_TYPES } from "@/lib/utils/status";
import type { Category, Medicine, Supplier } from "@/lib/types/database";

const NONE = "__none__";

function toValues(medicine?: Medicine): MedicineInput {
  return {
    name: medicine?.name ?? "",
    genericName: medicine?.generic_name ?? "",
    brand: medicine?.brand ?? "",
    sku: medicine?.sku ?? "",
    barcode: medicine?.barcode ?? "",
    categoryId: medicine?.category_id ?? "",
    manufacturer: medicine?.manufacturer ?? "",
    supplierId: medicine?.supplier_id ?? "",
    batchNumber: medicine?.batch_number ?? "",
    purchasePrice: medicine?.purchase_price ?? 0,
    sellingPrice: medicine?.selling_price ?? 0,
    quantity: medicine?.quantity ?? 0,
    minStockLevel: medicine?.min_stock_level ?? 10,
    expiryDate: medicine?.expiry_date ?? "",
    manufacturingDate: medicine?.manufacturing_date ?? "",
    unitType: medicine?.unit_type ?? "tablet",
    taxRate: medicine?.tax_rate ?? 0,
    discountRate: medicine?.discount_rate ?? 0,
    description: medicine?.description ?? "",
    status: medicine?.status ?? "active",
  };
}

export function MedicineForm({
  medicine,
  categories,
  suppliers,
}: {
  medicine?: Medicine;
  categories: Category[];
  suppliers: Supplier[];
}) {
  const router = useRouter();
  const isEdit = !!medicine;
  const [values, setValues] = useState<MedicineInput>(toValues(medicine));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function update<K extends keyof MedicineInput>(key: K, value: MedicineInput[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = isEdit ? await updateMedicine(medicine!.id, values) : await createMedicine(values);
      if (!result.success) {
        setError(result.error);
        return;
      }
      toast.success(isEdit ? "Medicine updated." : "Medicine added.");
      router.push(`/dashboard/medicines/${result.data.id}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <section className="rounded-xl border bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold">Basic information</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Medicine name" required>
            <Input required value={values.name} onChange={(e) => update("name", e.target.value)} placeholder="Amoxicillin 500mg" />
          </Field>
          <Field label="Generic name">
            <Input value={values.genericName} onChange={(e) => update("genericName", e.target.value)} />
          </Field>
          <Field label="Brand">
            <Input value={values.brand} onChange={(e) => update("brand", e.target.value)} />
          </Field>
          <Field label="Category">
            <Select value={values.categoryId || NONE} onValueChange={(v) => update("categoryId", v && v !== NONE ? v : "")}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>No category</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Manufacturer">
            <Input value={values.manufacturer} onChange={(e) => update("manufacturer", e.target.value)} />
          </Field>
          <Field label="Supplier">
            <Select value={values.supplierId || NONE} onValueChange={(v) => update("supplierId", v && v !== NONE ? v : "")}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select supplier" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>No supplier</SelectItem>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </section>

      <section className="rounded-xl border bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold">Identification</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="SKU">
            <Input value={values.sku} onChange={(e) => update("sku", e.target.value)} placeholder="Auto-generated if left blank" />
          </Field>
          <Field label="Barcode">
            <div className="flex gap-2">
              <Input value={values.barcode} onChange={(e) => update("barcode", e.target.value)} placeholder="Scan or type" />
              <BarcodeScannerButton onScan={(code) => update("barcode", code)} />
            </div>
          </Field>
          <Field label="Batch number">
            <Input value={values.batchNumber} onChange={(e) => update("batchNumber", e.target.value)} />
          </Field>
        </div>
      </section>

      <section className="rounded-xl border bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold">Pricing & stock</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Purchase price" required>
            <Input type="number" min="0" step="0.01" required value={values.purchasePrice} onChange={(e) => update("purchasePrice", Number(e.target.value))} />
          </Field>
          <Field label="Selling price" required>
            <Input type="number" min="0" step="0.01" required value={values.sellingPrice} onChange={(e) => update("sellingPrice", Number(e.target.value))} />
          </Field>
          <Field label="Unit type" required>
            <Select value={values.unitType} onValueChange={(v) => v && update("unitType", v)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {UNIT_TYPES.map((u) => (
                  <SelectItem key={u} value={u} className="capitalize">{u}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label={isEdit ? "Current quantity" : "Opening quantity"} required>
            <Input type="number" min="0" step="1" required disabled={isEdit} value={values.quantity} onChange={(e) => update("quantity", Number(e.target.value))} />
            {isEdit && <p className="text-xs text-muted-foreground">Use &ldquo;Adjust stock&rdquo; on the medicine page to change this.</p>}
          </Field>
          <Field label="Minimum stock level" required>
            <Input type="number" min="0" step="1" required value={values.minStockLevel} onChange={(e) => update("minStockLevel", Number(e.target.value))} />
          </Field>
          <Field label="Tax rate (%)">
            <Input type="number" min="0" max="100" step="0.1" value={values.taxRate} onChange={(e) => update("taxRate", Number(e.target.value))} />
          </Field>
          <Field label="Discount rate (%)">
            <Input type="number" min="0" max="100" step="0.1" value={values.discountRate} onChange={(e) => update("discountRate", Number(e.target.value))} />
          </Field>
          <Field label="Status">
            <Select value={values.status} onValueChange={(v) => update("status", v as MedicineInput["status"])}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
      </section>

      <section className="rounded-xl border bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold">Dates & description</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Manufacturing date">
            <Input type="date" value={values.manufacturingDate} onChange={(e) => update("manufacturingDate", e.target.value)} />
          </Field>
          <Field label="Expiry date">
            <Input type="date" value={values.expiryDate} onChange={(e) => update("expiryDate", e.target.value)} />
          </Field>
        </div>
        <div className="mt-4 space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" rows={3} value={values.description} onChange={(e) => update("description", e.target.value)} />
        </div>
      </section>

      {error && (
        <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 className="animate-spin" /> : <Save />}
          {isEdit ? "Save changes" : "Add medicine"}
        </Button>
      </div>
    </form>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}
