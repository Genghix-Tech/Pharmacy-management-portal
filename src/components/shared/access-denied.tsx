import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { roleLabel } from "@/lib/utils/permissions";
import type { PharmacyRole } from "@/lib/types/database";

/**
 * Rendered instead of a page's content when the signed-in role can't reach
 * it. Deliberately a plain return-early render (not a thrown error) so the
 * message is never swallowed by Next's production error-boundary redaction —
 * see the note in lib/utils/permissions.ts.
 */
export function AccessDenied({ role }: { role: PharmacyRole }) {
  return (
    <EmptyState
      icon={ShieldAlert}
      title="You don't have access to this page"
      description={`Your role (${roleLabel(role)}) doesn't include this section. Ask your pharmacy owner to change your role if you need access.`}
      action={
        <Button variant="outline" render={<Link href="/dashboard" />}>
          Back to dashboard
        </Button>
      }
      className="py-20"
    />
  );
}
