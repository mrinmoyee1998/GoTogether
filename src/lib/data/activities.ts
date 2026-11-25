import "server-only";
import { getAuth } from "@/lib/auth";
import { todayIST, weekendRangeIST } from "@/lib/dates";
import type { ActivityWithOrganiser, JoinRequest, Profile, PublicProfile } from "@/types/database";

export const ORGANISER_EMBED = "organiser:profiles!activities_organiser_id_fkey(id, full_name, avatar_url)";

export type DiscoverFilters = {
  q?: string;
  category?: string;
  area?: string;
  when?: string; // "today" | "weekend" | "week" | YYYY-MM-DD
};

function nowTimeIST() {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date());
}

/** Escape user input for use inside a PostgREST ilike filter. */
function sanitizeSearch(q: string) {
  return q.replace(/[%_\\,()*:"]/g, " ").replace(/\s+/g, " ").trim().slice(0, 60);
}

export async function listUpcomingActivities(filters: DiscoverFilters = {}, limit = 60) {
  const { supabase } = await getAuth();
  const today = todayIST();
  let query = supabase
    .from("activities")
    .select(`*, ${ORGANISER_EMBED}`)
    .eq("status", "active")
    .or(`activity_date.gt.${today},and(activity_date.eq.${today},start_time.gt.${nowTimeIST()})`)
    .order("activity_date", { ascending: true })
    .order("start_time", { ascending: true })
    .limit(limit);

  const q = filters.q ? sanitizeSearch(filters.q) : "";
  if (q) query = query.or(`title.ilike.*${q}*,description.ilike.*${q}*,venue_name.ilike.*${q}*`);
  if (filters.category) query = query.eq("category", filters.category);
  if (filters.area) query = query.eq("neighbourhood", filters.area);

  if (filters.when === "today") {
    query = query.eq("activity_date", today);
  } else if (filters.when === "weekend") {
    const { from, to } = weekendRangeIST();
    query = query.gte("activity_date", from).lte("activity_date", to);
  } else if (filters.when === "week") {
    const end = new Date(`${today}T00:00:00`);
    end.setDate(end.getDate() + 7);
    query = query.lte("activity_date", end.toISOString().slice(0, 10));
  } else if (filters.when && /^\d{4}-\d{2}-\d{2}$/.test(filters.when)) {
    query = query.eq("activity_date", filters.when);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Could not load activities: ${error.message}`);
  return (data ?? []) as unknown as ActivityWithOrganiser[];
}

export async function getActivity(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { supabase } = await getAuth();
  const { data, error } = await supabase.from("activities").select(`*, ${ORGANISER_EMBED}`).eq("id", id).maybeSingle();
  if (error) throw new Error(`Could not load activity: ${error.message}`);
  return data as unknown as ActivityWithOrganiser | null;
}

export type OrganiserProfile = Pick<Profile, "id" | "full_name" | "avatar_url" | "bio" | "neighbourhood" | "interests" | "created_at">;

/** Richer organiser profile, only available to signed-in users (RLS + column grants). */
export async function getOrganiserProfile(id: string) {
  const { supabase, user } = await getAuth();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, bio, neighbourhood, interests, created_at")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const { count } = await supabase.from("activities").select("id", { count: "exact", head: true }).eq("organiser_id", id);
  return { ...(data as OrganiserProfile), hostedCount: count ?? 0 };
}

export type Participant = { request_id: string; joined_at: string; profile: Pick<Profile, "id" | "full_name" | "avatar_url" | "neighbourhood"> | null };

/** Confirmed participants (signed-in users only, enforced by RLS). */
export async function getConfirmedParticipants(activityId: string): Promise<Participant[]> {
  const { supabase, user } = await getAuth();
  if (!user) return [];
  const { data, error } = await supabase
    .from("join_requests")
    .select("id, updated_at, profile:profiles!join_requests_user_id_fkey(id, full_name, avatar_url, neighbourhood)")
    .eq("activity_id", activityId)
    .eq("status", "accepted")
    .order("updated_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({
    request_id: r.id,
    joined_at: r.updated_at,
    profile: r.profile as Participant["profile"],
  }));
}

export async function getMyRequest(activityId: string) {
  const { supabase, user } = await getAuth();
  if (!user) return null;
  const { data } = await supabase
    .from("join_requests")
    .select("*")
    .eq("activity_id", activityId)
    .eq("user_id", user.id)
    .maybeSingle();
  return data as JoinRequest | null;
}

export type RequestWithProfile = JoinRequest & {
  profile: Pick<Profile, "id" | "full_name" | "avatar_url" | "neighbourhood" | "bio" | "interests"> | null;
};

/** All requests for an activity — only returns rows to the organiser (RLS). */
export async function getRequestsForActivity(activityId: string) {
  const { supabase } = await getAuth();
  const { data, error } = await supabase
    .from("join_requests")
    .select("*, profile:profiles!join_requests_user_id_fkey(id, full_name, avatar_url, neighbourhood, bio, interests)")
    .eq("activity_id", activityId)
    .in("status", ["pending", "accepted"])
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as RequestWithProfile[];
}

export type { PublicProfile };
