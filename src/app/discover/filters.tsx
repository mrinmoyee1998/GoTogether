"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useTransition } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { CATEGORIES, NEIGHBOURHOODS } from "@/lib/constants";
import { Input, NativeSelect } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const WHEN_OPTIONS = [
  { value: "", label: "Any date" },
  { value: "today", label: "Today" },
  { value: "weekend", label: "This weekend" },
  { value: "week", label: "Next 7 days" },
];

export function DiscoverFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const current = {
    q: params.get("q") ?? "",
    category: params.get("category") ?? "",
    area: params.get("area") ?? "",
    when: params.get("when") ?? "",
  };
  const isCustomDate = /^\d{4}-\d{2}-\d{2}$/.test(current.when);
  const hasFilters = Object.values(current).some(Boolean);

  function navigate(next: Partial<typeof current>) {
    const merged = { ...current, ...next };
    const sp = new URLSearchParams();
    Object.entries(merged).forEach(([k, v]) => v && sp.set(k, v));
    startTransition(() => router.replace(`/discover${sp.size ? `?${sp}` : ""}`, { scroll: false }));
  }

  function categoryHref(value: string) {
    const sp = new URLSearchParams(params.toString());
    if (value) sp.set("category", value);
    else sp.delete("category");
    return `/discover${sp.size ? `?${sp}` : ""}`;
  }

  return (
    <div className="space-y-4">
      <form
        ref={formRef}
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          navigate({ q: String(fd.get("q") ?? "").trim() });
        }}
        action="/discover"
        className="grid gap-3 md:grid-cols-[1fr_200px_180px_170px]"
      >
        {/* Keep active filters if the form is submitted before JS has loaded */}
        {current.category && <input type="hidden" name="category" value={current.category} />}
        {current.area && <input type="hidden" name="area" value={current.area} />}
        {current.when && <input type="hidden" name="when" value={current.when} />}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            key={current.q}
            name="q"
            defaultValue={current.q}
            placeholder="Search badminton, trek, pottery…"
            className="pl-10 pr-24"
            aria-label="Search activities"
          />
          <Button type="submit" size="sm" className="absolute right-1 top-1/2 h-9 -translate-y-1/2">
            {pending ? <Loader2 className="animate-spin" /> : "Search"}
          </Button>
        </div>
        <NativeSelect aria-label="Filter by neighbourhood" value={current.area} onChange={(e) => navigate({ area: e.target.value })}>
          <option value="">All neighbourhoods</option>
          {NEIGHBOURHOODS.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </NativeSelect>
        <NativeSelect
          aria-label="Filter by date"
          value={isCustomDate ? "custom" : current.when}
          onChange={(e) => e.target.value !== "custom" && navigate({ when: e.target.value })}
        >
          {WHEN_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
          {isCustomDate && <option value="custom">On {current.when}</option>}
        </NativeSelect>
        <Input
          type="date"
          aria-label="Pick a specific date"
          value={isCustomDate ? current.when : ""}
          min={new Date().toISOString().slice(0, 10)}
          onChange={(e) => navigate({ when: e.target.value })}
        />
      </form>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
        <Link
          href={categoryHref("")}
          scroll={false}
          className={cn(
            "shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
            !current.category ? "border-navy bg-navy text-white" : "border-border bg-card hover:bg-secondary",
          )}
        >
          All
        </Link>
        {CATEGORIES.map((c) => (
          <Link
            key={c.value}
            href={categoryHref(current.category === c.value ? "" : c.value)}
            scroll={false}
            aria-pressed={current.category === c.value}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors",
              current.category === c.value ? "border-navy bg-navy text-white" : "border-border bg-card hover:bg-secondary",
            )}
          >
            <c.icon className="size-4" /> {c.label}
          </Link>
        ))}
      </div>

      {hasFilters && (
        <button
          type="button"
          onClick={() => {
            formRef.current?.reset();
            startTransition(() => router.replace("/discover", { scroll: false }));
          }}
          className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline cursor-pointer"
        >
          <X className="size-4" /> Clear all filters
        </button>
      )}
    </div>
  );
}
