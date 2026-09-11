"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateStaffRole } from "@/lib/actions/staff";

export function StaffRoleSelect({ userId, role }: { userId: string; role: "manager" | "cashier" | "inventory_manager" }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onChange(value: string) {
    startTransition(async () => {
      const result = await updateStaffRole(userId, value as "manager" | "cashier" | "inventory_manager");
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Role updated.");
      router.refresh();
    });
  }

  return (
    <Select value={role} onValueChange={(v) => v && onChange(v)} disabled={isPending}>
      <SelectTrigger size="sm" className="w-44"><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="manager">Manager</SelectItem>
        <SelectItem value="cashier">Cashier</SelectItem>
        <SelectItem value="inventory_manager">Inventory Manager</SelectItem>
      </SelectContent>
    </Select>
  );
}
