"use client";

import { useActionState, useTransition, type FormEvent } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * Like useActionState, but once hydrated submits via onSubmit so React does
 * not reset the form after the action (keeps the user's input on validation
 * errors). `action` is still passed to the <form> so a submit that happens
 * before hydration POSTs to the server action instead of doing a GET.
 */
export function useFormAction<S>(action: (prev: S | null, fd: FormData) => Promise<S>) {
  const [state, dispatch, isPending] = useActionState(action, null);
  const [transitionPending, startTransition] = useTransition();
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => dispatch(fd));
  };
  return [state, onSubmit, isPending || transitionPending, dispatch] as const;
}

export function SubmitButton({
  children, pendingText, pending = false, ...props
}: ButtonProps & { pendingText?: string; pending?: boolean }) {
  return (
    <Button type="submit" disabled={pending || props.disabled} aria-busy={pending} {...props}>
      {pending ? (
        <>
          <Loader2 className="animate-spin" /> {pendingText ?? "Saving…"}
        </>
      ) : (
        children
      )}
    </Button>
  );
}

export function Field({
  label, htmlFor, error, hint, optional, children, className,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor}>
        {label} {optional && <span className="font-normal text-muted-foreground">(optional)</span>}
      </Label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="text-sm font-medium text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export function FormAlert({ message, variant = "error" }: { message?: string | null; variant?: "error" | "success" }) {
  if (!message) return null;
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2 rounded-xl px-4 py-3 text-sm font-medium",
        variant === "error" ? "bg-[#FDE4E1] text-destructive" : "bg-[#DCF2E6] text-success",
      )}
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
