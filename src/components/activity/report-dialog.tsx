"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Flag, Loader2 } from "lucide-react";
import { reportActivity } from "@/lib/actions/reports";
import { REPORT_REASONS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function ReportDialog({ activityId }: { activityId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>("");
  const [details, setDetails] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      const res = await reportActivity(activityId, reason, details);
      if (res.ok) {
        toast.success(res.message);
        setOpen(false);
        setReason("");
        setDetails("");
      } else toast.error(res.error);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-destructive cursor-pointer">
          <Flag className="size-4" /> Report activity
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report this activity</DialogTitle>
          <DialogDescription>Reports are private. Our team reviews every one. If you are in immediate danger, call 112.</DialogDescription>
        </DialogHeader>
        <fieldset className="space-y-2">
          <legend className="sr-only">Reason</legend>
          {REPORT_REASONS.map((r) => (
            <label
              key={r.value}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold",
                reason === r.value ? "border-primary bg-accent" : "border-border hover:bg-secondary",
              )}
            >
              <input type="radio" name="reason" value={r.value} checked={reason === r.value} onChange={() => setReason(r.value)} className="accent-[#F0553F]" />
              {r.label}
            </label>
          ))}
        </fieldset>
        <Textarea className="mt-3" maxLength={1000} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Anything else we should know? (optional)" aria-label="Details" />
        <Button variant="destructive" className="mt-4 w-full" disabled={!reason || pending} onClick={submit}>
          {pending && <Loader2 className="animate-spin" />} Submit report
        </Button>
      </DialogContent>
    </Dialog>
  );
}
