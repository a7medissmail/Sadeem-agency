"use client";

/**
 * TurnstileWidget
 * ───────────────
 * Renders a Cloudflare Turnstile challenge inside a <form>.
 * On completion the widget injects a hidden input named "cf-turnstile-response"
 * which is read and verified server-side by lib/turnstile.ts.
 *
 * Uses explicit rendering (render=explicit) so the widget initialises
 * correctly whether the script loads before or after the component mounts.
 */

import Script from "next/script";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: { sitekey: string; theme?: string; size?: string },
      ) => string;
      reset: (widgetId: string) => void;
    };
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

export function TurnstileWidget() {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  function renderWidget() {
    if (!containerRef.current || !window.turnstile || !SITE_KEY) return;
    if (widgetIdRef.current !== null) return; // already rendered
    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: SITE_KEY,
      theme: "light",
    });
  }

  useEffect(() => {
    // If the script was already loaded (e.g. on subsequent navigations), render now
    if (window.turnstile) renderWidget();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!SITE_KEY) return null;

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="lazyOnload"
        onLoad={renderWidget}
      />
      <div ref={containerRef} />
    </>
  );
}
