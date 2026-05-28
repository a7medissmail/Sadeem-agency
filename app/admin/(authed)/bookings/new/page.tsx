import Link from "next/link";
import { Button } from "@/components/admin/ui/Button";
import { FieldRow, Input, Select, Textarea } from "@/components/admin/ui/Field";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { requireRole } from "@/lib/auth";
import { createBookingAction } from "../actions";

export const metadata = { title: "New Booking - SADEEM Admin" };

// Tomorrow at 10:00 Riyadh time — sensible default for the datetime-local input
function defaultSlotLocal() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yyyy = tomorrow.getFullYear();
  const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
  const dd = String(tomorrow.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T10:00`;
}

export default async function NewBookingPage() {
  await requireRole(["admin", "editor"]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="CONSULTATION"
        title="New booking"
        description="Manually register a consultation booked via call, referral, or direct arrangement."
        actions={
          <Link href="/admin/bookings">
            <Button variant="ghost" size="sm">← Back</Button>
          </Link>
        }
      />

      <form action={createBookingAction} className="border border-[var(--admin-border)] bg-[var(--admin-panel)] p-5 max-w-2xl">
        <div className="mb-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--admin-accent)]">Manual entry</p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--admin-text)]">Booking details</h2>
          <p className="mt-1 text-[13px] text-[var(--admin-muted)]">
            Date and time are entered as <strong className="text-[var(--admin-text)]">Riyadh time</strong> (UTC+3). The booking appears in the board immediately.
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

          <FieldRow label="Phone">
            <Input name="phone" type="tel" placeholder="+966 50 000 0000" autoComplete="off" />
          </FieldRow>

          <div className="grid gap-4 md:grid-cols-2">
            <FieldRow label="Date & time (Riyadh) *">
              <Input
                name="slot_start_local"
                type="datetime-local"
                required
                defaultValue={defaultSlotLocal()}
              />
            </FieldRow>
            <FieldRow label="Duration (minutes)">
              <Select name="duration_minutes" defaultValue="45">
                <option value="30">30 min</option>
                <option value="45">45 min</option>
                <option value="60">60 min</option>
                <option value="90">90 min</option>
              </Select>
            </FieldRow>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FieldRow label="Status">
              <Select name="status" defaultValue="scheduled">
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no_show">No show</option>
              </Select>
            </FieldRow>
            <FieldRow label="Meet link">
              <Input name="meet_link" type="url" placeholder="https://meet.google.com/..." />
            </FieldRow>
          </div>

          <FieldRow label="Topic / agenda *">
            <Textarea
              name="topic"
              required
              rows={5}
              placeholder="What will the consultation cover? What decision or challenge does the client want to address?"
            />
          </FieldRow>

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit">Create booking</Button>
            <Link href="/admin/bookings">
              <Button variant="ghost" size="sm">Cancel</Button>
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
