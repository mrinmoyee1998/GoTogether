import { cn, initials } from "@/lib/utils";

const COLORS = ["bg-[#FFE4DC] text-[#C2410C]", "bg-[#EDE4FF] text-[#6D28D9]", "bg-[#DCF2E6] text-[#047857]", "bg-[#DFEBFF] text-[#1D4ED8]", "bg-[#FDF0D5] text-[#B45309]", "bg-[#FCE4F3] text-[#BE185D]"];

function colorFor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return COLORS[Math.abs(h) % COLORS.length];
}

export function UserAvatar({
  name,
  src,
  className,
  seed,
}: {
  name: string | null | undefined;
  src?: string | null;
  className?: string;
  seed?: string;
}) {
  return (
    <span
      className={cn(
        "relative inline-flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-bold ring-2 ring-card",
        !src && colorFor(seed ?? name ?? "x"),
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name ?? "Profile photo"} className="size-full object-cover" />
      ) : (
        <span aria-hidden>{initials(name)}</span>
      )}
      {!src && <span className="sr-only">{name}</span>}
    </span>
  );
}
