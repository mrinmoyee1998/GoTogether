"use client";

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <EmptyState icon={TriangleAlert} title="Something went wrong" description="We couldn't load this page. Check your connection and try again.">
        <Button onClick={reset}>Try again</Button>
      </EmptyState>
    </div>
  );
}
