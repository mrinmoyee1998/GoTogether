import type { Metadata } from "next";
import { format } from "date-fns";
import { MapPin } from "lucide-react";
import { requireOnboarded } from "@/lib/auth";
import { getCategory } from "@/lib/constants";
import { ProfileForm } from "@/components/profile-form";
import { UserAvatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Your profile" };

export default async function ProfilePage() {
  const { profile, user } = await requireOnboarded("/profile");

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="flex items-center gap-4">
        <UserAvatar name={profile.full_name} src={profile.avatar_url} seed={profile.id} className="size-16 text-lg" />
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-extrabold">{profile.full_name}</h1>
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="size-4" /> {profile.neighbourhood}, {profile.city} · Member since {format(new Date(profile.created_at), "MMM yyyy")}
          </p>
        </div>
      </div>
      {profile.interests.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {profile.interests.map((i) => {
            const c = getCategory(i);
            return <Badge key={i} variant="secondary"><c.icon /> {c.label}</Badge>;
          })}
        </div>
      )}
      <p className="mt-3 text-xs text-muted-foreground">Signed in as {user.email} — your email is never shown to other members.</p>

      <div className="mt-8 rounded-3xl border border-border bg-card p-5 shadow-soft sm:p-8">
        <h2 className="mb-6 text-xl font-bold">Edit profile</h2>
        <ProfileForm profile={profile} mode="edit" />
      </div>
    </div>
  );
}
