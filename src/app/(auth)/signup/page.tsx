import type { Metadata } from "next";
import { AuthShell } from "../auth-shell";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Sign up" };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <AuthShell title="Join GoTogether" subtitle="Find people to do more of what you love. It takes a minute.">
      <SignupForm next={next} />
    </AuthShell>
  );
}
