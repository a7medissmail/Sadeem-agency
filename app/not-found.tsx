import { getPublicSiteSettings } from "@/lib/site/settings";
import { SiteSettingsProvider } from "@/components/SiteSettingsProvider";
import MainNavbar from "@/components/MainNavbar";
import Footer from "@/components/Footer";
import NotFoundContent from "./_not-found-content";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { ConsentNotice } from "@/components/analytics/ConsentNotice";

/**
 * Server component — fetches site settings before streaming so the real
 * logo is available on first paint with no flash of the fallback mark.
 */
export default async function NotFound() {
  const settings = await getPublicSiteSettings();

  return (
    <SiteSettingsProvider initialSettings={settings}>
      <MainNavbar overDark={true} />
      <NotFoundContent />
      <Footer />
      {/* 404s are worth measuring — broken inbound links are an SEO signal —
          and this page renders outside the (marketing) group, so it carries its
          own copy rather than being tracked from the root layout. */}
      <GoogleAnalytics />
      <ConsentNotice />
    </SiteSettingsProvider>
  );
}
