import type { ReactNode } from "react";
import SmoothScroll from "@/components/SmoothScroll";
import { NavAnchorsProvider } from "@/components/NavAnchorsProvider";
import { getHomeSectionLayout } from "@/lib/site/homeSections";

// Cinematic marketing wrapper — Lenis smooth scroll + scroll context.
// Admin pages live outside this group and skip the smooth scroll.
export default async function MarketingLayout({ children }: { children: ReactNode }) {
  // Every marketing page links back to homepage anchors, so the disabled set is
  // resolved once here rather than per page.
  const layout = await getHomeSectionLayout();
  const hiddenAnchors = layout
    .filter((entry) => !entry.enabled && entry.anchor)
    .map((entry) => entry.anchor as string);

  return (
    <NavAnchorsProvider hiddenAnchors={hiddenAnchors}>
      <SmoothScroll>{children}</SmoothScroll>
    </NavAnchorsProvider>
  );
}
