"use client";

import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Pencil, Ban } from "lucide-react";
import { cancelActivity } from "@/lib/actions/activities";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function OrganiserActions({ activityId, cancelled }: { activityId: string; cancelled: boolean }) {
  const [pending, startTransition] = useTransition();
  if (cancelled) return null;

  return (
    <div className="flex gap-2">
      <Button asChild variant="outline" size="sm" className="flex-1">
        <Link href={`/activities/${activityId}/edit`}><Pencil /> Edit</Link>
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="sm" className="flex-1 text-destructive hover:bg-[#FDE4E1]" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : <Ban />} Cancel activity
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogTitle>Cancel this activity?</AlertDialogTitle>
          <AlertDialogDescription>
            It will be removed from Discover and everyone who requested to join will see it as cancelled. This can&apos;t be undone.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: "destructive" })}
              onClick={() =>
                startTransition(async () => {
                  const res = await cancelActivity(activityId);
                  if (res.ok) toast.success(res.message);
                  else toast.error(res.error);
                })
              }
            >
              Cancel activity
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
