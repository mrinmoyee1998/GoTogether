"use client";

import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";
import { CalendarDays, Loader2, MapPin } from "lucide-react";
import { cancelRequest } from "@/lib/actions/requests";
import { Button } from "@/components/ui/button";
import { RequestStatusBadge } from "./status-badge";
import { ActivityCover } from "./activity-cover";
import { Badge } from "@/components/ui/badge";
import { formatActivityDate, formatRelative, formatTime } from "@/lib/dates";
import { shortName } from "@/lib/utils";
import type { MyRequest } from "@/lib/data/dashboard";

export function MyRequestRow({ request }: { request: MyRequest }) {
  const [pending, startTransition] = useTransition();
  const a = request.activity;
  if (!a) return null;

  return (
    <li className="flex gap-3 rounded-2xl border border-border bg-card p-3 sm:p-4">
      <Link href={`/activities/${a.id}`} className="shrink-0">
        <ActivityCover category={a.category} src={a.cover_image_url} title={a.title} className="size-16 rounded-xl sm:size-20" iconClassName="size-8 right-2 bottom-2" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <Link href={`/activities/${a.id}`} className="min-w-0 font-bold leading-snug hover:text-primary">
            {a.title}
          </Link>
          <div className="flex gap-1.5">
            {a.status === "cancelled" && <Badge variant="destructive">Activity cancelled</Badge>}
            <RequestStatusBadge status={request.status} />
          </div>
        </div>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><CalendarDays className="size-3.5" /> {formatActivityDate(a.activity_date)}, {formatTime(a.start_time)}</span>
          <span className="flex items-center gap-1"><MapPin className="size-3.5" /> {a.neighbourhood}</span>
          <span>by {shortName(a.organiser?.full_name)}</span>
        </p>
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">Updated {formatRelative(request.updated_at)}</p>
          {request.status === "pending" && (
            <Button
              size="sm"
              variant="outline"
              className="h-8"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const res = await cancelRequest(request.id);
                  if (res.ok) toast.success("Request cancelled.");
                  else toast.error(res.error);
                })
              }
            >
              {pending && <Loader2 className="animate-spin" />} Cancel request
            </Button>
          )}
        </div>
      </div>
    </li>
  );
}
