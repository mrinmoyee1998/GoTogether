import type { Metadata } from "next";
import Link from "next/link";
import { BellRing, CalendarCheck2, CalendarPlus, Crown, MapPin, Pencil, Plus, Send, Users, Compass, CalendarDays } from "lucide-react";
import { requireOnboarded } from "@/lib/auth";
import { getDashboardData } from "@/lib/data/dashboard";
import { getCategory } from "@/lib/constants";
import { formatActivityDate, formatTime, isFutureIST } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/empty-state";
import { RequestRow } from "@/components/activity/request-row";
import { MyRequestRow } from "@/components/activity/my-request-row";
import { ActivityCover } from "@/components/activity/activity-cover";
import { SpotsMeter } from "@/components/activity/spots-meter";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const { user, profile } = await requireOnboarded("/dashboard");
  const { hosted, mine } = await getDashboardData(user.id);

  const hostedWithPending = hosted
    .map((a) => ({ activity: a, pending: a.requests.filter((r) => r.status === "pending") }))
    .filter((x) => x.pending.length > 0);
  const pendingToReview = hostedWithPending.reduce((n, x) => n + x.pending.length, 0);

  const upcomingHosted = hosted.filter((a) => a.status === "active" && isFutureIST(a.activity_date, a.start_time));
  const pastHosted = hosted.filter((a) => !upcomingHosted.includes(a));

  const going = mine.filter((r) => r.status === "accepted" && r.activity);
  const goingUpcoming = going.filter((r) => r.activity!.status === "active" && isFutureIST(r.activity!.activity_date, r.activity!.start_time));
  const myRequests = mine.filter((r) => r.status !== "accepted");
  const myPending = myRequests.filter((r) => r.status === "pending").length;

  const defaultTab = tab && ["review", "hosting", "going", "requests"].includes(tab) ? tab : pendingToReview > 0 ? "review" : "hosting";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* My profile */}
        <Card className="p-5 lg:sticky lg:top-24 lg:w-80 lg:shrink-0">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">My profile</p>
          <div className="mt-3 flex items-center gap-3">
            <UserAvatar name={profile.full_name} src={profile.avatar_url} seed={profile.id} className="size-14 text-base" />
            <div className="min-w-0">
              <p className="truncate text-lg font-bold">{profile.full_name}</p>
              <p className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="size-3.5" /> {profile.neighbourhood}, {profile.city}</p>
            </div>
          </div>
          {profile.bio && <p className="mt-3 text-sm text-muted-foreground">{profile.bio}</p>}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {profile.interests.map((i) => {
              const c = getCategory(i);
              return <Badge key={i} variant="secondary"><c.icon /> {c.label}</Badge>;
            })}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-secondary p-2"><p className="text-lg font-extrabold">{upcomingHosted.length}</p><p className="text-[11px] text-muted-foreground">Hosting</p></div>
            <div className="rounded-xl bg-secondary p-2"><p className="text-lg font-extrabold">{goingUpcoming.length}</p><p className="text-[11px] text-muted-foreground">Going</p></div>
            <div className="rounded-xl bg-secondary p-2"><p className="text-lg font-extrabold">{myPending}</p><p className="text-[11px] text-muted-foreground">Pending</p></div>
          </div>
          <Button asChild variant="outline" size="sm" className="mt-4 w-full">
            <Link href="/profile"><Pencil /> Edit profile</Link>
          </Button>
        </Card>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-3xl font-extrabold">Hi, {profile.full_name.split(" ")[0]} 👋</h1>
              <p className="mt-1 text-muted-foreground">
                {pendingToReview > 0
                  ? `You have ${pendingToReview} join ${pendingToReview === 1 ? "request" : "requests"} to review.`
                  : "Here's everything you're hosting and joining."}
              </p>
            </div>
            <Button asChild className="hidden sm:inline-flex"><Link href="/activities/new"><Plus /> New activity</Link></Button>
          </div>

          <Tabs defaultValue={defaultTab} className="mt-6">
            <TabsList>
              <TabsTrigger value="review">
                <BellRing className="size-4" /> To review
                {pendingToReview > 0 && <span className="rounded-full bg-primary px-1.5 text-[11px] text-white">{pendingToReview}</span>}
              </TabsTrigger>
              <TabsTrigger value="hosting"><Crown className="size-4" /> I created</TabsTrigger>
              <TabsTrigger value="going"><CalendarCheck2 className="size-4" /> I&apos;ve joined</TabsTrigger>
              <TabsTrigger value="requests"><Send className="size-4" /> My requests</TabsTrigger>
            </TabsList>

            {/* Pending join requests for my activities */}
            <TabsContent value="review">
              <h2 className="sr-only">Pending join requests</h2>
              {hostedWithPending.length === 0 ? (
                <EmptyState icon={BellRing} title="No requests to review" description="When someone asks to join one of your activities, it will show up here for you to accept or decline." />
              ) : (
                <div className="space-y-8">
                  {hostedWithPending.map(({ activity, pending }) => {
                    const full = activity.confirmed_count >= activity.max_participants;
                    return (
                      <section key={activity.id}>
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                          <Link href={`/activities/${activity.id}`} className="font-bold hover:text-primary">{activity.title}</Link>
                          <span className="text-sm text-muted-foreground">
                            {formatActivityDate(activity.activity_date)} · {activity.confirmed_count}/{activity.max_participants} confirmed
                            {full && <Badge className="ml-2 bg-navy text-white">Full</Badge>}
                          </span>
                        </div>
                        <ul className="space-y-3">
                          {pending.map((r) => (
                            <RequestRow key={r.id} request={r} isFull={full} closed={activity.status !== "active"} />
                          ))}
                        </ul>
                      </section>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Activities I created */}
            <TabsContent value="hosting">
              <h2 className="sr-only">Activities I created</h2>
              {hosted.length === 0 ? (
                <EmptyState icon={CalendarPlus} title="You haven't created any activities yet" description="Post a plan — badminton, a trek, a cafe crawl — and let people with the same interests join you.">
                  <Button asChild><Link href="/activities/new"><Plus /> Create your first plan</Link></Button>
                </EmptyState>
              ) : (
                <div className="space-y-6">
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {upcomingHosted.map((a) => {
                      const pendingCount = a.requests.filter((r) => r.status === "pending").length;
                      return (
                        <li key={a.id}>
                          <Link href={`/activities/${a.id}`} className="flex gap-3 rounded-2xl border border-border bg-card p-3 shadow-soft transition-shadow hover:shadow-lift">
                            <ActivityCover category={a.category} src={a.cover_image_url} title={a.title} className="size-20 shrink-0 rounded-xl" iconClassName="size-8 right-2 bottom-2" />
                            <div className="min-w-0 flex-1 space-y-1">
                              <p className="truncate font-bold">{a.title}</p>
                              <p className="flex items-center gap-1 text-xs text-muted-foreground"><CalendarDays className="size-3.5" /> {formatActivityDate(a.activity_date)}, {formatTime(a.start_time)}</p>
                              <div className="flex items-center gap-2 text-xs">
                                <span className="flex items-center gap-1 font-semibold"><Users className="size-3.5" /> {a.confirmed_count}/{a.max_participants}</span>
                                {pendingCount > 0 && <Badge variant="warning">{pendingCount} pending</Badge>}
                              </div>
                              <SpotsMeter confirmed={a.confirmed_count} max={a.max_participants} />
                            </div>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                  {upcomingHosted.length === 0 && <p className="text-sm text-muted-foreground">No upcoming activities. <Link className="font-semibold text-primary underline" href="/activities/new">Create one</Link>.</p>}
                  {pastHosted.length > 0 && (
                    <div>
                      <h3 className="mb-2 text-sm font-bold text-muted-foreground">Past &amp; cancelled</h3>
                      <ul className="space-y-2">
                        {pastHosted.map((a) => (
                          <li key={a.id}>
                            <Link href={`/activities/${a.id}`} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm hover:bg-secondary">
                              <span className="truncate font-semibold">{a.title}</span>
                              <span className="shrink-0 text-xs text-muted-foreground">
                                {a.status === "cancelled" ? "Cancelled" : formatActivityDate(a.activity_date)}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Activities I've joined */}
            <TabsContent value="going">
              <h2 className="sr-only">Activities I&apos;ve joined</h2>
              {going.length === 0 ? (
                <EmptyState icon={Compass} title="No confirmed plans yet" description="Once an organiser accepts your request, the activity will show up here.">
                  <Button asChild><Link href="/discover">Discover activities</Link></Button>
                </EmptyState>
              ) : (
                <ul className="space-y-3">
                  {going.map((r) => <MyRequestRow key={r.id} request={r} />)}
                </ul>
              )}
            </TabsContent>

            {/* My activity requests */}
            <TabsContent value="requests">
              <h2 className="sr-only">My activity requests</h2>
              {myRequests.length === 0 ? (
                <EmptyState icon={Send} title="No requests yet" description="Find something you'd like to do and send a request to join.">
                  <Button asChild><Link href="/discover">Find an activity</Link></Button>
                </EmptyState>
              ) : (
                <ul className="space-y-3">
                  {myRequests.map((r) => <MyRequestRow key={r.id} request={r} />)}
                </ul>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
