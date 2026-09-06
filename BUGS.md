# Open bugs / needs review

Reported 2026-09-06 from a live pass over the admin. **Nothing here is fixed yet** —
each entry is diagnosed down to the line so the fix is a small, contained change.

Status legend: `BUG` = confirmed defect · `NEEDS REVIEW` = behaviour is undefined,
we have to decide what it should do first.

---

## 1. BUG — editing a published service silently flips it back to draft

**Symptom:** open a published service, change anything (title, sort order, a
deliverable), hit Save changes — the service comes back as draft. You have to
re-open it and toggle Published on again as a second step.

**Where:** [ServiceForm.tsx:226-246](app/admin/(authed)/services/ServiceForm.tsx:226) +
[services/actions.ts:43](app/admin/(authed)/services/actions.ts:43)

**Why:** the publish control is the "hidden false + checkbox true" pair:

```
<input type="hidden" name="is_published" value="false" />
<input type="checkbox" name="is_published" value="true" defaultChecked={...} onChange={disable the hidden one} />
```

The hidden input is only disabled inside the checkbox's `onChange`. On a service
that is already published the box renders checked and the user never touches it,
so `onChange` never fires, the hidden `false` stays enabled, and the form posts
**both** values in DOM order: `["false", "true"]`. The action reads
`formData.get("is_published") === "true"` — and `.get()` returns the *first*
entry, i.e. `"false"`. Every save of an untouched published service unpublishes it.

It only "works" when you toggle the box off and on again, which is exactly the
workaround being used.

**Fix direction:** read the last/any value instead of the first —
`formData.getAll("is_published").includes("true")` — and drop the `onChange`
hack, or set the hidden input's `disabled` from `defaultChecked` at mount.

**Blast radius:** this hidden+checkbox pattern is unique to `ServiceForm`; the
other admin toggles (team, courses, clients, success stories) post an explicit
`next` value and are not affected.

---

## 2. BUG — Kanban optimistic state is never cleared, so later stage changes appear to do nothing

**Symptom:** "Save stage" in the candidate dossier looks broken — the header
metric and the board keep showing the old stage after saving.

**Where:** [ApplicationsBoard.tsx:526](app/admin/(authed)/applications/ApplicationsBoard.tsx:526),
[:535](app/admin/(authed)/applications/ApplicationsBoard.tsx:535),
[:614-628](app/admin/(authed)/applications/ApplicationsBoard.tsx:614)

**Why:** dragging a card writes `optimistic[id] = newStatus` and the entry is
only deleted on *failure*. On success it stays in state for the lifetime of the
page, and every render does `optimistic[a.id] ?? a.status` — the stale override
wins over fresh server data forever. So after any drag, a stage saved through the
form (or by anyone else) is masked in the UI even though the DB row did change.
A hard reload shows the correct stage, which is why it reads as "sometimes works".

**Fix direction:** clear the id from `optimistic` after `router.refresh()`
resolves (or move to `useOptimistic`, which unwinds itself on transition end).

### 2b. Same screen, two smaller issues found while reading it

- **The stage note is dropped when the stage doesn't change.**
  [applications/actions.ts:41-49](app/admin/(authed)/applications/actions.ts:41) —
  the note is only written as part of a `application_status_history` row, and that
  insert is guarded by `application.status !== status`. Typing a note and saving
  without moving the stage silently discards it. NEEDS REVIEW: should a
  same-stage note land in `application_notes` instead, or should the field be
  disabled when the stage is unchanged?
- **The drawer is not keyed by candidate.**
  [ApplicationsBoard.tsx:455](app/admin/(authed)/applications/ApplicationsBoard.tsx:455) +
  [:721](app/admin/(authed)/applications/ApplicationsBoard.tsx:721) — `<Select
  defaultValue={application.status}>` is uncontrolled. Opening candidate A, then
  clicking candidate B without closing the drawer reuses the same DOM node, so the
  select keeps A's stage. Saving from there can write the wrong stage to B. Fix:
  `key={application.id}` on the drawer (or on the form).

---

## 3. NEEDS REVIEW — empty line items are saved and sent to the client as "SAR 0"

**Symptom:** a quotation went out with a third row (`test 3`) that had no price.
The client portal renders it as a real line at `SAR 0`.

**Where:** [QuotationBuilder.tsx:273-280](app/admin/(authed)/proposals/QuotationBuilder.tsx:273) +
[quotation-actions.ts:85](app/admin/(authed)/proposals/quotation-actions.ts:85)

**Why:** the builder maps *every* draft row into the payload —
`parseFloat(item.unit_price) || 0` turns an empty price into `0` and an empty
name into `""` — with no filter for blank rows. The server only validates
`items.length === 0`; individual items are never checked. The name placeholder
says `Service name *` but nothing enforces it. The builder shows an unpriced row
as `—`, while the client portal shows `SAR 0`, so the sender cannot even see what
the client will see.

**This is not deliberate** — there is no "free / included" concept anywhere in
the schema or the portal renderer. A zero line today is indistinguishable from a
forgotten one.

**Decision needed before fixing:**
1. Drop blank rows silently on save (row with no name **and** no price), **and**
2. block save/send when a row has a name but no price — or the reverse; then
3. if we *do* want free items, make it explicit: render `Included` instead of
   `SAR 0` on the portal and require the intent to be set, not inferred from an
   empty field.

Also worth deciding in the same pass: `sendQuotationAction` performs no
validation of its own, so anything that reached `draft` can be sent as-is.
