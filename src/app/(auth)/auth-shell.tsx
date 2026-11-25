import { LogoMark } from "@/components/logo";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-10 sm:py-16">
      <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8">
        <LogoMark className="size-10" />
        <h1 className="mt-5 text-2xl font-extrabold">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
