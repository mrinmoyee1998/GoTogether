"use server";

import { revalidatePath } from "next/cache";
import { getAuth } from "@/lib/auth";
import { joinMessageSchema, type ActionResult } from "@/lib/validation";
import { friendlyDbError } from "./helpers";

const UUID = /^[0-9a-f-]{36}$/i;

export async function requestToJoin(activityId: string, message?: string): Promise<ActionResult> {
  if (!UUID.test(activityId)) return { ok: false, error: "Invalid activity." };
  const { supabase, user } = await getAuth();
  if (!user) return { ok: false, error: "Please log in to request to join." };

  const parsedMsg = joinMessageSchema.safeParse(message);
  if (!parsedMsg.success) return { ok: false, error: parsedMsg.error.issues[0].message };

  const { error } = await supabase.rpc("request_to_join", { p_activity_id: activityId, p_message: parsedMsg.data || undefined });
  if (error) return { ok: false, error: friendlyDbError(error, "Could not send your request.") };

  revalidatePath("/", "layout");
  return { ok: true, message: "Request sent! The organiser will review it soon." };
}

export async function respondToRequest(requestId: string, decision: "accepted" | "declined"): Promise<ActionResult> {
  if (!UUID.test(requestId) || !["accepted", "declined"].includes(decision)) return { ok: false, error: "Invalid request." };
  const { supabase, user } = await getAuth();
  if (!user) return { ok: false, error: "Your session has expired. Please log in again." };

  const { error } = await supabase.rpc("respond_to_join_request", { p_request_id: requestId, p_decision: decision });
  if (error) return { ok: false, error: friendlyDbError(error, "Could not update the request.") };

  revalidatePath("/", "layout");
  return { ok: true, message: decision === "accepted" ? "Accepted — they're in!" : "Request declined." };
}

export async function cancelRequest(requestId: string): Promise<ActionResult> {
  if (!UUID.test(requestId)) return { ok: false, error: "Invalid request." };
  const { supabase, user } = await getAuth();
  if (!user) return { ok: false, error: "Your session has expired. Please log in again." };

  const { data, error } = await supabase.rpc("cancel_join_request", { p_request_id: requestId });
  if (error) return { ok: false, error: friendlyDbError(error, "Could not cancel the request.") };

  revalidatePath("/", "layout");
  return { ok: true, message: data && (data as { status: string }).status === "cancelled" ? "Request cancelled." : "Done." };
}
