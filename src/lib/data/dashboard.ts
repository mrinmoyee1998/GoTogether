import "server-only";
import { getAuth } from "@/lib/auth";
import { ORGANISER_EMBED, type RequestWithProfile } from "./activities";
import type { Activity, ActivityWithOrganiser, JoinRequest } from "@/types/database";

export type HostedActivity = Activity & { requests: RequestWithProfile[] };
export type MyRequest = JoinRequest & { activity: ActivityWithOrganiser | null };

export async function getDashboardData(userId: string) {
  const { supabase } = await getAuth();

  const [hostedRes, mineRes] = await Promise.all([
    supabase
      .from("activities")
      .select("*, requests:join_requests(*, profile:profiles!join_requests_user_id_fkey(id, full_name, avatar_url, neighbourhood, bio, interests))")
      .eq("organiser_id", userId)
      .order("activity_date", { ascending: true })
      .order("start_time", { ascending: true }),
    supabase
      .from("join_requests")
      .select(`*, activity:activities(*, ${ORGANISER_EMBED})`)
      .eq("user_id", userId)
      .order("updated_at", { ascending: false }),
  ]);

  if (hostedRes.error) throw new Error(hostedRes.error.message);
  if (mineRes.error) throw new Error(mineRes.error.message);

  const hosted = (hostedRes.data ?? []) as unknown as HostedActivity[];
  for (const a of hosted) a.requests.sort((x, y) => x.created_at.localeCompare(y.created_at));
  const mine = (mineRes.data ?? []) as unknown as MyRequest[];

  return { hosted, mine };
}
