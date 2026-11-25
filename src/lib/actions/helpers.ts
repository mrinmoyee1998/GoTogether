import "server-only";
import { headers } from "next/headers";

/** Turn Supabase/Postgres errors into friendly user-facing messages. */
export function friendlyDbError(error: { message?: string; code?: string } | null | undefined, fallback = "Something went wrong. Please try again.") {
  if (!error) return fallback;
  const msg = error.message ?? "";
  if (msg.includes("capacity_not_exceeded")) return "Group size can't be lower than the number of confirmed participants.";
  if (msg.includes("future")) return "Activity must be scheduled in the future.";
  if (msg.includes("row-level security") || error.code === "42501") {
    return msg && !msg.includes("row-level security") ? msg : "You don't have permission to do that.";
  }
  if (error.code === "P0001" || error.code === "P0002" || error.code === "22023") return msg;
  if (error.code === "23514") return "Some details are invalid. Please check the form.";
  return fallback;
}

/** Public site URL used for auth email redirects. */
export async function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${proto}://${host}`;
}

/** Only accept image URLs that point at this project's public storage, in the user's own folder. */
export function isOwnStorageUrl(url: string | null | undefined, bucket: "avatars" | "activity-covers", userId: string) {
  if (!url) return true;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  return url.startsWith(`${base}/storage/v1/object/public/${bucket}/${userId}/`);
}
