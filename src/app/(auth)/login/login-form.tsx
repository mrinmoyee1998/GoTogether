"use client";

import Link from "next/link";
import { signIn } from "@/lib/actions/auth";
import { Input } from "@/components/ui/input";
import { Field, FormAlert, SubmitButton, useFormAction } from "@/components/forms";

export function LoginForm({ next, initialError }: { next?: string; initialError?: string }) {
  const [state, onSubmit, pending, formAction] = useFormAction(signIn);
  const fe = state && !state.ok ? state.fieldErrors ?? {} : {};

  return (
    <form action={formAction} onSubmit={onSubmit} className="space-y-4" noValidate>
      <FormAlert message={state && !state.ok ? state.error : initialError} />
      <input type="hidden" name="next" value={next ?? ""} />
      <Field label="Email" htmlFor="email" error={fe.email}>
        <Input id="email" name="email" type="email" autoComplete="email" required aria-invalid={!!fe.email} placeholder="you@example.com" />
      </Field>
      <Field label="Password" htmlFor="password" error={fe.password}>
        <Input id="password" name="password" type="password" autoComplete="current-password" required aria-invalid={!!fe.password} />
      </Field>
      <div className="-mt-1 text-right">
        <Link href="/forgot-password" className="text-sm font-semibold text-primary hover:underline">
          Forgot password?
        </Link>
      </div>
      <SubmitButton pending={pending} className="w-full" size="lg" pendingText="Logging in…">
        Log in
      </SubmitButton>
      <p className="text-center text-sm text-muted-foreground">
        New to GoTogether?{" "}
        <Link href={next ? `/signup?next=${encodeURIComponent(next)}` : "/signup"} className="font-semibold text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
