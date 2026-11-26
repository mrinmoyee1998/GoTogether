import { z } from "zod";
import { CATEGORY_VALUES, NEIGHBOURHOODS, CITIES } from "./constants";
import { isFutureIST } from "./dates";

const trimmed = (min: number, max: number, label: string) =>
  z
    .string({ required_error: `${label} is required` })
    .trim()
    .min(min, min <= 1 ? `${label} is required` : `${label} must be at least ${min} characters`)
    .max(max, `${label} must be at most ${max} characters`);

export const signupSchema = z.object({
  fullName: trimmed(2, 80, "Full name"),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").max(72, "Password is too long"),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters").max(72, "Password is too long"),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { message: "Passwords don't match", path: ["confirm"] });

export const profileSchema = z.object({
  full_name: trimmed(2, 80, "Full name"),
  age_confirmed: z.literal(true, {
    errorMap: () => ({ message: "You must be 18 or older to use GoTogether" }),
  }),
  city: z.enum(CITIES, { errorMap: () => ({ message: "GoTogether is currently available in Mumbai only" }) }),
  neighbourhood: z.enum(NEIGHBOURHOODS, { errorMap: () => ({ message: "Choose your neighbourhood" }) }),
  bio: z.string().trim().max(300, "Bio must be at most 300 characters").optional().transform((v) => v || null),
  interests: z.array(z.enum(CATEGORY_VALUES)).min(1, "Pick at least one interest").max(11),
  avatar_url: z.string().url().max(500).nullable().optional(),
});
export type ProfileInput = z.input<typeof profileSchema>;

export const activitySchema = z
  .object({
    title: trimmed(4, 80, "Title"),
    category: z.enum(CATEGORY_VALUES, { errorMap: () => ({ message: "Choose a category" }) }),
    description: trimmed(20, 2000, "Description"),
    activity_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date"),
    start_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Choose a start time"),
    venue_name: trimmed(2, 120, "Venue name"),
    neighbourhood: z.enum(NEIGHBOURHOODS, { errorMap: () => ({ message: "Choose a neighbourhood" }) }),
    max_participants: z.coerce
      .number({ invalid_type_error: "Enter a number" })
      .int("Must be a whole number")
      .min(1, "At least 1 person must be able to join")
      .max(50, "Maximum group size is 50"),
    maps_url: z
      .string()
      .trim()
      .max(500)
      .optional()
      .transform((v) => v || null)
      .refine((v) => v === null || /^https:\/\/\S+$/i.test(v), "Enter a valid https:// link"),
    estimated_cost: z
      .union([z.literal(""), z.coerce.number().int("Whole rupees only").min(0, "Cost can't be negative").max(100000, "That seems too high")])
      .optional()
      .transform((v) => (v === "" || v === undefined ? null : v)),
    cover_image_url: z.string().url().max(500).nullable().optional(),
  })
  .refine((v) => isFutureIST(v.activity_date, v.start_time), {
    message: "Activity must be scheduled in the future",
    path: ["start_time"],
  });
export type ActivityInput = z.input<typeof activitySchema>;

export const joinMessageSchema = z.string().trim().max(280, "Keep your note under 280 characters").optional();

export const reportSchema = z.object({
  reason: z.enum(["unsafe", "spam", "inappropriate", "misleading", "other"]),
  details: z.string().trim().max(1000).optional().transform((v) => v || null),
});

export type FieldErrors = Partial<Record<string, string>>;

export function flattenErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export type ActionResult<T = undefined> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string; fieldErrors?: FieldErrors };
