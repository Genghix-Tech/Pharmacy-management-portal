"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { friendlyError, type ActionResult, actionError, actionSuccess } from "@/lib/utils/errors";

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

const signUpSchema = z.object({
  ownerName: z.string().trim().min(2, "Enter your full name"),
  pharmacyName: z.string().trim().min(2, "Enter your pharmacy's name"),
  email: z.string().trim().email("Enter a valid email address"),
  phone: z.string().trim().min(7, "Enter a valid phone number"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  address: z.string().trim().min(3, "Enter your pharmacy address"),
  city: z.string().trim().min(2, "Enter your city"),
  country: z.string().trim().min(2, "Enter your country"),
});

export type SignUpInput = z.infer<typeof signUpSchema>;

export async function signUp(input: SignUpInput): Promise<ActionResult<{ needsEmailConfirmation: boolean }>> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Please check the form and try again.");
  }
  const data = parsed.data;

  try {
    const supabase = await createClient();
    const { data: signUpData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${siteUrl()}/auth/callback`,
        data: {
          owner_name: data.ownerName,
          pharmacy_name: data.pharmacyName,
          phone: data.phone,
          address: data.address,
          city: data.city,
          country: data.country,
        },
      },
    });

    if (error) return actionError(friendlyError(error));
    if (!signUpData.user) return actionError("Could not create your account. Please try again.");

    return actionSuccess({ needsEmailConfirmation: !signUpData.session });
  } catch (error) {
    return actionError(friendlyError(error));
  }
}

const signInSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

export async function signIn(input: z.infer<typeof signInSchema>): Promise<ActionResult<undefined>> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Please check the form and try again.");
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error) {
      if (/invalid login credentials/i.test(error.message)) {
        return actionError("Incorrect email or password.");
      }
      if (/email not confirmed/i.test(error.message)) {
        return actionError("Please verify your email address before signing in.");
      }
      return actionError(friendlyError(error));
    }
    return actionSuccess(undefined);
  } catch (error) {
    return actionError(friendlyError(error));
  }
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

const emailSchema = z.string().trim().email("Enter a valid email address");

export async function requestPasswordReset(email: string): Promise<ActionResult<undefined>> {
  const parsed = emailSchema.safeParse(email);
  if (!parsed.success) return actionError(parsed.error.issues[0]?.message ?? "Enter a valid email address");

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
      redirectTo: `${siteUrl()}/auth/callback?next=/reset-password`,
    });
    if (error) return actionError(friendlyError(error));
    return actionSuccess(undefined);
  } catch (error) {
    return actionError(friendlyError(error));
  }
}

export async function resendVerificationEmail(email: string): Promise<ActionResult<undefined>> {
  const parsed = emailSchema.safeParse(email);
  if (!parsed.success) return actionError(parsed.error.issues[0]?.message ?? "Enter a valid email address");

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: parsed.data,
      options: { emailRedirectTo: `${siteUrl()}/auth/callback` },
    });
    if (error) return actionError(friendlyError(error));
    return actionSuccess(undefined);
  } catch (error) {
    return actionError(friendlyError(error));
  }
}

const newPasswordSchema = z.string().min(8, "Password must be at least 8 characters");

export async function updatePassword(password: string): Promise<ActionResult<undefined>> {
  const parsed = newPasswordSchema.safeParse(password);
  if (!parsed.success) return actionError(parsed.error.issues[0]?.message ?? "Please choose a stronger password");

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({ password: parsed.data });
    if (error) return actionError(friendlyError(error));
    return actionSuccess(undefined);
  } catch (error) {
    return actionError(friendlyError(error));
  }
}
