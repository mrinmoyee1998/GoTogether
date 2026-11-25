"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, ShieldCheck } from "lucide-react";
import { saveProfile } from "@/lib/actions/profile";
import { CATEGORIES, NEIGHBOURHOODS } from "@/lib/constants";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { Field, FormAlert, SubmitButton, useFormAction } from "@/components/forms";
import { ImageUpload } from "@/components/image-upload";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types/database";

export function ProfileForm({ profile, mode, next }: { profile: Profile; mode: "onboarding" | "edit"; next?: string }) {
  const [state, onSubmit, pending, formAction] = useFormAction(saveProfile);
  const [interests, setInterests] = useState<string[]>(profile.interests ?? []);
  const [bio, setBio] = useState(profile.bio ?? "");
  const fe = state && !state.ok ? state.fieldErrors ?? {} : {};

  useEffect(() => {
    if (state?.ok && state.message) toast.success(state.message);
  }, [state]);

  const toggle = (v: string) => setInterests((cur) => (cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]));

  return (
    <form action={formAction} onSubmit={onSubmit} className="space-y-6" noValidate>
      <FormAlert message={state && !state.ok ? state.error : null} />
      <input type="hidden" name="next" value={next ?? ""} />

      <Field label="Profile photo" htmlFor="avatar_url-file" optional hint="A friendly face helps organisers say yes. JPG/PNG up to 2 MB.">
        <ImageUpload bucket="avatars" userId={profile.id} name="avatar_url" defaultUrl={profile.avatar_url} variant="avatar" label="Upload profile photo" />
      </Field>

      <Field label="Full name" htmlFor="full_name" error={fe.full_name} hint="Other members see your first name and last initial on public pages.">
        <Input id="full_name" name="full_name" defaultValue={profile.full_name} autoComplete="name" aria-invalid={!!fe.full_name} required />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="City" htmlFor="city" error={fe.city} hint="More cities coming soon.">
          <NativeSelect id="city" name="city" defaultValue="Mumbai">
            <option value="Mumbai">Mumbai</option>
          </NativeSelect>
        </Field>
        <Field label="Area / neighbourhood" htmlFor="neighbourhood" error={fe.neighbourhood}>
          <NativeSelect id="neighbourhood" name="neighbourhood" defaultValue={profile.neighbourhood ?? ""} aria-invalid={!!fe.neighbourhood} required>
            <option value="" disabled>Choose your area</option>
            {NEIGHBOURHOODS.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </NativeSelect>
        </Field>
      </div>

      <Field label="Short bio" htmlFor="bio" optional error={fe.bio} hint={`${bio.length}/300 · Don't include phone numbers or social handles.`}>
        <Textarea id="bio" name="bio" maxLength={300} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="New to Mumbai, love weekend treks and trying new cafes." />
      </Field>

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold">Interests</legend>
        <p className="text-xs text-muted-foreground">Pick as many as you like.</p>
        <div className="flex flex-wrap gap-2 pt-1">
          {CATEGORIES.map((c) => {
            const on = interests.includes(c.value);
            return (
              <label
                key={c.value}
                className={cn(
                  "inline-flex cursor-pointer select-none items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary/50",
                  on ? "border-primary bg-accent text-primary" : "border-border bg-card hover:bg-secondary",
                )}
              >
                <input type="checkbox" name="interests" value={c.value} checked={on} onChange={() => toggle(c.value)} className="sr-only" />
                {on ? <Check className="size-4" /> : <c.icon className="size-4" />}
                {c.label}
              </label>
            );
          })}
        </div>
        {fe.interests && <p className="text-sm font-medium text-destructive">{fe.interests}</p>}
      </fieldset>

      <div className={cn("rounded-2xl border p-4", fe.age_confirmed ? "border-destructive bg-[#FDE4E1]/50" : "border-border bg-secondary/60")}>
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            name="age_confirmed"
            defaultChecked={profile.age_confirmed}
            className="mt-0.5 size-5 shrink-0 cursor-pointer accent-[#F0553F]"
            aria-invalid={!!fe.age_confirmed}
          />
          <span className="text-sm">
            <span className="flex items-center gap-1.5 font-semibold">
              <ShieldCheck className="size-4 text-primary" /> I confirm I am 18 years of age or older.
            </span>
            <span className="text-muted-foreground">GoTogether is only for adults. I agree to follow the community guidelines.</span>
          </span>
        </label>
        {fe.age_confirmed && <p className="mt-2 text-sm font-medium text-destructive">{fe.age_confirmed}</p>}
      </div>

      <SubmitButton pending={pending} size="lg" className="w-full sm:w-auto" pendingText="Saving…">
        {mode === "onboarding" ? "Finish setting up" : "Save changes"}
      </SubmitButton>
    </form>
  );
}
