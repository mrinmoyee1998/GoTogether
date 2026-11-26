"use client";

import { updatePassword } from "@/lib/actions/auth";
import { Input } from "@/components/ui/input";
import { Field, FormAlert, SubmitButton, useFormAction } from "@/components/forms";

export function ResetPasswordForm() {
  const [state, onSubmit, pending, formAction] = useFormAction(updatePassword);
  const fe = state && !state.ok ? state.fieldErrors ?? {} : {};
  const formError = state && !state.ok && !fe.password ? state.error : null;

  return (
    <form action={formAction} onSubmit={onSubmit} className="space-y-4" noValidate>
      <FormAlert message={formError} />
      <Field label="New password" htmlFor="password" error={fe.password} hint="At least 8 characters.">
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} aria-invalid={!!fe.password} />
      </Field>
      <Field label="Confirm new password" htmlFor="confirm" error={fe.confirm}>
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required aria-invalid={!!fe.confirm} />
      </Field>
      <SubmitButton pending={pending} className="w-full" size="lg" pendingText="Updating…">
        Update password
      </SubmitButton>
    </form>
  );
}
