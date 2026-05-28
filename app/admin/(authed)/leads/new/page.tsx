import Link from "next/link";
import { Button } from "@/components/admin/ui/Button";
import { FieldRow, Input, Select, Textarea } from "@/components/admin/ui/Field";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { requireRole } from "@/lib/auth";
import { createLeadAction } from "../actions";

export const metadata = { title: "New Lead - SADEEM Admin" };

export default async function NewLeadPage() {
  await requireRole(["admin", "editor"]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="CRM"
        title="New lead"
        description="Manually add a contact that came through a call, event, or referral."
        actions={
          <Link href="/admin/leads">
            <Button variant="ghost" size="sm">← Back</Button>
          </Link>
        }
      />

      <form action={createLeadAction} className="border border-[var(--admin-border)] bg-[var(--admin-panel)] p-5 max-w-2xl">
        <div className="mb-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--admin-accent)]">Contact</p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--admin-text)]">Lead details</h2>
          <p className="mt-1 text-[13px] text-[var(--admin-muted)]">
            All fields except name and email are optional. The lead will appear in the board immediately.
          </p>
        </div>

        <div className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <FieldRow label="Name *">
              <Input name="name" required placeholder="Khalid Al-Rashid" autoComplete="off" />
            </FieldRow>
            <FieldRow label="Email *">
              <Input name="email" type="email" required placeholder="khalid@company.com" autoComplete="off" />
            </FieldRow>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FieldRow label="Phone">
              <Input name="phone" type="tel" placeholder="+966 50 000 0000" autoComplete="off" />
            </FieldRow>
            <FieldRow label="Company">
              <Input name="company" placeholder="Acme Corp" autoComplete="off" />
            </FieldRow>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FieldRow label="Source">
              <Select name="source" defaultValue="other">
                <option value="homepage">Homepage</option>
                <option value="course">Course</option>
                <option value="consultation">Consultation</option>
                <option value="other">Other / Manual</option>
              </Select>
            </FieldRow>
            <FieldRow label="Status">
              <Select name="status" defaultValue="new">
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
              </Select>
            </FieldRow>
          </div>

          <FieldRow label="Notes">
            <Textarea
              name="message"
              rows={5}
              placeholder="How did they reach out? What are they looking for?"
            />
          </FieldRow>

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit">Add lead</Button>
            <Link href="/admin/leads">
              <Button variant="ghost" size="sm">Cancel</Button>
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
