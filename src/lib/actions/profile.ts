"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getAuth } from "@/lib/auth";
import { profileSchema, flattenErrors, type ActionResult } from "@/lib/validation";
import { safeNext } from "@/lib/utils";
import { friendlyDbError, isOwnStorageUrl } from "./helpers";

export async function saveProfile(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const { supabase, user, profile } = await getAuth();
  if (!user) return { ok: false, error: "Your session has expired. Please log in again." };

  const parsed = profileSchema.safeParse({
    full_name: formData.get("full_name"),
    age_confirmed: formData.get("age_confirmed") === "on",
    city: formData.get("city"),
    neighbourhood: formData.get("neighbourhood"),
    bio: formData.get("bio") ?? undefined,
    interests: formData.getAll("interests"),
    avatar_url: (formData.get("avatar_url") as string) || null,
  });
  if (!parsed.success) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: flattenErrors(parsed.error) };

  if (!isOwnStorageUrl(parsed.data.avatar_url, "avatars", user.id)) {
    return { ok: false, error: "Invalid profile photo. Please upload it again." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.full_name,
      age_confirmed: true,
      city: parsed.data.city,
      neighbourhood: parsed.data.neighbourhood,
      bio: parsed.data.bio,
      interests: parsed.data.interests,
      avatar_url: parsed.data.avatar_url ?? null,
      onboarding_completed: true,
    })
    .eq("id", user.id);

  if (error) return { ok: false, error: friendlyDbError(error, "Could not save your profile.") };

  revalidatePath("/", "layout");
  if (!profile?.onboarding_completed) {
    redirect(safeNext(formData.get("next")?.toString(), "/discover?welcome=1"));
  }
  return { ok: true, message: "Profile updated" };
}
