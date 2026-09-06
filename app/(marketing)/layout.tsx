import type { ReactNode } from "react";
import SmoothScroll from "@/components/SmoothScroll";
import { NavAnchorsProvider } from "@/components/NavAnchorsProvider";
import { getHomeSectionLayout } from "@/lib/site/homeSections";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { ConsentNotice } from "@/components/analytics/ConsentNotice";

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
      {/* Measurement lives with the audience it measures: visitors. It used to
          sit in the root layout, which also wraps /admin and /p /q — so staff
          navigation inflated the site's numbers, admin search terms reached
          Google inside the query string, and portal tokens travelled as page
          paths. The 404 page carries its own copy; nothing else public sits
          outside this group. */}
      <GoogleAnalytics />
      <ConsentNotice />
    </NavAnchorsProvider>
  );
}
