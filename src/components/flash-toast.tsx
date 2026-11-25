"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

/** Shows a one-off success toast for a query flag (e.g. ?created=1) and removes it from the URL. */
export function FlashToast({ messages }: { messages: Record<string, string> }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const shown = useRef(false);

  useEffect(() => {
    if (shown.current) return;
    const key = Object.keys(messages).find((k) => params.get(k));
    if (!key) return;
    shown.current = true;
    toast.success(messages[key]);
    const sp = new URLSearchParams(params.toString());
    sp.delete(key);
    router.replace(`${pathname}${sp.size ? `?${sp}` : ""}`, { scroll: false });
  }, [params, messages, router, pathname]);

  return null;
}
