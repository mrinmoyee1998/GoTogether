"use client";

import Link from "next/link";
import { MailCheck } from "lucide-react";
import { signUp } from "@/lib/actions/auth";
import { Input } from "@/components/ui/input";
import { Field, FormAlert, SubmitButton, useFormAction } from "@/components/forms";

export function SignupForm({ next }: { next?: string }) {
  const [state, onSubmit, pending, formAction] = useFormAction(signUp);
  const fe = state && !state.ok ? state.fieldErrors ?? {} : {};

  if (state?.ok) {
    return (
      <div className="space-y-4 text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#DCF2E6] text-success">
          <MailCheck className="size-7" />
        </span>
        <p className="font-semibold">Almost there!</p>
        <p className="text-sm text-muted-foreground">{state.message}</p>
        <Link href="/login" className="inline-block text-sm font-semibold text-primary hover:underline">
          Go to log in
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} onSubmit={onSubmit} className="space-y-4" noValidate>
      <FormAlert message={state && !state.ok ? state.error : null} />
      <input type="hidden" name="next" value={next ?? ""} />
      <Field label="Full name" htmlFor="fullName" error={fe.fullName}>
        <Input id="fullName" name="fullName" autoComplete="name" required aria-invalid={!!fe.fullName} placeholder="Priya Sharma" />
      </Field>
      <Field label="Email" htmlFor="email" error={fe.email}>
        <Input id="email" name="email" type="email" autoComplete="email" required aria-invalid={!!fe.email} placeholder="you@example.com" />
      </Field>
      <Field label="Password" htmlFor="password" error={fe.password} hint="At least 8 characters.">
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} aria-invalid={!!fe.password} />
      </Field>
      <SubmitButton pending={pending} className="w-full" size="lg" pendingText="Creating account…">
        Create account
      </SubmitButton>
      <p className="text-center text-xs text-muted-foreground">
        GoTogether is for adults 18+. By signing up you agree to our{" "}
        <Link href="/guidelines" className="underline">community guidelines</Link> and{" "}
        <Link href="/privacy" className="underline">privacy policy</Link>.
      </p>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">Log in</Link>
      </p>
    </form>
  );
}
