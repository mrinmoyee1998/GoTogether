"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  loginSchema, signupSchema, forgotPasswordSchema, resetPasswordSchema, flattenErrors, type ActionResult,
} from "@/lib/validation";
import { safeNext } from "@/lib/utils";
import { siteUrl } from "./helpers";

export async function signUp(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = signupSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: flattenErrors(parsed.error) };

  const nextParam = formData.get("next")?.toString();
  const onboarding = nextParam && safeNext(nextParam, "") ? `/onboarding?next=${encodeURIComponent(safeNext(nextParam))}` : "/onboarding";

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${await siteUrl()}/auth/callback?next=${encodeURIComponent(onboarding)}`,
    },
  });

  if (error) {
    const msg = /already registered|already exists/i.test(error.message)
      ? "An account with this email already exists. Try logging in."
      : error.message;
    return { ok: false, error: msg };
  }

  // Supabase returns a user with no identities when the email is already taken (enumeration protection).
  if (data.user && data.user.identities && data.user.identities.length === 0) {
    return { ok: false, error: "An account with this email already exists. Try logging in." };
  }

  if (!data.session) {
    return { ok: true, message: "Check your inbox to confirm your email, then log in to finish setting up your profile." };
  }

  revalidatePath("/", "layout");
  redirect(onboarding);
}

export async function signIn(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: flattenErrors(parsed.error) };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    const msg = /email not confirmed/i.test(error.message)
      ? "Please confirm your email first — check your inbox for the link."
      : /invalid/i.test(error.message)
        ? "Incorrect email or password."
        : error.message;
    return { ok: false, error: msg };
  }

  const { data: profile } = await supabase.from("profiles").select("onboarding_completed").eq("id", data.user.id).maybeSingle();
  const next = safeNext(formData.get("next")?.toString(), "/discover");
  revalidatePath("/", "layout");
  if (!profile?.onboarding_completed) redirect(`/onboarding?next=${encodeURIComponent(next)}`);
  redirect(next);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

/**
 * Sends a password reset email. Always reports success (when the input is a
 * valid email) so the form can't be used to discover who has an account.
 */
export async function requestPasswordReset(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: flattenErrors(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${await siteUrl()}/auth/callback?next=/reset-password`,
  });

  if (error && /rate limit|too many|security purposes/i.test(error.message)) {
    return { ok: false, error: "Too many reset emails were requested. Please wait a few minutes and try again." };
  }
  // Supabase does not return an error for unknown emails, so surfacing real
  // failures (e.g. the email service being down) doesn't reveal who has an account.
  if (error) {
    console.error("resetPasswordForEmail failed:", error.message);
    return { ok: false, error: "We couldn't send the reset email right now. Please try again in a few minutes." };
  }

  return {
    ok: true,
    message: `If an account exists for ${parsed.data.email}, we've sent a link to reset your password. It can take a few minutes to arrive — check your spam folder too.`,
  };
}

/** Sets a new password for the user signed in through a reset link. */
export async function updatePassword(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse({ password: formData.get("password"), confirm: formData.get("confirm") });
  if (!parsed.success) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: flattenErrors(parsed.error) };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Your reset link has expired. Please request a new one." };

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    const msg = /different from the old/i.test(error.message)
      ? "Choose a password that's different from your current one."
      : /weak|short/i.test(error.message)
        ? "That password is too weak. Try a longer one."
        : "Couldn't update your password. Please request a new reset link.";
    return { ok: false, error: msg, fieldErrors: /different|weak|short/i.test(error.message) ? { password: msg } : undefined };
  }

  revalidatePath("/", "layout");
  redirect("/discover?password=updated");
}
