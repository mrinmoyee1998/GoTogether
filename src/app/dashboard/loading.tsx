import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10 lg:flex-row">
      <Skeleton className="h-72 lg:w-80" />
      <div className="flex-1 space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-12 w-full rounded-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    </div>
  );
}
