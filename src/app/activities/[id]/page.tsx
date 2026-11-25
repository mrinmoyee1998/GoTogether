import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { format } from "date-fns";
import {
  ArrowLeft, CalendarDays, Clock, MapPin, Navigation, IndianRupee, Users, ShieldAlert, Inbox, UserRound,
} from "lucide-react";
import { getAuth } from "@/lib/auth";
import {
  getActivity, getConfirmedParticipants, getMyRequest, getOrganiserProfile, getRequestsForActivity,
} from "@/lib/data/activities";
import { getCategory } from "@/lib/constants";
import { formatLongDate, formatTime, isFutureIST } from "@/lib/dates";
import { shortName } from "@/lib/utils";
import { ActivityCover } from "@/components/activity/activity-cover";
import { JoinPanel, type JoinState } from "@/components/activity/join-panel";
import { RequestRow } from "@/components/activity/request-row";
import { ReportDialog } from "@/components/activity/report-dialog";
import { OrganiserActions } from "@/components/activity/organiser-actions";
import { SpotsMeter } from "@/components/activity/spots-meter";
import { FlashToast } from "@/components/flash-toast";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const activity = await getActivity(id).catch(() => null);
  return { title: activity?.title ?? "Activity" };
}

export default async function ActivityPage({ params }: { params: Params }) {
  const { id } = await params;
  const activity = await getActivity(id);
  if (!activity) notFound();

  const { user, profile } = await getAuth();
  const isOrganiser = user?.id === activity.organiser_id;

  const [organiser, participants, myRequest, requests] = await Promise.all([
    getOrganiserProfile(activity.organiser_id),
    getConfirmedParticipants(activity.id),
    getMyRequest(activity.id),
    isOrganiser ? getRequestsForActivity(activity.id) : Promise.resolve([]),
  ]);

  const cat = getCategory(activity.category);
  const isFull = activity.confirmed_count >= activity.max_participants;
  const upcoming = isFutureIST(activity.activity_date, activity.start_time);
  const cancelled = activity.status === "cancelled";

  let state: JoinState;
  if (!user) state = { kind: "guest" };
  else if (isOrganiser) state = { kind: "organiser" };
  else if (myRequest?.status === "accepted") state = { kind: "accepted", requestId: myRequest.id };
  else if (cancelled) state = { kind: "cancelled" };
  else if (myRequest?.status === "pending") state = { kind: "pending", requestId: myRequest.id };
  else if (myRequest?.status === "declined") state = { kind: "declined" };
  else if (!upcoming) state = { kind: "past" };
  else if (isFull) state = { kind: "full" };
  else if (!profile?.onboarding_completed) state = { kind: "needs-profile" };
  else state = { kind: "can-join" };

  const pendingRequests = requests.filter((r) => r.status === "pending");

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <Suspense>
        <FlashToast messages={{ created: "Your activity is live! Share it and wait for requests.", updated: "Activity updated." }} />
      </Suspense>
      <Link href="/discover" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to Discover
      </Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Main column */}
        <div className="min-w-0 space-y-8">
          <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
            <ActivityCover category={activity.category} src={activity.cover_image_url} title={activity.title} className="h-48 sm:h-64" iconClassName="size-24 right-8 bottom-6" />
            <div className="space-y-4 p-5 sm:p-7">
              <div className="flex flex-wrap gap-2">
                <Badge><cat.icon /> {cat.label}</Badge>
                {cancelled && <Badge variant="destructive">Cancelled</Badge>}
                {!cancelled && isFull && <Badge className="bg-navy text-white">Full</Badge>}
                {!cancelled && !upcoming && <Badge variant="muted">Past</Badge>}
              </div>
              <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">{activity.title}</h1>

              <ul className="grid gap-3 text-sm sm:grid-cols-2">
                <li className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary"><CalendarDays className="size-5" /></span>
                  <span>
                    <span className="block font-bold">{formatLongDate(activity.activity_date)}</span>
                    <span className="flex items-center gap-1 text-muted-foreground"><Clock className="size-3.5" /> Starts {formatTime(activity.start_time)} (IST)</span>
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary"><MapPin className="size-5" /></span>
                  <span>
                    <span className="block font-bold">{activity.venue_name}</span>
                    <span className="text-muted-foreground">{activity.neighbourhood}, Mumbai</span>
                    {activity.maps_url && (
                      <a href={activity.maps_url} target="_blank" rel="noopener noreferrer nofollow" className="mt-0.5 flex items-center gap-1 font-semibold text-primary hover:underline">
                        <Navigation className="size-3.5" /> Open in Google Maps
                      </a>
                    )}
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary"><Users className="size-5" /></span>
                  <span>
                    <span className="block font-bold">{activity.confirmed_count} of {activity.max_participants} spots filled</span>
                    <span className="text-muted-foreground">Group size: up to {activity.max_participants} + organiser</span>
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary"><IndianRupee className="size-5" /></span>
                  <span>
                    <span className="block font-bold">
                      {activity.estimated_cost == null ? "Cost not specified" : activity.estimated_cost === 0 ? "Free" : `~₹${activity.estimated_cost.toLocaleString("en-IN")} per person`}
                    </span>
                    <span className="text-muted-foreground">Paid directly — GoTogether takes no payments</span>
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <section>
            <h2 className="text-xl font-bold">About this plan</h2>
            <p className="mt-3 whitespace-pre-line leading-relaxed text-foreground/90">{activity.description}</p>
          </section>

          {/* Organiser: manage requests */}
          {isOrganiser && (
            <section id="requests" className="scroll-mt-24">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Join requests</h2>
                <Badge variant={pendingRequests.length ? "warning" : "muted"}>{pendingRequests.length} pending</Badge>
              </div>
              {isFull && pendingRequests.length > 0 && (
                <p className="mt-2 text-sm text-muted-foreground">The activity is full. Increase the group size or remove someone to accept more people.</p>
              )}
              {pendingRequests.length > 0 ? (
                <ul className="mt-4 space-y-3">
                  {pendingRequests.map((r) => (
                    <RequestRow key={r.id} request={r} isFull={isFull} closed={cancelled} />
                  ))}
                </ul>
              ) : (
                <div className="mt-4 flex items-center gap-3 rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
                  <Inbox className="size-5" /> No pending requests right now.
                </div>
              )}
            </section>
          )}

          {/* Participants */}
          <section>
            <h2 className="text-xl font-bold">Who&apos;s going</h2>
            {!user ? (
              <p className="mt-3 rounded-2xl bg-secondary p-4 text-sm text-muted-foreground">
                <Link href={`/login?next=/activities/${activity.id}`} className="font-semibold text-primary underline">Log in</Link> to see who&apos;s going. Participant lists are only visible to members.
              </p>
            ) : participants.length === 0 ? (
              <p className="mt-3 rounded-2xl bg-secondary p-4 text-sm text-muted-foreground">No confirmed participants yet — be one of the first!</p>
            ) : isOrganiser ? (
              <ul className="mt-4 space-y-3">
                {requests.filter((r) => r.status === "accepted").map((r) => (
                  <RequestRow key={r.id} request={r} isFull={isFull} />
                ))}
              </ul>
            ) : (
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {participants.map((p) => (
                  <li key={p.request_id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
                    <UserAvatar name={p.profile?.full_name} src={p.profile?.avatar_url} seed={p.profile?.id} />
                    <div className="min-w-0">
                      <p className="truncate font-semibold">
                        {shortName(p.profile?.full_name)} {p.profile?.id === user.id && <span className="text-primary">(you)</span>}
                      </p>
                      {p.profile?.neighbourhood && <p className="text-xs text-muted-foreground">{p.profile.neighbourhood}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <Card className="p-5">
            <SpotsMeter confirmed={activity.confirmed_count} max={activity.max_participants} className="mb-4" />
            <JoinPanel activityId={activity.id} title={activity.title} state={state} />
            {isOrganiser && (
              <div className="mt-4 space-y-3 border-t border-border pt-4">
                {pendingRequests.length > 0 && (
                  <a href="#requests" className="block text-sm font-semibold text-primary hover:underline">
                    Review {pendingRequests.length} pending {pendingRequests.length === 1 ? "request" : "requests"} ↓
                  </a>
                )}
                <OrganiserActions activityId={activity.id} cancelled={cancelled} />
              </div>
            )}
          </Card>

          <Card className="p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Organised by</p>
            <div className="mt-3 flex items-center gap-3">
              <UserAvatar name={activity.organiser?.full_name} src={activity.organiser?.avatar_url} seed={activity.organiser_id} className="size-12" />
              <div className="min-w-0">
                <p className="truncate font-bold">
                  {organiser ? organiser.full_name : shortName(activity.organiser?.full_name)}
                  {isOrganiser && <span className="text-primary"> (you)</span>}
                </p>
                {organiser && (
                  <p className="text-xs text-muted-foreground">
                    {organiser.neighbourhood ? `${organiser.neighbourhood} · ` : ""}Member since {format(new Date(organiser.created_at), "MMM yyyy")}
                  </p>
                )}
              </div>
            </div>
            {organiser ? (
              <>
                {organiser.bio && <p className="mt-3 text-sm text-muted-foreground">{organiser.bio}</p>}
                {organiser.interests.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {organiser.interests.slice(0, 5).map((i) => {
                      const c = getCategory(i);
                      return <Badge key={i} variant="secondary"><c.icon /> {c.label}</Badge>;
                    })}
                  </div>
                )}
                <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <UserRound className="size-3.5" /> Has organised {organiser.hostedCount} {organiser.hostedCount === 1 ? "activity" : "activities"} on GoTogether
                </p>
              </>
            ) : (
              <p className="mt-3 text-xs text-muted-foreground">Log in to see the organiser&apos;s full profile.</p>
            )}
          </Card>

          <div className="rounded-2xl border border-[#F5D9A8] bg-[#FFF8EA] p-4 text-sm">
            <p className="flex items-center gap-2 font-bold text-warning"><ShieldAlert className="size-4" /> Stay safe</p>
            <p className="mt-1 text-foreground/80">
              Meet in public places, tell a friend where you&apos;re going, and use your own judgement. GoTogether does not verify identities.{" "}
              <Link href="/guidelines#safety" className="font-semibold underline">Safety tips</Link>
            </p>
          </div>

          {user && !isOrganiser && (
            <div className="text-center">
              <ReportDialog activityId={activity.id} />
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
