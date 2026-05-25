import "./globals.css";
import type { ReactNode } from "react";
import { SiteSettingsProvider } from "@/components/SiteSettingsProvider";
import { getPublicSiteSettings } from "@/lib/site/settings";

export const metadata = {
  title: "SADEEM - Strategic Growth Advisory",
  description:
    "A strategic operating system for growth. SADEEM turns ambition into measurable, scalable execution.",
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
      </head>
      <body>
        <SiteSettingsProvider initialSettings={siteSettings}>{children}</SiteSettingsProvider>
      </body>
    </html>
  );
}
