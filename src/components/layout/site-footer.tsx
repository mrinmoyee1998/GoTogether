import Link from "next/link";
import { Logo } from "@/components/logo";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border bg-card">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-xs text-sm text-muted-foreground">
            Find your people. Do more together. Now starting in Mumbai.
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-bold">Explore</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link className="hover:text-foreground" href="/discover">Discover activities</Link></li>
            <li><Link className="hover:text-foreground" href="/activities/new">Create a plan</Link></li>
            <li><Link className="hover:text-foreground" href="/dashboard">Dashboard</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-bold">Community</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link className="hover:text-foreground" href="/guidelines">Community guidelines</Link></li>
            <li><Link className="hover:text-foreground" href="/guidelines#safety">Safety tips</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-bold">Legal</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link className="hover:text-foreground" href="/privacy">Privacy policy</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-muted-foreground sm:px-6">
          © {new Date().getFullYear()} GoTogether · For adults 18+ · Always meet in public places and use your own
          judgement.
        </p>
      </div>
    </footer>
  );
}
