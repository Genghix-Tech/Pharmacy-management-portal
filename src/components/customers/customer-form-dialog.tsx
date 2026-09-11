"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createCustomer, updateCustomer, type CustomerInput } from "@/lib/actions/customers";
import type { Customer } from "@/lib/types/database";

const empty: CustomerInput = { name: "", phone: "", email: "", address: "", dateOfBirth: "", notes: "" };

export function CustomerFormDialog({ customer }: { customer?: Customer }) {
  const router = useRouter();
  const isEdit = !!customer;
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<CustomerInput>(
    customer
      ? {
          name: customer.name,
          phone: customer.phone ?? "",
          email: customer.email ?? "",
          address: customer.address ?? "",
          dateOfBirth: customer.date_of_birth ?? "",
          notes: customer.notes ?? "",
        }
      : empty
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function update<K extends keyof CustomerInput>(key: K, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = isEdit ? await updateCustomer(customer!.id, values) : await createCustomer(values);
      if (!result.success) {
        setError(result.error);
        return;
      }
      toast.success(isEdit ? "Customer updated." : "Customer added.");
      setOpen(false);
      if (!isEdit) setValues(empty);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant={isEdit ? "outline" : "default"} size={isEdit ? "sm" : "default"} />}>
        {isEdit ? (
          <>
            <Pencil /> Edit
          </>
        ) : (
          <>
            <Plus /> Add Customer
          </>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit customer" : "Add customer"}</DialogTitle>
            <DialogDescription>Customer details help personalize sales and receipts.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="c-name">Full name</Label>
              <Input id="c-name" required value={values.name} onChange={(e) => update("name", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-phone">Phone</Label>
              <Input id="c-phone" value={values.phone} onChange={(e) => update("phone", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-email">Email</Label>
              <Input id="c-email" type="email" value={values.email} onChange={(e) => update("email", e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="c-address">Address</Label>
              <Input id="c-address" value={values.address} onChange={(e) => update("address", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-dob">Date of birth (optional)</Label>
              <Input id="c-dob" type="date" value={values.dateOfBirth} onChange={(e) => update("dateOfBirth", e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="c-notes">Notes</Label>
              <Textarea id="c-notes" rows={3} value={values.notes} onChange={(e) => update("notes", e.target.value)} />
            </div>
            {error && (
              <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive sm:col-span-2">
                {error}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              {isEdit ? "Save changes" : "Add customer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
