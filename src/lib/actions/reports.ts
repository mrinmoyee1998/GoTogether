"use server";

import { getAuth } from "@/lib/auth";
import { reportSchema, type ActionResult } from "@/lib/validation";

export async function reportActivity(activityId: string, reason: string, details?: string): Promise<ActionResult> {
  const { supabase, user } = await getAuth();
  if (!user) return { ok: false, error: "Please log in to report an activity." };

  const parsed = reportSchema.safeParse({ reason, details });
  if (!parsed.success) return { ok: false, error: "Please choose a reason." };

  const { error } = await supabase
    .from("reports")
    .insert({ activity_id: activityId, reporter_id: user.id, reason: parsed.data.reason, details: parsed.data.details });
  if (error) {
    if (error.code === "23505") return { ok: true, message: "You've already reported this activity. Thank you." };
    return { ok: false, error: "Could not submit the report. Please try again." };
  }
  return { ok: true, message: "Thanks for letting us know. Our team will review this report." };
}
