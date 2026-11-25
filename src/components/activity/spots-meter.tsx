import { cn } from "@/lib/utils";

export function SpotsMeter({ confirmed, max, className }: { confirmed: number; max: number; className?: string }) {
  const pct = Math.min(100, Math.round((confirmed / Math.max(1, max)) * 100));
  const left = Math.max(0, max - confirmed);
  return (
    <div className={cn("space-y-1", className)}>
      <div className="h-1.5 overflow-hidden rounded-full bg-secondary" role="progressbar" aria-valuenow={confirmed} aria-valuemin={0} aria-valuemax={max} aria-label="Spots filled">
        <div className={cn("h-full rounded-full transition-all", left === 0 ? "bg-navy" : "bg-primary")} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-muted-foreground">
        {left === 0 ? "No spots left" : `${left} ${left === 1 ? "spot" : "spots"} left`}
      </p>
    </div>
  );
}
