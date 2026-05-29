import "./globals.css";
import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SiteSettingsProvider } from "@/components/SiteSettingsProvider";
import { getPublicSiteSettings } from "@/lib/site/settings";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sadeem-agency.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "SADEEM - Strategic Growth Advisory",
    template: "%s | SADEEM",
  },
  description:
    "A strategic operating system for growth. SADEEM turns ambition into measurable, scalable execution.",
  applicationName: "SADEEM",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: "SADEEM",
    url: "/",
    title: "SADEEM - Strategic Growth Advisory",
    description:
      "A strategic operating system for growth. SADEEM turns ambition into measurable, scalable execution.",
    images: [{ url: "/hero/slide1.webp", width: 1600, height: 900, alt: "SADEEM cinematic mountain scene" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "SADEEM - Strategic Growth Advisory",
    description:
      "A strategic operating system for growth. SADEEM turns ambition into measurable, scalable execution.",
    images: ["/hero/slide1.webp"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const siteSettings = await getPublicSiteSettings();

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800;900&family=Geist+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href={siteSettings.faviconUrl ?? "/favicon.svg"} type={siteSettings.faviconUrl ? undefined : "image/svg+xml"} />
      </head>
      <body>
        <SiteSettingsProvider initialSettings={siteSettings}>{children}</SiteSettingsProvider>
        <Analytics />
      </body>
    </html>
  );
}
