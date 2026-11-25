"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Check, Loader2, X, MapPin, UserMinus } from "lucide-react";
import { respondToRequest } from "@/lib/actions/requests";
import { Button, buttonVariants } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/avatar";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { getCategory } from "@/lib/constants";
import { formatRelative } from "@/lib/dates";
import type { RequestWithProfile } from "@/lib/data/activities";

/** A single join request with organiser accept/decline controls. */
export function RequestRow({ request, isFull, closed }: { request: RequestWithProfile; isFull: boolean; closed?: boolean }) {
  const [pending, startTransition] = useTransition();
  const p = request.profile;

  function respond(decision: "accepted" | "declined") {
    startTransition(async () => {
      const res = await respondToRequest(request.id, decision);
      if (res.ok) toast.success(res.message);
      else toast.error(res.error);
    });
  }

  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 gap-3">
        <UserAvatar name={p?.full_name} src={p?.avatar_url} seed={request.user_id} className="size-11" />
        <div className="min-w-0">
          <p className="font-bold">{p?.full_name ?? "Member"}</p>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            {p?.neighbourhood && (<><MapPin className="size-3" /> {p.neighbourhood} · </>)}
            requested {formatRelative(request.created_at)}
          </p>
          {p?.interests && p.interests.length > 0 && (
            <p className="mt-1 text-xs text-muted-foreground">Into: {p.interests.slice(0, 4).map((i) => getCategory(i).label).join(", ")}</p>
          )}
          {request.message && (
            <p className="mt-2 rounded-xl bg-secondary px-3 py-2 text-sm">&ldquo;{request.message}&rdquo;</p>
          )}
          {!request.message && p?.bio && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{p.bio}</p>}
        </div>
      </div>

      <div className="flex shrink-0 gap-2 sm:flex-col sm:items-stretch">
        {request.status === "pending" ? (
          <>
            <Button
              size="sm"
              variant="success"
              className="flex-1 sm:flex-none"
              disabled={pending || isFull || closed}
              title={isFull ? "Activity is full" : undefined}
              onClick={() => respond("accepted")}
            >
              {pending ? <Loader2 className="animate-spin" /> : <Check />} Accept
            </Button>
            <Button size="sm" variant="outline" className="flex-1 sm:flex-none" disabled={pending} onClick={() => respond("declined")}>
              <X /> Decline
            </Button>
          </>
        ) : (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="ghost" className="text-muted-foreground" disabled={pending}>
                {pending ? <Loader2 className="animate-spin" /> : <UserMinus />} Remove
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogTitle>Remove {p?.full_name?.split(" ")[0] ?? "this participant"}?</AlertDialogTitle>
              <AlertDialogDescription>They&apos;ll see their request as declined and their spot will open up.</AlertDialogDescription>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep</AlertDialogCancel>
                <AlertDialogAction className={buttonVariants({ variant: "destructive" })} onClick={() => respond("declined")}>
                  Remove
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </li>
  );
}
