import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { safeNext } from "@/lib/utils";
import { ProfileForm } from "@/components/profile-form";

export const metadata: Metadata = { title: "Set up your profile" };

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const { profile } = await requireUser("/onboarding");
  if (!profile) redirect("/login");
  if (profile.onboarding_completed) redirect(safeNext(next, "/discover"));

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
      <p className="text-sm font-bold text-primary">Step 2 of 2</p>
      <h1 className="mt-1 text-3xl font-extrabold">Tell us a little about you</h1>
      <p className="mt-2 text-muted-foreground">
        This helps organisers know who&apos;s asking to join. We never show your email or phone number.
      </p>
      <div className="mt-8 rounded-3xl border border-border bg-card p-5 shadow-soft sm:p-8">
        <ProfileForm profile={profile} mode="onboarding" next={next} />
      </div>
    </div>
  );
}
