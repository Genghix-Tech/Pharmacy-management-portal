"use client";

import { useState, useTransition } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePharmacyProfile } from "@/lib/actions/settings";
import type { Pharmacy } from "@/lib/types/database";

export function PharmacyProfileForm({ pharmacy, readOnly }: { pharmacy: Pharmacy; readOnly: boolean }) {
  const [values, setValues] = useState({
    name: pharmacy.name,
    logoUrl: pharmacy.logo_url ?? "",
    email: pharmacy.email ?? "",
    phone: pharmacy.phone ?? "",
    website: pharmacy.website ?? "",
    address: pharmacy.address ?? "",
    city: pharmacy.city ?? "",
    country: pharmacy.country ?? "",
    taxNumber: pharmacy.tax_number ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function update<K extends keyof typeof values>(key: K, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await updatePharmacyProfile(values);
      if (!result.success) {
        setError(result.error);
        return;
      }
      toast.success("Pharmacy profile updated.");
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl border bg-card p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Pharmacy name" required>
          <Input required disabled={readOnly} value={values.name} onChange={(e) => update("name", e.target.value)} />
        </Field>
        <Field label="Logo URL">
          <Input disabled={readOnly} value={values.logoUrl} onChange={(e) => update("logoUrl", e.target.value)} placeholder="https://…" />
        </Field>
        <Field label="Email">
          <Input type="email" disabled={readOnly} value={values.email} onChange={(e) => update("email", e.target.value)} />
        </Field>
        <Field label="Phone">
          <Input disabled={readOnly} value={values.phone} onChange={(e) => update("phone", e.target.value)} />
        </Field>
        <Field label="Website">
          <Input disabled={readOnly} value={values.website} onChange={(e) => update("website", e.target.value)} placeholder="https://…" />
        </Field>
        <Field label="Tax information">
          <Input disabled={readOnly} value={values.taxNumber} onChange={(e) => update("taxNumber", e.target.value)} />
        </Field>
        <Field label="Address" className="sm:col-span-2">
          <Input disabled={readOnly} value={values.address} onChange={(e) => update("address", e.target.value)} />
        </Field>
        <Field label="City">
          <Input disabled={readOnly} value={values.city} onChange={(e) => update("city", e.target.value)} />
        </Field>
        <Field label="Country">
          <Input disabled={readOnly} value={values.country} onChange={(e) => update("country", e.target.value)} />
        </Field>
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

function Field({ label, required, className, children }: { label: string; required?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label>{label} {required && <span className="text-destructive">*</span>}</Label>
      {children}
    </div>
  );
}
