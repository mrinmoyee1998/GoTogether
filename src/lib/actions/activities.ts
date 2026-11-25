"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getAuth } from "@/lib/auth";
import { activitySchema, flattenErrors, type ActionResult } from "@/lib/validation";
import { friendlyDbError, isOwnStorageUrl } from "./helpers";

function readActivityForm(formData: FormData) {
  return {
    title: formData.get("title") ?? "",
    category: formData.get("category") ?? "",
    description: formData.get("description") ?? "",
    activity_date: formData.get("activity_date") ?? "",
    start_time: formData.get("start_time") ?? "",
    venue_name: formData.get("venue_name") ?? "",
    neighbourhood: formData.get("neighbourhood") ?? "",
    max_participants: formData.get("max_participants") ?? "",
    maps_url: formData.get("maps_url") ?? "",
    estimated_cost: formData.get("estimated_cost") ?? "",
    cover_image_url: (formData.get("cover_image_url") as string) || null,
  };
}

export async function createActivity(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const { supabase, user, profile } = await getAuth();
  if (!user) return { ok: false, error: "Your session has expired. Please log in again." };
  if (!profile?.onboarding_completed) return { ok: false, error: "Please complete your profile first." };

  const parsed = activitySchema.safeParse(readActivityForm(formData));
  if (!parsed.success) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: flattenErrors(parsed.error) };
  if (!isOwnStorageUrl(parsed.data.cover_image_url, "activity-covers", user.id)) {
    return { ok: false, error: "Invalid cover image. Please upload it again." };
  }

  const { data, error } = await supabase
    .from("activities")
    .insert({ ...parsed.data, cover_image_url: parsed.data.cover_image_url ?? null, organiser_id: user.id })
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: friendlyDbError(error, "Could not create the activity.") };

  revalidatePath("/", "layout");
  redirect(`/activities/${data.id}?created=1`);
}

export async function updateActivity(activityId: string, _prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const { supabase, user } = await getAuth();
  if (!user) return { ok: false, error: "Your session has expired. Please log in again." };

  const { data: existing } = await supabase.from("activities").select("organiser_id, activity_date, start_time").eq("id", activityId).maybeSingle();
  if (!existing || existing.organiser_id !== user.id) return { ok: false, error: "Only the organiser can edit this activity." };

  const raw = readActivityForm(formData);
  const parsed = activitySchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: flattenErrors(parsed.error) };
  if (!isOwnStorageUrl(parsed.data.cover_image_url, "activity-covers", user.id)) {
    return { ok: false, error: "Invalid cover image. Please upload it again." };
  }

  const { error } = await supabase
    .from("activities")
    .update({ ...parsed.data, cover_image_url: parsed.data.cover_image_url ?? null })
    .eq("id", activityId)
    .eq("organiser_id", user.id);
  if (error) return { ok: false, error: friendlyDbError(error, "Could not update the activity.") };

  revalidatePath("/", "layout");
  redirect(`/activities/${activityId}?updated=1`);
}

export async function cancelActivity(activityId: string): Promise<ActionResult> {
  const { supabase, user } = await getAuth();
  if (!user) return { ok: false, error: "Your session has expired. Please log in again." };

  const { data, error } = await supabase
    .from("activities")
    .update({ status: "cancelled" })
    .eq("id", activityId)
    .eq("organiser_id", user.id)
    .select("id");
  if (error) return { ok: false, error: friendlyDbError(error, "Could not cancel the activity.") };
  if (!data?.length) return { ok: false, error: "Only the organiser can cancel this activity." };

  revalidatePath("/", "layout");
  return { ok: true, message: "Activity cancelled. Participants will see it as cancelled." };
}
