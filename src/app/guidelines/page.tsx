import type { Metadata } from "next";
import { HeartHandshake, ShieldCheck, Ban, Flag, MapPinned, Users } from "lucide-react";

export const metadata: Metadata = { title: "Community guidelines & safety" };

const RULES = [
  { icon: HeartHandshake, title: "Be kind and inclusive", text: "Welcome people of all backgrounds, genders, skill levels and abilities. No harassment, hate speech or discrimination." },
  { icon: Users, title: "It's about the activity", text: "GoTogether is for doing things together — not a dating app. Don't use plans to pursue unwanted romantic attention." },
  { icon: MapPinned, title: "Post real, public plans", text: "Describe activities honestly, list a public venue and keep costs transparent. No fake events, scams or hidden charges." },
  { icon: Ban, title: "No selling or spam", text: "Don't use GoTogether to advertise, recruit for schemes, or collect personal data." },
  { icon: ShieldCheck, title: "Adults only", text: "You must be 18 or older. Don't organise activities involving alcohol, drugs or anything illegal." },
  { icon: Flag, title: "Report problems", text: "If something feels off, use “Report activity” on the activity page. Reports are private." },
];

export default function GuidelinesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="text-3xl font-extrabold sm:text-4xl">Community guidelines</h1>
      <p className="mt-3 text-lg text-muted-foreground">GoTogether works because people show up for each other. These simple rules keep it friendly and safe.</p>

      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {RULES.map((r) => (
          <li key={r.title} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <r.icon className="size-6 text-primary" />
            <h2 className="mt-3 font-bold">{r.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{r.text}</p>
          </li>
        ))}
      </ul>

      <section id="safety" className="mt-12 scroll-mt-24 rounded-3xl bg-navy p-6 text-white sm:p-8">
        <h2 className="text-2xl font-extrabold">Safety tips</h2>
        <p className="mt-2 text-white/70">
          GoTogether does not run background checks or verify identities. Please use your own judgement — these tips help.
        </p>
        <ul className="mt-5 list-disc space-y-2 pl-5 text-sm text-white/90">
          <li><strong>Meet in public places</strong> — cafes, parks, sports venues, studios. Never at someone&apos;s home for a first meet.</li>
          <li><strong>Tell a friend</strong> where you&apos;re going, who you&apos;re meeting and when you expect to be back.</li>
          <li><strong>Arrange your own transport</strong> and keep your phone charged.</li>
          <li><strong>Keep personal details private</strong> until you&apos;re comfortable. We never show your phone number or email.</li>
          <li><strong>Don&apos;t send money</strong> in advance to people you haven&apos;t met. GoTogether never handles payments.</li>
          <li><strong>Trust your instincts.</strong> It&apos;s always okay to leave. Report anything that makes you uncomfortable.</li>
          <li>In an emergency in India, call <strong>112</strong>.</li>
        </ul>
      </section>

      <section className="mt-12 space-y-3">
        <h2 className="text-xl font-bold">What happens when you report</h2>
        <p className="text-muted-foreground">
          Reports are stored privately and reviewed by the GoTogether team. Activities or accounts that break these guidelines may be removed.
          During this early MVP, review is manual, so it may take some time — if you feel unsafe, leave and contact local authorities.
        </p>
      </section>
    </div>
  );
}
