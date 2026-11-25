"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { CheckCircle2, Clock3, Loader2, Lock, Send, XCircle, Crown, CalendarOff, UsersRound, Ban } from "lucide-react";
import { requestToJoin, cancelRequest } from "@/lib/actions/requests";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";

export type JoinState =
  | { kind: "guest" }
  | { kind: "needs-profile" }
  | { kind: "organiser" }
  | { kind: "cancelled" }
  | { kind: "past" }
  | { kind: "full" }
  | { kind: "can-join" }
  | { kind: "pending"; requestId: string }
  | { kind: "accepted"; requestId: string }
  | { kind: "declined" };

function StatusBox({ icon: Icon, tone, title, text, children }: { icon: typeof Clock3; tone: string; title: string; text: string; children?: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className={`flex items-start gap-3 rounded-2xl p-4 ${tone}`}>
        <Icon className="mt-0.5 size-5 shrink-0" />
        <div>
          <p className="font-bold">{title}</p>
          <p className="text-sm opacity-80">{text}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

export function JoinPanel({ activityId, title, state }: { activityId: string; title: string; state: JoinState }) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");

  function sendRequest() {
    startTransition(async () => {
      const res = await requestToJoin(activityId, note);
      if (res.ok) {
        toast.success(res.message);
        setOpen(false);
        setNote("");
      } else toast.error(res.error);
    });
  }

  function cancel(requestId: string, leaving: boolean) {
    startTransition(async () => {
      const res = await cancelRequest(requestId);
      if (res.ok) toast.success(leaving ? "You've left this activity." : "Request cancelled.");
      else toast.error(res.error);
    });
  }

  switch (state.kind) {
    case "guest":
      return (
        <StatusBox icon={Lock} tone="bg-secondary" title="Log in to join" text="Create a free account to request a spot and see who's going.">
          <Button asChild size="lg" className="w-full">
            <Link href={`/login?next=/activities/${activityId}`}>Log in to request to join</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href={`/signup?next=/activities/${activityId}`}>Create an account</Link>
          </Button>
        </StatusBox>
      );
    case "needs-profile":
      return (
        <StatusBox icon={UsersRound} tone="bg-secondary" title="Finish your profile" text="Organisers need to know a little about you before you can request to join.">
          <Button asChild size="lg" className="w-full">
            <Link href={`/onboarding?next=/activities/${activityId}`}>Complete profile</Link>
          </Button>
        </StatusBox>
      );
    case "organiser":
      return (
        <StatusBox icon={Crown} tone="bg-accent text-primary" title="You're organising this" text="Review join requests below. People only join once you accept them." />
      );
    case "cancelled":
      return <StatusBox icon={Ban} tone="bg-[#FDE4E1] text-destructive" title="Activity cancelled" text="The organiser has cancelled this plan." />;
    case "past":
      return <StatusBox icon={CalendarOff} tone="bg-secondary" title="This activity has started" text="Requests are closed. Check Discover for upcoming plans." />;
    case "full":
      return (
        <StatusBox icon={UsersRound} tone="bg-navy text-white" title="Activity full" text="All spots have been filled. Keep an eye out — spots can open up if someone drops out.">
          <Button asChild variant="outline" className="w-full"><Link href="/discover">Find similar plans</Link></Button>
        </StatusBox>
      );
    case "declined":
      return (
        <StatusBox icon={XCircle} tone="bg-[#FDE4E1] text-destructive" title="Request declined" text="The organiser couldn't fit you in this time. There are plenty of other plans to join!">
          <Button asChild variant="outline" className="w-full"><Link href="/discover">Explore other activities</Link></Button>
        </StatusBox>
      );
    case "pending":
      return (
        <StatusBox icon={Clock3} tone="bg-[#FDF0D5] text-warning" title="Request pending" text="The organiser will review your request. You'll see the update here and on your dashboard.">
          <Button variant="outline" className="w-full" disabled={pending} onClick={() => cancel(state.requestId, false)}>
            {pending && <Loader2 className="animate-spin" />} Cancel request
          </Button>
        </StatusBox>
      );
    case "accepted":
      return (
        <StatusBox icon={CheckCircle2} tone="bg-[#DCF2E6] text-success" title="You're going! 🎉" text="Your request was accepted. Meet the group at the venue — and remember to stay in public places.">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" className="w-full text-muted-foreground" disabled={pending}>
                {pending && <Loader2 className="animate-spin" />} Can&apos;t make it? Leave activity
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogTitle>Leave this activity?</AlertDialogTitle>
              <AlertDialogDescription>Your spot will open up for someone else. You can request again later if there&apos;s space.</AlertDialogDescription>
              <AlertDialogFooter>
                <AlertDialogCancel>Stay</AlertDialogCancel>
                <AlertDialogAction className={buttonVariants({ variant: "destructive" })} onClick={() => cancel(state.requestId, true)}>
                  Leave activity
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </StatusBox>
      );
    case "can-join":
      return (
        <>
          <Button size="lg" className="w-full" onClick={() => setOpen(true)}>
            <Send /> Request to join
          </Button>
          <p className="mt-2 text-center text-xs text-muted-foreground">The organiser approves every request.</p>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request to join</DialogTitle>
                <DialogDescription className="line-clamp-2">{title}</DialogDescription>
              </DialogHeader>
              <label htmlFor="join-note" className="text-sm font-semibold">
                Add a note for the organiser <span className="font-normal text-muted-foreground">(optional)</span>
              </label>
              <Textarea
                id="join-note"
                className="mt-1.5"
                maxLength={280}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Hi! I play casually on weekends and would love to join."
              />
              <p className="mt-1 text-right text-xs text-muted-foreground">{note.length}/280</p>
              <p className="mt-2 rounded-xl bg-secondary p-3 text-xs text-muted-foreground">
                Please don&apos;t share phone numbers here. Meet in public places and use your own judgement.
              </p>
              <Button size="lg" className="mt-4 w-full" onClick={sendRequest} disabled={pending}>
                {pending ? <Loader2 className="animate-spin" /> : <Send />} Send request
              </Button>
            </DialogContent>
          </Dialog>
        </>
      );
  }
}
