import Link from "next/link";
import { CalendarDays, Clock, MapPin, Users } from "lucide-react";
import { getCategory } from "@/lib/constants";
import { formatActivityDate, formatTime } from "@/lib/dates";
import { shortName } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/ui/avatar";
import { ActivityCover } from "./activity-cover";
import { SpotsMeter } from "./spots-meter";
import type { ActivityWithOrganiser } from "@/types/database";

export function ActivityCard({ activity, isMine }: { activity: ActivityWithOrganiser; isMine?: boolean }) {
  const cat = getCategory(activity.category);
  const full = activity.confirmed_count >= activity.max_participants;
  const cancelled = activity.status === "cancelled";

  return (
    <Link
      href={`/activities/${activity.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift focus-visible:ring-2"
    >
      <div className="relative">
        <ActivityCover category={activity.category} src={activity.cover_image_url} title={activity.title} className="h-36" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <Badge variant="outline" className="border-transparent bg-card/95 shadow-soft">
            <cat.icon /> {cat.label}
          </Badge>
        </div>
        <div className="absolute right-3 top-3 flex gap-1.5">
          {cancelled ? (
            <Badge variant="destructive">Cancelled</Badge>
          ) : full ? (
            <Badge variant="secondary" className="bg-navy text-white">Full</Badge>
          ) : null}
          {isMine && <Badge className="bg-primary text-white">Your plan</Badge>}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="line-clamp-2 text-[17px] font-bold leading-snug group-hover:text-primary">{activity.title}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{activity.description}</p>
        </div>

        <ul className="space-y-1.5 text-sm">
          <li className="flex items-center gap-2">
            <CalendarDays className="size-4 text-primary" />
            <span className="font-semibold">{formatActivityDate(activity.activity_date)}</span>
            <span className="text-muted-foreground">·</span>
            <Clock className="size-4 text-muted-foreground" />
            <span>{formatTime(activity.start_time)}</span>
          </li>
          <li className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="size-4 shrink-0" />
            <span className="truncate">
              {activity.venue_name} · <span className="text-foreground">{activity.neighbourhood}</span>
            </span>
          </li>
        </ul>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-3">
          <div className="flex min-w-0 items-center gap-2">
            <UserAvatar name={activity.organiser?.full_name} src={activity.organiser?.avatar_url} seed={activity.organiser_id} className="size-7 text-[11px] ring-0" />
            <span className="truncate text-xs text-muted-foreground">
              by <span className="font-semibold text-foreground">{shortName(activity.organiser?.full_name)}</span>
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 text-xs font-semibold">
            <Users className="size-4 text-muted-foreground" />
            {activity.confirmed_count}/{activity.max_participants} going
          </div>
        </div>
        <SpotsMeter confirmed={activity.confirmed_count} max={activity.max_participants} />
        <span className="sr-only">View details</span>
      </div>
    </Link>
  );
}
