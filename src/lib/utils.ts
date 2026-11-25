import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function initials(name: string | null | undefined) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase() || "?";
}

/** First name + last initial, a privacy-friendly display name. */
export function shortName(name: string | null | undefined) {
  if (!name) return "Member";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

/** Only allow internal relative redirects (prevents open redirects). */
export function safeNext(next: string | null | undefined, fallback = "/discover") {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return fallback;
  return next;
}
