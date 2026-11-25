import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireOnboarded } from "@/lib/auth";
import { getActivity } from "@/lib/data/activities";
import { updateActivity } from "@/lib/actions/activities";
import { todayIST } from "@/lib/dates";
import { ActivityForm } from "@/components/activity/activity-form";

export const metadata: Metadata = { title: "Edit activity" };

export default async function EditActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user } = await requireOnboarded(`/activities/${id}/edit`);
  const activity = await getActivity(id);
  if (!activity) notFound();
  // Only the organiser may edit (also enforced by RLS on update).
  if (activity.organiser_id !== user.id || activity.status !== "active") redirect(`/activities/${id}`);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <Link href={`/activities/${id}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to activity
      </Link>
      <h1 className="mt-4 text-3xl font-extrabold">Edit activity</h1>
      <div className="mt-8 rounded-3xl border border-border bg-card p-5 shadow-soft sm:p-8">
        <ActivityForm
          action={updateActivity.bind(null, id)}
          userId={user.id}
          today={todayIST()}
          activity={activity}
          minParticipants={activity.confirmed_count}
        />
      </div>
    </div>
  );
}
