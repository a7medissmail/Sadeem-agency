"use client";

import { useAutoSave } from "@/components/admin/hooks/useAutoSave";
import { SaveStatus } from "@/components/admin/ui/SaveStatus";
import { FieldRow, Input, Textarea } from "@/components/admin/ui/Field";
import { socialPlatformLabels, socialPlatforms, socialUrlForPlatform, type SocialPlatform } from "@/lib/site/social";
import { updateSiteSettingsAction, type SiteSettingsState } from "./actions";
import type { Database, Json } from "@/types/database";
import { InlineAlert } from "@/components/admin/ui/Feedback";

const initial: SiteSettingsState = {};
const platforms = socialPlatforms;

type SettingsRow = Database["public"]["Tables"]["site_settings"]["Row"];

function PreviewLogo({ url, tone }: { url: string | null; tone: "dark" | "light" }) {
  if (!url) return null;
  return (
    <div className={tone === "dark" ? "border border-[var(--admin-border)] bg-white p-4" : "border border-[var(--admin-border)] bg-black p-4"}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="" className="h-8 w-auto max-w-[180px] object-contain" />
    </div>
  );
}

function socialValue(socials: Json | null | undefined, platform: SocialPlatform) {
  return socialUrlForPlatform(socials, platform);
}

function socialPlaceholder(platform: SocialPlatform) {
  const defaultUrl = socialUrlForPlatform(null, platform);
  if (defaultUrl) return defaultUrl;
  return `https://${platform === "x" ? "x.com" : `${platform}.com`}/sadeem`;
}

export default function SettingsForm({ settings }: { settings: SettingsRow }) {
  const { formRef, status, errorMsg, onFormChange } = useAutoSave(
    updateSiteSettingsAction,
    initial,
  );

  return (
    <form
      ref={formRef}
      onChange={onFormChange}
      onSubmit={(e) => e.preventDefault()}
      encType="multipart/form-data"
      className="grid gap-8 xl:grid-cols-[1fr_0.9fr]"
    >
      <div className="flex flex-col gap-6">
        <section className="border border-[var(--admin-border)] bg-[var(--admin-panel)] p-5">
          <div className="mb-5">
            <p className="sdm-eyebrow text-[var(--admin-accent)]">Brand</p>
            <h2 className="mt-2 text-xl font-semibold">Logo and favicon</h2>
            <p className="mt-1 text-[13px] text-[var(--admin-muted)]">
              Dark logo is for light nav. White logo is for dark nav and footer.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FieldRow label="Dark logo URL">
              <Input name="logo_dark_url" type="url" defaultValue={settings.logo_dark_url ?? ""} />
            </FieldRow>
            <FieldRow label="Upload dark logo">
              <Input name="logo_dark_file" type="file" accept="image/svg+xml,image/png,image/jpeg,image/webp" />
            </FieldRow>
            <PreviewLogo url={settings.logo_dark_url} tone="dark" />
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <FieldRow label="White logo URL">
              <Input name="logo_light_url" type="url" defaultValue={settings.logo_light_url ?? ""} />
            </FieldRow>
            <FieldRow label="Upload white logo">
              <Input name="logo_light_file" type="file" accept="image/svg+xml,image/png,image/jpeg,image/webp" />
            </FieldRow>
            <PreviewLogo url={settings.logo_light_url} tone="light" />
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <FieldRow label="Favicon URL">
              <Input name="favicon_url" type="url" defaultValue={settings.favicon_url ?? ""} />
            </FieldRow>
            <FieldRow label="Upload favicon">
              <Input name="favicon_file" type="file" accept="image/svg+xml,image/png,image/x-icon" />
            </FieldRow>
          </div>
        </section>

        <section className="border border-[var(--admin-border)] bg-[var(--admin-panel)] p-5">
          <div className="mb-5">
            <p className="sdm-eyebrow text-[var(--admin-accent)]">Footer</p>
            <h2 className="mt-2 text-xl font-semibold">Contact and social links</h2>
          </div>

          <div className="grid gap-4">
            <FieldRow label="Footer description">
              <Textarea name="footer_description" rows={4} defaultValue={settings.footer_description} />
            </FieldRow>
            <div className="grid gap-4 md:grid-cols-3">
              <FieldRow label="Email">
                <Input name="footer_email" type="email" defaultValue={settings.footer_email} />
              </FieldRow>
              <FieldRow label="Phone">
                <Input
                  name="footer_phone"
                  defaultValue={settings.footer_phone ?? ""}
                  placeholder="+20 2 2414 4266"
                />
              </FieldRow>
              <FieldRow label="WhatsApp (with country code)">
                <Input
                  name="footer_whatsapp"
                  defaultValue={settings.footer_whatsapp ?? ""}
                  placeholder="+20 102 588 2766"
                />
              </FieldRow>
              <FieldRow label="Location">
                <Input
                  name="footer_location"
                  defaultValue={settings.footer_location ?? ""}
                  placeholder="Riyadh - King Abdul Aziz Rd, Al Sahafah 13321"
                />
              </FieldRow>
              <FieldRow label="Second location">
                <Input
                  name="footer_location_secondary"
                  defaultValue={settings.footer_location_secondary ?? ""}
                  placeholder="Cairo - 5Y Asmaa Fahmy, Dina Tower, Heliopolis"
                />
              </FieldRow>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {platforms.map((platform) => (
              <FieldRow key={platform} label={`${socialPlatformLabels[platform]} URL`}>
                <Input
                  name={`social_${platform}`}
                  type="url"
                  defaultValue={socialValue(settings.social_links, platform)}
                  placeholder={socialPlaceholder(platform)}
                />
              </FieldRow>
            ))}
          </div>
        </section>
      </div>

      <aside className="h-fit border border-[var(--admin-border)] bg-[var(--admin-surface-strong)] p-5 shadow-[shadow:var(--admin-shadow)]">
        <p className="sdm-eyebrow text-[var(--admin-accent)]">Notes</p>
        <div className="mt-4 space-y-4 text-[13.5px] leading-relaxed text-[var(--admin-muted)]">
          <p>Use transparent SVG or PNG logos. Keep both variants visually identical, only color changes.</p>
          <p>Social icons render through Font Awesome 6 brand icons in react-icons, matching the public footer.</p>
          <p>Favicon changes update on the client and will be picked up by browsers after cache refresh.</p>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3 border-t border-[var(--admin-border-soft)] pt-4">
          <p className="text-[12px] text-[var(--admin-subtle)]">Changes save automatically.</p>
          <SaveStatus status={status} error={errorMsg} />
        </div>

        {status === "error" ? (
          <div className="mt-4"><InlineAlert tone="danger">
            {errorMsg}
          </InlineAlert></div>
        ) : null}
      </aside>
    </form>
  );
}
