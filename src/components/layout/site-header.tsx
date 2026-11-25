import Link from "next/link";
import { LogOut } from "lucide-react";
import { getAuth } from "@/lib/auth";
import { signOut } from "@/lib/actions/auth";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/avatar";
import { DesktopNav, MobileBottomNav } from "./nav-links";

async function getPendingForOrganiser(userId: string) {
  const { supabase } = await getAuth();
  const { count } = await supabase
    .from("join_requests")
    .select("id, activities!inner(organiser_id)", { count: "exact", head: true })
    .eq("status", "pending")
    .eq("activities.organiser_id", userId);
  return count ?? 0;
}

const guestLink =
  "rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground";

export async function SiteHeader() {
  const { user, profile } = await getAuth();
  const pending = user ? await getPendingForOrganiser(user.id) : 0;

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo />
          {user ? (
            <DesktopNav />
          ) : (
            <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
              <Link href="/discover" className={guestLink}>Discover</Link>
              <Link href="/activities/new" className={guestLink}>Create Activity</Link>
              <Link href="/guidelines" className={guestLink}>Safety</Link>
            </nav>
          )}
          <div className="flex items-center gap-1.5">
            {user ? (
              <>
                <Link
                  href="/profile"
                  className="flex items-center gap-2 rounded-full p-0.5 hover:bg-secondary md:pr-3"
                  aria-label="Your profile"
                >
                  <UserAvatar
                    name={profile?.full_name || user.email}
                    src={profile?.avatar_url}
                    seed={user.id}
                    className="size-9"
                  />
                  <span className="hidden max-w-32 truncate text-sm font-semibold md:inline">
                    {profile?.full_name?.split(" ")[0] || "Profile"}
                  </span>
                </Link>
                <form action={signOut}>
                  <Button type="submit" variant="ghost" size="sm" className="px-3" aria-label="Log out">
                    <LogOut />
                    <span className="hidden sm:inline">Log out</span>
                  </Button>
                </form>
              </>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/login">Log in</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/signup">Sign up</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>
      {user && <MobileBottomNav pendingCount={pending} />}
    </>
  );
}
