import type { Metadata } from "next";
import { requireOnboarded } from "@/lib/auth";
import { createActivity } from "@/lib/actions/activities";
import { todayIST } from "@/lib/dates";
import { ActivityForm } from "@/components/activity/activity-form";

export const metadata: Metadata = { title: "Create an activity" };

export default async function NewActivityPage() {
  const { user } = await requireOnboarded("/activities/new");
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="text-3xl font-extrabold">Create a plan</h1>
      <p className="mt-2 text-muted-foreground">Tell people what you&apos;re up to. They&apos;ll request to join and you choose who comes.</p>
      <div className="mt-8 rounded-3xl border border-border bg-card p-5 shadow-soft sm:p-8">
        <ActivityForm action={createActivity} userId={user.id} today={todayIST()} />
      </div>
    </div>
  );
}
