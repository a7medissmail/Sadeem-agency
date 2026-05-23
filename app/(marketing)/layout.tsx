import type { ReactNode } from "react";
import SmoothScroll from "@/components/SmoothScroll";

// Cinematic marketing wrapper — Lenis smooth scroll + scroll context.
// Admin pages live outside this group and skip the smooth scroll.
export default function MarketingLayout({ children }: { children: ReactNode }) {
  return <SmoothScroll>{children}</SmoothScroll>;
}
