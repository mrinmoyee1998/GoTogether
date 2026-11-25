"use client";

import { useState } from "react";
import { CATEGORIES, NEIGHBOURHOODS } from "@/lib/constants";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { Field, FormAlert, SubmitButton, useFormAction } from "@/components/forms";
import { ImageUpload } from "@/components/image-upload";
import { cn } from "@/lib/utils";
import type { ActionResult } from "@/lib/validation";
import type { Activity } from "@/types/database";

type Props = {
  action: (prev: ActionResult | null, fd: FormData) => Promise<ActionResult>;
  userId: string;
  today: string;
  activity?: Activity;
  minParticipants?: number;
};

export function ActivityForm({ action, userId, today, activity, minParticipants = 1 }: Props) {
  const [state, onSubmit, pending, formAction] = useFormAction(action);
  const [category, setCategory] = useState(activity?.category ?? "");
  const [desc, setDesc] = useState(activity?.description ?? "");
  const fe = state && !state.ok ? state.fieldErrors ?? {} : {};
  const editing = !!activity;

  return (
    <form action={formAction} onSubmit={onSubmit} className="space-y-8" noValidate>
      <FormAlert message={state && !state.ok ? state.error : null} />

      <section className="space-y-5">
        <h2 className="text-lg font-bold">The basics</h2>
        <Field label="Activity title" htmlFor="title" error={fe.title} hint="Keep it short and specific, e.g. “Sunday Morning Badminton”.">
          <Input id="title" name="title" maxLength={80} defaultValue={activity?.title} aria-invalid={!!fe.title} placeholder="Sunday Morning Badminton" required />
        </Field>

        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold">Category</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {CATEGORIES.map((c) => (
              <label
                key={c.value}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary/50",
                  category === c.value ? "border-primary bg-accent text-primary" : "border-border bg-card hover:bg-secondary",
                )}
              >
                <input type="radio" name="category" value={c.value} checked={category === c.value} onChange={() => setCategory(c.value)} className="sr-only" />
                <c.icon className="size-4 shrink-0" /> <span className="truncate">{c.label}</span>
              </label>
            ))}
          </div>
          {fe.category && <p className="text-sm font-medium text-destructive">{fe.category}</p>}
        </fieldset>

        <Field label="Description" htmlFor="description" error={fe.description} hint={`${desc.length}/2000 · What will you do, who is it for, what should people bring?`}>
          <Textarea
            id="description"
            name="description"
            rows={6}
            maxLength={2000}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            aria-invalid={!!fe.description}
            placeholder="Casual doubles for all levels. We've booked a court for 2 hours and rotate partners so everyone plays…"
            required
          />
        </Field>
      </section>

      <section className="space-y-5">
        <h2 className="text-lg font-bold">When &amp; where</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Date" htmlFor="activity_date" error={fe.activity_date}>
            <Input id="activity_date" name="activity_date" type="date" min={today} defaultValue={activity?.activity_date} aria-invalid={!!fe.activity_date} required />
          </Field>
          <Field label="Start time (IST)" htmlFor="start_time" error={fe.start_time}>
            <Input id="start_time" name="start_time" type="time" defaultValue={activity?.start_time?.slice(0, 5)} aria-invalid={!!fe.start_time} required />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Venue name" htmlFor="venue_name" error={fe.venue_name} hint="Pick a public place.">
            <Input id="venue_name" name="venue_name" maxLength={120} defaultValue={activity?.venue_name} aria-invalid={!!fe.venue_name} placeholder="Bandra Gymkhana Courts" required />
          </Field>
          <Field label="Neighbourhood" htmlFor="neighbourhood" error={fe.neighbourhood}>
            <NativeSelect id="neighbourhood" name="neighbourhood" defaultValue={activity?.neighbourhood ?? ""} aria-invalid={!!fe.neighbourhood} required>
              <option value="" disabled>Choose an area</option>
              {NEIGHBOURHOODS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </NativeSelect>
          </Field>
        </div>
        <Field label="Google Maps link" htmlFor="maps_url" optional error={fe.maps_url}>
          <Input id="maps_url" name="maps_url" type="url" inputMode="url" defaultValue={activity?.maps_url ?? ""} aria-invalid={!!fe.maps_url} placeholder="https://maps.app.goo.gl/…" />
        </Field>
      </section>

      <section className="space-y-5">
        <h2 className="text-lg font-bold">Group &amp; cost</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Maximum group size"
            htmlFor="max_participants"
            error={fe.max_participants}
            hint={editing && minParticipants > 1 ? `People who can join you (not counting you). At least ${minParticipants} — already confirmed.` : "People who can join you (not counting you). 1–50."}
          >
            <Input id="max_participants" name="max_participants" type="number" inputMode="numeric" min={Math.max(1, minParticipants)} max={50} defaultValue={activity?.max_participants ?? 5} aria-invalid={!!fe.max_participants} required />
          </Field>
          <Field label="Estimated cost per person (₹)" htmlFor="estimated_cost" optional error={fe.estimated_cost} hint="Use 0 for free. Paid directly, not via GoTogether.">
            <Input id="estimated_cost" name="estimated_cost" type="number" inputMode="numeric" min={0} max={100000} defaultValue={activity?.estimated_cost ?? ""} aria-invalid={!!fe.estimated_cost} placeholder="250" />
          </Field>
        </div>
        <Field label="Cover image" htmlFor="cover_image_url-file" optional hint="JPG/PNG/WebP up to 5 MB. Without one we'll show a category illustration.">
          <ImageUpload bucket="activity-covers" userId={userId} name="cover_image_url" defaultUrl={activity?.cover_image_url} label="Upload cover image" />
        </Field>
      </section>

      <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">You&apos;ll approve every person who asks to join.</p>
        <SubmitButton pending={pending} size="lg" pendingText={editing ? "Saving…" : "Publishing…"}>
          {editing ? "Save changes" : "Publish activity"}
        </SubmitButton>
      </div>
    </form>
  );
}
