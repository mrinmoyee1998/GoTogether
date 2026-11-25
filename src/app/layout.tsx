import type { Metadata, Viewport } from "next";
import "@fontsource-variable/plus-jakarta-sans";
import "@fontsource-variable/bricolage-grotesque";
import { Toaster } from "sonner";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "GoTogether — Find your people. Do more together.", template: "%s · GoTogether" },
  description:
    "Discover activities in Mumbai, meet people with similar interests, and make your weekends more interesting.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
};

export const viewport: Viewport = {
  themeColor: "#FBF8F4",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-IN">
      <body className="min-h-dvh font-sans">
        <SiteHeader />
        <div className="pb-20 md:pb-0">
          <main className="min-h-[60vh]">{children}</main>
          <SiteFooter />
        </div>
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
