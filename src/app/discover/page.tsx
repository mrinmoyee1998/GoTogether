import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CalendarX2, Plus, PartyPopper } from "lucide-react";
import { listUpcomingActivities, type DiscoverFilters as Filters } from "@/lib/data/activities";
import { getAuth } from "@/lib/auth";
import { ActivityCard } from "@/components/activity/activity-card";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { DiscoverFilters } from "./filters";
import { FlashToast } from "@/components/flash-toast";

export const metadata: Metadata = { title: "Discover activities" };

type SP = Promise<Filters & { welcome?: string }>;

export default async function DiscoverPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const filters: Filters = { q: sp.q, category: sp.category, area: sp.area, when: sp.when };
  const [{ user, profile }, activities] = await Promise.all([getAuth(), listUpcomingActivities(filters)]);
  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      {sp.welcome && profile?.onboarding_completed && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl bg-accent p-4 text-sm">
          <PartyPopper className="size-5 shrink-0 text-primary" />
          <p>
            <span className="font-bold">You&apos;re all set, {profile.full_name.split(" ")[0]}!</span> Find a plan to join below, or{" "}
            <Link href="/activities/new" className="font-semibold text-primary underline">create your own</Link>.
          </p>
        </div>
      )}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-extrabold sm:text-4xl">Discover</h1>
          <p className="mt-1 text-muted-foreground">Upcoming plans around Mumbai. Find one and ask to join.</p>
        </div>
        <Button asChild className="hidden sm:inline-flex">
          <Link href="/activities/new"><Plus /> Create activity</Link>
        </Button>
      </div>

      <Suspense>
        <FlashToast messages={{ password: "Your password has been updated. You're logged in." }} />
      </Suspense>
      <div className="mt-6">
        <Suspense>
          <DiscoverFilters />
        </Suspense>
      </div>

      <p className="mt-6 text-sm text-muted-foreground" aria-live="polite">
        {activities.length} {activities.length === 1 ? "activity" : "activities"} {hasFilters ? "match your filters" : "coming up"}
      </p>

      {activities.length > 0 ? (
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {activities.map((a) => (
            <ActivityCard key={a.id} activity={a} isMine={a.organiser_id === user?.id} />
          ))}
        </div>
      ) : (
        <EmptyState
          className="mt-4"
          icon={CalendarX2}
          title={hasFilters ? "No activities match these filters" : "No upcoming activities yet"}
          description={
            hasFilters
              ? "Try a different date or neighbourhood — or start the plan yourself and let others join you."
              : "Be the first to post a plan. Others can request to join and you approve who comes."
          }
        >
          {hasFilters && (
            <Button asChild variant="outline"><Link href="/discover">Clear filters</Link></Button>
          )}
          <Button asChild><Link href="/activities/new"><Plus /> Create a plan</Link></Button>
        </EmptyState>
      )}
    </div>
  );
}
