import Link from "next/link";
import { MapPinOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <EmptyState icon={MapPinOff} title="We couldn't find that page" description="The activity may have been removed, or the link is incorrect.">
        <Button asChild><Link href="/discover">Discover activities</Link></Button>
      </EmptyState>
    </div>
  );
}
