import {
  Trophy, Dumbbell, Coffee, Mountain, Music, Palette, GraduationCap, Gamepad2, Dices, Plane, Users,
  type LucideIcon,
} from "lucide-react";

export const CATEGORIES = [
  { value: "sports", label: "Sports", icon: Trophy, tone: "bg-[#FFE4DC] text-[#C2410C]" },
  { value: "fitness", label: "Fitness", icon: Dumbbell, tone: "bg-[#FDE2E4] text-[#BE123C]" },
  { value: "food", label: "Food & Cafes", icon: Coffee, tone: "bg-[#FDF0D5] text-[#B45309]" },
  { value: "outdoors", label: "Trekking & Outdoors", icon: Mountain, tone: "bg-[#DCF2E6] text-[#047857]" },
  { value: "music", label: "Music", icon: Music, tone: "bg-[#EDE4FF] text-[#6D28D9]" },
  { value: "art", label: "Art & Creativity", icon: Palette, tone: "bg-[#FCE4F3] text-[#BE185D]" },
  { value: "workshops", label: "Workshops", icon: GraduationCap, tone: "bg-[#DFEBFF] text-[#1D4ED8]" },
  { value: "gaming", label: "Gaming", icon: Gamepad2, tone: "bg-[#E2E8FF] text-[#4338CA]" },
  { value: "board_games", label: "Board Games", icon: Dices, tone: "bg-[#FFF1D6] text-[#A16207]" },
  { value: "travel", label: "Travel", icon: Plane, tone: "bg-[#D9F3F7] text-[#0E7490]" },
  { value: "social", label: "Social Meetups", icon: Users, tone: "bg-[#FFE7D6] text-[#C2410C]" },
] as const satisfies readonly { value: string; label: string; icon: LucideIcon; tone: string }[];

export type Category = (typeof CATEGORIES)[number]["value"];
export const CATEGORY_VALUES = CATEGORIES.map((c) => c.value) as [Category, ...Category[]];

export function getCategory(value: string) {
  return CATEGORIES.find((c) => c.value === value) ?? CATEGORIES[CATEGORIES.length - 1];
}

/** Mumbai neighbourhoods offered in forms and filters. */
export const NEIGHBOURHOODS = [
  "Andheri", "Bandra", "Borivali", "Chembur", "Colaba", "Churchgate", "Dadar", "Fort",
  "Ghatkopar", "Goregaon", "Juhu", "Khar", "Kurla", "Lower Parel", "Mahalaxmi", "Malad",
  "Marine Drive", "Mulund", "Navi Mumbai", "Powai", "Sanjay Gandhi National Park", "Santacruz",
  "Thane", "Versova", "Vile Parle", "Worli",
] as const;

export const CITIES = ["Mumbai"] as const;

export const REPORT_REASONS = [
  { value: "unsafe", label: "Feels unsafe" },
  { value: "spam", label: "Spam or advertising" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "misleading", label: "Misleading details" },
  { value: "other", label: "Something else" },
] as const;

export const APP_TIMEZONE = "Asia/Kolkata";
