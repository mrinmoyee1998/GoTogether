import type { Metadata } from "next";
import Link from "next/link";
import { LinkIcon } from "lucide-react";
import { getAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { AuthShell } from "../auth-shell";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = { title: "Set a new password" };

/**
 * Reached from the reset email via /auth/callback, which signs the user in
 * with a short-lived recovery session. Without that session, the link has
 * expired (or the page was opened directly), so offer a new link instead.
 */
export default async function ResetPasswordPage() {
  const { user } = await getAuth();

  if (!user) {
    return (
      <AuthShell title="This link has expired" subtitle="Password reset links work once and expire after an hour.">
        <div className="space-y-4 text-center">
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-accent text-primary">
            <LinkIcon className="size-7" />
          </span>
          <Button asChild size="lg" className="w-full">
            <Link href="/forgot-password">Send me a new link</Link>
          </Button>
          <Link href="/login" className="inline-block text-sm font-semibold text-primary hover:underline">
            Back to log in
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Set a new password" subtitle={`Choose a new password for ${user.email}.`}>
      <ResetPasswordForm />
    </AuthShell>
  );
}
