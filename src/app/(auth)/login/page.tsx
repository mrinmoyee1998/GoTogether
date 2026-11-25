import type { Metadata } from "next";
import { AuthShell } from "../auth-shell";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  return (
    <AuthShell title="Welcome back" subtitle="Log in to see your plans and requests.">
      <LoginForm next={next} initialError={error ? "That link is invalid or has expired. Please log in." : undefined} />
    </AuthShell>
  );
}
