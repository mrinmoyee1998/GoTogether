"use client";

import Link from "next/link";
import { MailCheck } from "lucide-react";
import { requestPasswordReset } from "@/lib/actions/auth";
import { Input } from "@/components/ui/input";
import { Field, FormAlert, SubmitButton, useFormAction } from "@/components/forms";

export function ForgotPasswordForm({ initialError }: { initialError?: string }) {
  const [state, onSubmit, pending, formAction] = useFormAction(requestPasswordReset);
  const fe = state && !state.ok ? state.fieldErrors ?? {} : {};

  if (state?.ok) {
    return (
      <div className="space-y-4 text-center" role="status">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#DCF2E6] text-success">
          <MailCheck className="size-7" />
        </span>
        <p className="font-semibold">Check your inbox</p>
        <p className="text-sm text-muted-foreground">{state.message}</p>
        <p className="text-xs text-muted-foreground">The link works once and expires after an hour.</p>
        <Link href="/login" className="inline-block text-sm font-semibold text-primary hover:underline">
          Back to log in
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} onSubmit={onSubmit} className="space-y-4" noValidate>
      <FormAlert message={state && !state.ok ? state.error : initialError} />
      <Field label="Email" htmlFor="email" error={fe.email}>
        <Input id="email" name="email" type="email" autoComplete="email" required aria-invalid={!!fe.email} placeholder="you@example.com" />
      </Field>
      <SubmitButton pending={pending} className="w-full" size="lg" pendingText="Sending…">
        Send reset link
      </SubmitButton>
      <p className="text-center text-sm text-muted-foreground">
        Remembered it?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Back to log in
        </Link>
      </p>
    </form>
  );
}
