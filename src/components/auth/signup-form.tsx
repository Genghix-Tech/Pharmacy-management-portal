"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUp } from "@/lib/actions/auth";

const initialState = {
  ownerName: "",
  pharmacyName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  address: "",
  city: "",
  country: "",
};

export function SignupForm() {
  const router = useRouter();
  const [values, setValues] = useState(initialState);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function update<K extends keyof typeof values>(key: K, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (values.password !== values.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    startTransition(async () => {
      const result = await signUp(values);
      if (!result.success) {
        setError(result.error);
        return;
      }
      const email = encodeURIComponent(values.email);
      if (result.data.needsEmailConfirmation) {
        router.push(`/verify-email?email=${email}`);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="ownerName">Your full name</Label>
          <Input id="ownerName" required value={values.ownerName} onChange={(e) => update("ownerName", e.target.value)} placeholder="Jane Doe" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pharmacyName">Pharmacy name</Label>
          <Input id="pharmacyName" required value={values.pharmacyName} onChange={(e) => update("pharmacyName", e.target.value)} placeholder="City Care Pharmacy" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" required value={values.email} onChange={(e) => update("email", e.target.value)} placeholder="you@pharmacy.com" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone number</Label>
          <Input id="phone" type="tel" required value={values.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+1 555 123 4567" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" autoComplete="new-password" required minLength={8} value={values.password} onChange={(e) => update("password", e.target.value)} placeholder="At least 8 characters" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input id="confirmPassword" type="password" autoComplete="new-password" required value={values.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} placeholder="Re-enter password" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="address">Pharmacy address</Label>
        <Input id="address" required value={values.address} onChange={(e) => update("address", e.target.value)} placeholder="123 Main Street" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="city">City</Label>
          <Input id="city" required value={values.city} onChange={(e) => update("city", e.target.value)} placeholder="Springfield" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="country">Country</Label>
          <Input id="country" required value={values.country} onChange={(e) => update("country", e.target.value)} placeholder="United States" />
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={isPending}>
        {isPending && <Loader2 className="animate-spin" />}
        Create your pharmacy account
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        By continuing you agree to our Terms of Service and Privacy Policy.
      </p>
    </form>
  );
}
