"use client";

import { useState, useTransition } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { resendVerificationEmail } from "@/lib/actions/auth";

export function ResendVerificationButton({ email }: { email: string }) {
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);

  function onClick() {
    startTransition(async () => {
      const result = await resendVerificationEmail(email);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setSent(true);
      toast.success("Verification email sent.");
    });
  }

  return (
    <Button variant="outline" className="w-full" onClick={onClick} disabled={isPending || sent}>
      {isPending ? <Loader2 className="animate-spin" /> : <MailCheck />}
      {sent ? "Email sent" : "Resend verification email"}
    </Button>
  );
}
