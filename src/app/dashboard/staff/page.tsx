import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { UserCog } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { AccessDenied } from "@/components/shared/access-denied";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { AddStaffDialog } from "@/components/staff/add-staff-dialog";
import { StaffRoleSelect } from "@/components/staff/staff-role-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getPharmacyContext } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import { removeStaffMember } from "@/lib/actions/staff";
import { initials } from "@/lib/utils/format";
import { roleLabel } from "@/lib/utils/permissions";

export const metadata: Metadata = { title: "Staff" };

export default async function StaffPage() {
  const context = await getPharmacyContext();
  if (!context) redirect("/login");
  if (context.role !== "owner") return <AccessDenied role={context.role} />;

  const supabase = await createClient();
  const { data: members } = await supabase
    .from("pharmacy_users")
    .select("*, profiles(id, full_name, email, avatar_url)")
    .eq("pharmacy_id", context.pharmacy.id)
    .order("created_at");

  return (
    <div>
      <PageHeader title="Staff" description="Manage who has access to your pharmacy and what they can do." actions={<AddStaffDialog />} />

      {!members?.length ? (
        <EmptyState icon={UserCog} title="No staff yet" description="Add cashiers, managers or inventory staff to your team." action={<AddStaffDialog />} />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="w-1" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((m) => {
                const profile = m.profiles as unknown as { id: string; full_name: string; email: string | null; avatar_url: string | null } | null;
                const isOwner = m.role === "owner";
                return (
                  <TableRow key={m.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar className="size-8">
                          <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">{initials(profile?.full_name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{profile?.full_name || "—"}</p>
                          <p className="text-xs text-muted-foreground">{profile?.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {isOwner ? (
                        <Badge>{roleLabel(m.role)}</Badge>
                      ) : (
                        <StaffRoleSelect userId={m.user_id} role={m.role as "manager" | "cashier" | "inventory_manager"} />
                      )}
                    </TableCell>
                    <TableCell>
                      {!isOwner && (
                        <ConfirmDeleteButton
                          title={`Remove ${profile?.full_name}?`}
                          description="They will immediately lose access to this pharmacy."
                          confirmLabel="Remove"
                          onConfirm={removeStaffMember.bind(null, m.id)}
                          successMessage="Staff member removed."
                        />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
