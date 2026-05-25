"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { PublicSiteSettings } from "@/lib/site/settings";

const fallback: PublicSiteSettings = {
  logoDarkUrl: null,
  logoLightUrl: null,
  faviconUrl: null,
  footerDescription: "Strategic growth advisory - helping ambitious companies achieve measurable results.",
  footerEmail: "hello@sadeem.agency",
  footerPhone: null,
  footerLocation: null,
  socialLinks: [],
};

const SiteSettingsContext = createContext<PublicSiteSettings>(fallback);

function updateFavicon(url: string) {
  const links = [
    ...document.querySelectorAll<HTMLLinkElement>("link[rel='icon'], link[rel='shortcut icon']"),
  ];
  const link = links[0] ?? document.createElement("link");
  link.rel = "icon";
  link.href = url;
  if (!links.length) document.head.appendChild(link);
}

export function SiteSettingsProvider({
  children,
  initialSettings = fallback,
}: {
  children: ReactNode;
  initialSettings?: PublicSiteSettings;
}) {
  const [settings, setSettings] = useState<PublicSiteSettings>(initialSettings);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/site-settings", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: PublicSiteSettings | null) => {
        if (!cancelled && data) setSettings(data);
      })
      .catch(() => null);

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (settings.faviconUrl) updateFavicon(settings.faviconUrl);
  }, [settings.faviconUrl]);

  const value = useMemo(() => settings, [settings]);
  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>;
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}
