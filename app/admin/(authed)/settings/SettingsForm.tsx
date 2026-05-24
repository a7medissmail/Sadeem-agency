"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/admin/ui/Button";
import { FieldRow, Input, Textarea } from "@/components/admin/ui/Field";
import type { Database, Json } from "@/types/database";
import { socialPlatformLabels } from "@/lib/validation/siteSettings";
import type { SocialPlatform } from "@/lib/site/settings";
import { updateSiteSettingsAction, type SiteSettingsState } from "./actions";

const initial: SiteSettingsState = {};
const platforms = Object.keys(socialPlatformLabels) as SocialPlatform[];

type SettingsRow = Database["public"]["Tables"]["site_settings"]["Row"];

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="text-[12.5px] leading-snug text-red-300">{messages[0]}</p>;
}

function SaveButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save settings"}</Button>;
}

function socialValue(socials: Json | null | undefined, platform: SocialPlatform) {
  if (!socials || typeof socials !== "object" || Array.isArray(socials)) return "";
  const value = socials[platform];
  return typeof value === "string" ? value : "";
}

function PreviewLogo({ url, tone }: { url: string | null; tone: "dark" | "light" }) {
  if (!url) return null;
  return (
    <div className={tone === "dark" ? "border border-white/10 bg-white p-4" : "border border-white/10 bg-black p-4"}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="" className="h-8 w-auto max-w-[180px] object-contain" />
    </div>
  );
}

export default function SettingsForm({ settings }: { settings: SettingsRow }) {
  const [state, formAction] = useFormState(updateSiteSettingsAction, initial);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} encType="multipart/form-data" className="grid gap-8 xl:grid-cols-[1fr_0.9fr]">
      <div className="flex flex-col gap-6">
        <section className="border border-white/10 bg-white/[0.025] p-5">
          <div className="mb-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#ff6a00]">Brand</p>
            <h2 className="mt-2 text-xl font-semibold">Logo and favicon</h2>
            <p className="mt-1 text-[13px] text-white/45">
              Dark logo is for light nav. White logo is for dark nav and footer.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FieldRow label="Dark logo URL">
              <Input name="logo_dark_url" type="url" defaultValue={settings.logo_dark_url ?? ""} />
              <FieldError messages={errors.logo_dark_url} />
            </FieldRow>
            <FieldRow label="Upload dark logo">
              <Input name="logo_dark_file" type="file" accept="image/svg+xml,image/png,image/jpeg,image/webp" />
            </FieldRow>
            <PreviewLogo url={settings.logo_dark_url} tone="dark" />
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <FieldRow label="White logo URL">
              <Input name="logo_light_url" type="url" defaultValue={settings.logo_light_url ?? ""} />
              <FieldError messages={errors.logo_light_url} />
            </FieldRow>
            <FieldRow label="Upload white logo">
              <Input name="logo_light_file" type="file" accept="image/svg+xml,image/png,image/jpeg,image/webp" />
            </FieldRow>
            <PreviewLogo url={settings.logo_light_url} tone="light" />
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <FieldRow label="Favicon URL">
              <Input name="favicon_url" type="url" defaultValue={settings.favicon_url ?? ""} />
              <FieldError messages={errors.favicon_url} />
            </FieldRow>
            <FieldRow label="Upload favicon">
              <Input name="favicon_file" type="file" accept="image/svg+xml,image/png,image/x-icon" />
            </FieldRow>
          </div>
        </section>

        <section className="border border-white/10 bg-white/[0.025] p-5">
          <div className="mb-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#ff6a00]">Footer</p>
            <h2 className="mt-2 text-xl font-semibold">Contact and social links</h2>
          </div>

          <div className="grid gap-4">
            <FieldRow label="Footer description">
              <Textarea name="footer_description" rows={4} defaultValue={settings.footer_description} />
              <FieldError messages={errors.footer_description} />
            </FieldRow>
            <div className="grid gap-4 md:grid-cols-3">
              <FieldRow label="Email">
                <Input name="footer_email" type="email" defaultValue={settings.footer_email} />
                <FieldError messages={errors.footer_email} />
              </FieldRow>
              <FieldRow label="Phone">
                <Input name="footer_phone" defaultValue={settings.footer_phone ?? ""} />
                <FieldError messages={errors.footer_phone} />
              </FieldRow>
              <FieldRow label="Location">
                <Input name="footer_location" defaultValue={settings.footer_location ?? ""} />
                <FieldError messages={errors.footer_location} />
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
                  placeholder={`https://${platform === "x" ? "x.com" : `${platform}.com`}/sadeem`}
                />
                <FieldError messages={errors[`social_links.${platform}`]} />
              </FieldRow>
            ))}
          </div>
        </section>
      </div>

      <aside className="h-fit border border-white/10 bg-[#0a0b0d] p-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#ff6a00]">Notes</p>
        <div className="mt-4 space-y-4 text-[13.5px] leading-relaxed text-white/55">
          <p>Use transparent SVG or PNG logos. Keep both variants visually identical, only color changes.</p>
          <p>Social icons render through react-icons/fa6 so we can add more platforms without custom SVG work.</p>
          <p>Favicon changes update on the client and will be picked up by browsers after cache refresh.</p>
        </div>

        {state.error ? (
          <div className="mt-5 border border-red-400/25 bg-red-500/[0.08] px-4 py-3 text-[13px] text-red-200">
            {state.error}
          </div>
        ) : null}
        {state.ok ? (
          <div className="mt-5 border border-emerald-400/25 bg-emerald-500/[0.08] px-4 py-3 text-[13px] text-emerald-200">
            Settings saved.
          </div>
        ) : null}

        <div className="mt-6">
          <SaveButton />
        </div>
      </aside>
    </form>
  );
}
