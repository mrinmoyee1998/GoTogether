"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, signupSchema, flattenErrors, type ActionResult } from "@/lib/validation";
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
