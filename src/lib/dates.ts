import { format, addDays } from "date-fns";
import { APP_TIMEZONE } from "./constants";

/** Current date/time parts in Mumbai, regardless of server timezone. */
function nowParts() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, time: `${get("hour") === "24" ? "00" : get("hour")}:${get("minute")}` };
}

/** Today's date in Mumbai as YYYY-MM-DD. */
export function todayIST() {
  return nowParts().date;
}

/** Parse YYYY-MM-DD into a local Date at midnight (for display only). */
export function parseDateOnly(d: string) {
  const [y, m, day] = d.split("-").map(Number);
  return new Date(y, m - 1, day);
}

export function toDateOnly(d: Date) {
  return format(d, "yyyy-MM-dd");
}

/** True if the given Mumbai-local date + HH:MM is in the future. */
export function isFutureIST(date: string, time: string) {
  const now = nowParts();
  const t = time.slice(0, 5);
  return date > now.date || (date === now.date && t > now.time);
}

export function formatActivityDate(date: string) {
  const d = parseDateOnly(date);
  const today = todayIST();
  if (date === today) return "Today";
  if (date === toDateOnly(addDays(parseDateOnly(today), 1))) return "Tomorrow";
  return format(d, "EEE, d MMM");
}

export function formatLongDate(date: string) {
  return format(parseDateOnly(date), "EEEE, d MMMM yyyy");
}

export function formatTime(time: string) {
  const [h, m] = time.split(":").map(Number);
  const d = new Date(2000, 0, 1, h, m);
  return format(d, "h:mm a");
}

/** Weekend range (Sat–Sun) relevant to today in Mumbai. */
export function weekendRangeIST() {
  const today = parseDateOnly(todayIST());
  const dow = today.getDay(); // 0 Sun .. 6 Sat
  if (dow === 0) return { from: toDateOnly(today), to: toDateOnly(today) };
  const sat = addDays(today, 6 - dow);
  return { from: toDateOnly(dow === 6 ? today : sat), to: toDateOnly(addDays(sat, 1)) };
}

export function formatRelative(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return format(new Date(ts), "d MMM yyyy");
}
