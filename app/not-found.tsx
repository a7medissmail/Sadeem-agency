import { getPublicSiteSettings } from "@/lib/site/settings";
import { SiteSettingsProvider } from "@/components/SiteSettingsProvider";
import MainNavbar from "@/components/MainNavbar";
import Footer from "@/components/Footer";
import NotFoundContent from "./_not-found-content";

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
    </SiteSettingsProvider>
  );
}
