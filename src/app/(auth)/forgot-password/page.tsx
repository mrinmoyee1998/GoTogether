import type { Metadata } from "next";
import { AuthShell } from "../auth-shell";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = { title: "Reset your password" };

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <AuthShell title="Forgot your password?" subtitle="Enter the email you signed up with and we'll send you a link to set a new password.">
      <ForgotPasswordForm
        initialError={error ? "That reset link has expired or was already used. Request a new one below." : undefined}
      />
    </AuthShell>
  );
}
