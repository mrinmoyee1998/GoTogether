import { getCategory } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * Activity cover: the organiser's uploaded photo if present, otherwise a
 * category-themed illustration (tonal background + large icon + pattern).
 */
export function ActivityCover({
  category,
  src,
  title,
  className,
  iconClassName,
}: {
  category: string;
  src?: string | null;
  title: string;
  className?: string;
  iconClassName?: string;
}) {
  const cat = getCategory(category);
  const Icon = cat.icon;
  if (src) {
    return (
      <div className={cn("relative overflow-hidden bg-secondary", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={title} className="size-full object-cover" loading="lazy" />
      </div>
    );
  }
  return (
    <div className={cn("relative overflow-hidden", cat.tone, className)} aria-hidden>
      <svg className="absolute inset-0 size-full opacity-[0.18]" aria-hidden>
        <defs>
          <pattern id={`dots-${cat.value}`} width="18" height="18" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.6" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#dots-${cat.value})`} />
      </svg>
      <div className="absolute -right-6 -bottom-8 size-40 rounded-full bg-white/35" />
      <div className="absolute -left-10 -top-12 size-32 rounded-full bg-white/25" />
      <Icon className={cn("absolute right-6 bottom-5 size-16 opacity-90", iconClassName)} strokeWidth={1.6} />
    </div>
  );
}
