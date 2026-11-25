"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, PlusCircle, LayoutDashboard, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

export const NAV_ITEMS = [
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/activities/new", label: "Create", desktopLabel: "Create Activity", icon: PlusCircle },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/profile", label: "Profile", icon: UserRound },
];

function isActive(pathname: string, href: string) {
  if (href === "/discover")
    return pathname === "/discover" || (pathname.startsWith("/activities/") && pathname !== "/activities/new");
  return pathname === href || pathname.startsWith(href + "/");
}

export function DesktopNav() {
  const pathname = usePathname();
  return (
    <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
            isActive(pathname, item.href)
              ? "bg-accent text-primary"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground",
          )}
        >
          {item.desktopLabel ?? item.label}
        </Link>
      ))}
    </nav>
  );
}

export function MobileBottomNav({ pendingCount = 0 }: { pendingCount?: number }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Main mobile"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 pb-safe backdrop-blur md:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 pt-2.5 pb-1 text-[11px] font-semibold",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="size-6" strokeWidth={active ? 2.4 : 1.8} />
                {item.label}
                {item.href === "/dashboard" && pendingCount > 0 && (
                  <span className="absolute right-[calc(50%-22px)] top-1.5 flex size-[18px] items-center justify-center rounded-full bg-primary text-[10px] text-white">
                    {pendingCount > 9 ? "9+" : pendingCount}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
