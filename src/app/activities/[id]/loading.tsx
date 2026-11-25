import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <Skeleton className="h-5 w-36" />
      <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Skeleton className="h-[420px] rounded-3xl" />
          <Skeleton className="h-32" />
        </div>
        <div className="space-y-5">
          <Skeleton className="h-52" />
          <Skeleton className="h-40" />
        </div>
      </div>
    </div>
  );
}
