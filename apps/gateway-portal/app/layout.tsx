import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter, Outfit } from "next/font/google";

import { PortalHeader } from "@/components/portal-header";
import ReactHotToastProvider from "@/components/providers/react-hot-toast";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
  display: "swap",
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
});

export const metadata: Metadata = {
  title: "LLM Gateway Portal",
  description:
    "A self-service control plane for provider management, child API keys, policy governance, and usage analytics.",
};

const portalHeaderNavItems = [
  { label: "Providers", href: "/providers-card" },
  { label: "Pricing", href: "/pricing-card" },
  { label: "Keys", href: "/keys-card" },
  { label: "Policies", href: "/workflow" },
  { label: "Analytics", href: "/analytics" },
] as const;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${inter.variable} ${ibmPlexMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full bg-background font-sans text-foreground">
        <ReactHotToastProvider>
          <div className="mx-auto w-full max-w-8xl px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:pt-8">
            <PortalHeader navItems={portalHeaderNavItems} />
          </div>
          {children}
        </ReactHotToastProvider>
      </body>
    </html>
  );
}
