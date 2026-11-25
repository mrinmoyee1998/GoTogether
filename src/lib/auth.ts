import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Per-request auth context: Supabase client, verified user and their profile. */
export const getAuth = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, profile: null } as const;
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return { supabase, user, profile } as const;
});

export async function requireUser(next = "/dashboard") {
  const ctx = await getAuth();
  if (!ctx.user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return { ...ctx, user: ctx.user };
}

/** Requires a signed-in user who has completed onboarding (incl. 18+ confirmation). */
export async function requireOnboarded(next = "/dashboard") {
  const ctx = await requireUser(next);
  if (!ctx.profile?.onboarding_completed) redirect(`/onboarding?next=${encodeURIComponent(next)}`);
  return { ...ctx, profile: ctx.profile! };
}
