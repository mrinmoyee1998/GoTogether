import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden>
      <rect width="32" height="32" rx="10" fill="#F0553F" />
      <circle cx="12" cy="16" r="5.5" fill="none" stroke="#fff" strokeWidth="2.6" />
      <circle cx="20" cy="16" r="5.5" fill="none" stroke="#FFD9CF" strokeWidth="2.6" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("flex items-center gap-2 font-display text-lg font-extrabold tracking-tight", className)}
      aria-label="GoTogether home"
    >
      <LogoMark />
      <span>
        Go<span className="text-primary">Together</span>
      </span>
    </Link>
  );
}
