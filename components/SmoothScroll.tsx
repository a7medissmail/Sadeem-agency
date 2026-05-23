"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import Lenis from "lenis";

const ScrollContext = createContext(0);

export function useScrollY() {
  return useContext(ScrollContext);
}

export default function SmoothScroll({ children }: { children: ReactNode }) {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // Start ordinary loads at the top; preserve hash links for direct section access.
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    const initialHash = window.location.hash;
    if (!initialHash) {
      window.scrollTo(0, 0);
    }

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: !prefersReduced,
    });
    window.lenis = lenis;

    lenis.on("scroll", ({ scroll }) => setScrollY(scroll));

    // Only treat the hash as a scroll target if it's a plain element id
    // (e.g. "#about"). Supabase auth flows append tokens like
    // "#access_token=…" which are not valid selectors and would crash Lenis.
    const isPlainId = /^#[A-Za-z][\w-]*$/.test(initialHash);
    if (isPlainId && document.querySelector(initialHash)) {
      requestAnimationFrame(() => lenis.scrollTo(initialHash, { immediate: true }));
    }

    let rafId: number;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return (
    <ScrollContext.Provider value={scrollY}>{children}</ScrollContext.Provider>
  );
}
