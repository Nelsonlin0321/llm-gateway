import type { Metadata } from "next";
import { Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";

import { PortalHeader } from "@/components/portal-header";
import ReactHotToastProvider from "@/components/providers/react-hot-toast";
import "./globals.css";

/* OpenRouter skill: Plus Jakarta Sans (Gordita fallback) + Geist Mono */
const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "500", "600", "700"],
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

const plusJakartaBody = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["400", "500", "600", "700"],
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
  display: "swap",
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
});

export const metadata: Metadata = {
  title: "Gateway — LLM Control Plane",
  description:
    "Enterprise control plane for LLM providers, child API keys, policy governance, and usage analytics.",
};

const portalHeaderNavItems = [
  { label: "Product", href: "/" },
  { label: "Console", href: "/workspace" },
] as const;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${plusJakartaBody.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full bg-background font-sans text-foreground">
        <ReactHotToastProvider>
          <PortalHeader navItems={portalHeaderNavItems} />
          {children}
        </ReactHotToastProvider>
      </body>
    </html>
  );
}
