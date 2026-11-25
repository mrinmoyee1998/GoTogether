import Link from "next/link";
import {
  ArrowRight, Search, Send, PartyPopper, ShieldCheck, UserCheck, MapPinned, Flag, EyeOff, Sparkles, CalendarDays, MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CATEGORIES } from "@/lib/constants";
import { listUpcomingActivities } from "@/lib/data/activities";
import { ActivityCard } from "@/components/activity/activity-card";
import { ActivityCover } from "@/components/activity/activity-cover";
import { getAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

function HeroCard({
  category, title, meta, going, className,
}: { category: string; title: string; meta: string; going: string; className?: string }) {
  return (
    <div className={`w-56 overflow-hidden rounded-2xl border border-border bg-card shadow-lift ${className}`}>
      <ActivityCover category={category} title={title} className="h-24" iconClassName="size-12 right-4 bottom-3" />
      <div className="space-y-1.5 p-3.5">
        <p className="text-sm font-bold leading-snug">{title}</p>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="size-3.5" /> {meta}
        </p>
        <p className="text-xs font-semibold text-primary">{going}</p>
      </div>
    </div>
  );
}

export default async function LandingPage() {
  const [{ user }, activities] = await Promise.all([
    getAuth(),
    listUpcomingActivities({}, 6).catch(() => []),
  ]);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-10 pb-16 sm:px-6 md:grid-cols-[1.1fr_1fr] md:pt-20 md:pb-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1.5 text-xs font-bold text-primary">
              <Sparkles className="size-3.5" /> Now starting in Mumbai
            </span>
            <h1 className="mt-5 text-[2.6rem] font-extrabold leading-[1.05] sm:text-6xl">
              Your next plan starts with <span className="text-primary">your people.</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-muted-foreground">
              Discover activities, meet people with similar interests, and make your weekends more interesting.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/discover">
                  Explore Activities <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href={user ? "/activities/new" : "/signup?next=/activities/new"}>Create a Plan</Link>
              </Button>
            </div>
            <p className="mt-5 text-sm text-muted-foreground">
              Badminton partners, weekend treks, pottery classes, board-game nights — find someone to go with.
            </p>
          </div>

          <div className="relative mx-auto hidden h-[420px] w-full max-w-md sm:block" aria-hidden>
            <div className="absolute inset-6 rounded-[2.5rem] bg-accent" />
            <HeroCard className="absolute left-0 top-2 z-10 -rotate-6" category="sports" title="Sunday morning badminton" meta="Bandra" going="2 of 6 going" />
            <HeroCard className="absolute right-0 top-28 rotate-3" category="outdoors" title="Beginner's trek to Kanheri Caves" meta="SGNP, Borivali" going="Request to join" />
            <HeroCard className="absolute bottom-0 left-2 z-20 -rotate-2" category="board_games" title="Board games evening" meta="Lower Parel" going="3 spots left" />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold sm:text-3xl">What are you in the mood for?</h2>
            <p className="mt-1 text-muted-foreground">Pick a vibe and see who&apos;s going.</p>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {CATEGORIES.slice(0, 11).map((c) => (
            <Link
              key={c.value}
              href={`/discover?category=${c.value}`}
              className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift"
            >
              <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${c.tone}`}>
                <c.icon className="size-5" />
              </span>
              <span className="text-sm font-semibold leading-tight">{c.label}</span>
            </Link>
          ))}
          <Link
            href="/discover"
            className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border p-3 text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            See everything <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto mt-20 max-w-6xl px-4 sm:px-6">
        <h2 className="text-2xl font-extrabold sm:text-3xl">How GoTogether works</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            { icon: Search, title: "Discover", text: "Browse upcoming plans near you — filter by activity, neighbourhood and date." },
            { icon: Send, title: "Request to join", text: "Send a request with a short note. The organiser reviews it and approves who joins." },
            { icon: PartyPopper, title: "Go together", text: "Once accepted, you'll see the plan and the group. Meet at the public venue and enjoy." },
          ].map((s, i) => (
            <div key={s.title} className="relative rounded-2xl border border-border bg-card p-6 shadow-soft">
              <span className="absolute right-5 top-4 font-display text-5xl font-extrabold text-secondary">{i + 1}</span>
              <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-white">
                <s.icon className="size-5" />
              </span>
              <h3 className="mt-4 text-lg font-bold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Example activities */}
      {activities.length > 0 && (
        <section className="mx-auto mt-20 max-w-6xl px-4 sm:px-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold sm:text-3xl">Coming up in Mumbai</h2>
              <p className="mt-1 text-muted-foreground">A few plans you could join.</p>
            </div>
            <Link href="/discover" className="hidden items-center gap-1 text-sm font-semibold text-primary hover:underline sm:flex">
              View all <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {activities.map((a) => (
              <ActivityCard key={a.id} activity={a} isMine={a.organiser_id === user?.id} />
            ))}
          </div>
          <div className="mt-6 sm:hidden">
            <Button asChild variant="outline" className="w-full">
              <Link href="/discover">View all activities</Link>
            </Button>
          </div>
        </section>
      )}

      {/* Trust */}
      <section className="mx-auto mt-20 max-w-6xl px-4 sm:px-6">
        <div className="rounded-3xl bg-navy p-6 text-white sm:p-10">
          <div className="grid gap-8 md:grid-cols-[1fr_1.4fr]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold">
                <ShieldCheck className="size-3.5" /> Built with safety in mind
              </span>
              <h2 className="mt-4 text-2xl font-extrabold sm:text-3xl">A community, not a free-for-all.</h2>
              <p className="mt-3 text-white/70">
                GoTogether is an activity-first community — not a dating app. Here is how we keep plans comfortable for everyone.
              </p>
              <Button asChild variant="outline" className="mt-6 border-white/20 bg-transparent text-white hover:bg-white/10">
                <Link href="/guidelines">Read the community guidelines</Link>
              </Button>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2">
              {[
                { icon: UserCheck, title: "Organisers approve every request", text: "Nobody joins your plan without your OK." },
                { icon: CalendarDays, title: "Adults only (18+)", text: "Everyone confirms they are 18 or older when they join." },
                { icon: MapPinned, title: "Public venues", text: "Plans list a public meeting place. We never share live locations." },
                { icon: EyeOff, title: "No phone numbers shown", text: "Profiles never display contact details publicly." },
                { icon: Flag, title: "Report anything off", text: "Flag an activity in two taps and our team will review it." },
              ].map((t) => (
                <li key={t.title} className="flex gap-3 rounded-2xl bg-white/5 p-4">
                  <t.icon className="mt-0.5 size-5 shrink-0 text-[#FF9A85]" />
                  <div>
                    <p className="font-semibold">{t.title}</p>
                    <p className="text-sm text-white/65">{t.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto mt-20 max-w-6xl px-4 text-center sm:px-6">
        <h2 className="text-3xl font-extrabold sm:text-4xl">Got a plan? Don&apos;t go alone.</h2>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">Post what you want to do and let people who love the same things join you.</p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href={user ? "/activities/new" : "/signup?next=/activities/new"}>Create a Plan</Link>
          </Button>
          {!user && (
            <Button asChild size="lg" variant="outline">
              <Link href="/signup">Sign up free</Link>
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}
