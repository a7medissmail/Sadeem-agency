import { z } from "zod";

const asString = (value: unknown) => (value == null ? "" : value);

const requiredText = (label: string, max: number) =>
  z
    .preprocess(asString, z.string())
    .transform((value) => value.trim())
    .pipe(z.string().min(2, `${label} is required`).max(max, `${label} must be ${max} characters or fewer`));

const nullableText = (label: string, max: number) =>
  z
    .preprocess(asString, z.string())
    .transform((value) => value.trim())
    .pipe(z.string().max(max, `${label} must be ${max} characters or fewer`))
    .transform((value) => (value.length > 0 ? value : null));

const nullableUrl = (label: string, max = 2048) =>
  nullableText(label, max).refine(
    (value) => value === null || /^https?:\/\//i.test(value),
    `${label} must start with http:// or https://`,
  );

const sortOrderFromForm = (value: unknown) => {
  const raw = String(value ?? "").trim();
  if (!raw) return 0;
  const number = Number(raw);
  return Number.isFinite(number) ? number : raw;
};

const booleanFromForm = (value: unknown): boolean =>
  value === true || value === "on" || value === "true" || value === "1";

const socialsSchema = z
  .object({
    website: nullableUrl("Website"),
    linkedin: nullableUrl("LinkedIn"),
    x: nullableUrl("X / Twitter"),
    instagram: nullableUrl("Instagram"),
  })
  .transform((socials) => {
    const entries = Object.entries(socials).filter((entry): entry is [string, string] => Boolean(entry[1]));
    return entries.length > 0 ? Object.fromEntries(entries) : null;
  });

export const teamMemberSchema = z.object({
  name: requiredText("Name", 140),
  role: nullableText("Role", 140),
  bio: nullableText("Bio", 1400),
  photo_url: nullableUrl("Photo URL"),
  socials: socialsSchema,
  sort_order: z
    .preprocess(sortOrderFromForm, z.union([z.string(), z.number()]))
    .transform((value, ctx) => {
      const number = typeof value === "number" ? value : Number(value);
      if (!Number.isFinite(number) || !Number.isInteger(number)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Sort order must be a whole number" });
        return z.NEVER;
      }
      if (number < -10000 || number > 10000) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Sort order must be between -10000 and 10000" });
        return z.NEVER;
      }
      return number;
    }),
  is_active: z.preprocess(booleanFromForm, z.boolean()),
});

export type TeamMemberInput = z.infer<typeof teamMemberSchema>;
export type TeamFieldName = keyof TeamMemberInput | "website" | "linkedin" | "x" | "instagram";
export type TeamFieldErrors = Partial<Record<TeamFieldName, string[]>>;

const FIELD_LABELS: Record<TeamFieldName, string> = {
  name: "Name",
  role: "Role",
  bio: "Bio",
  photo_url: "Photo",
  socials: "Social links",
  sort_order: "Sort order",
  is_active: "Visibility",
  website: "Website",
  linkedin: "LinkedIn",
  x: "X / Twitter",
  instagram: "Instagram",
};

function fieldFromIssue(path: PropertyKey[]): TeamFieldName | null {
  if (path[0] === "socials" && typeof path[1] === "string" && path[1] in FIELD_LABELS) {
    return path[1] as TeamFieldName;
  }
  if (typeof path[0] === "string" && path[0] in FIELD_LABELS) return path[0] as TeamFieldName;
  return null;
}

export function formatTeamValidationError(error: z.ZodError): {
  error: string;
  fieldErrors: TeamFieldErrors;
} {
  const fieldErrors: TeamFieldErrors = {};

  for (const issue of error.issues) {
    const field = fieldFromIssue(issue.path);
    if (!field) continue;
    fieldErrors[field] = [...(fieldErrors[field] ?? []), issue.message];
  }

  const firstIssue = error.issues[0];
  const firstField = firstIssue ? fieldFromIssue(firstIssue.path) : null;
  const detail = firstIssue?.message;

  return {
    error: detail ? `${firstField ? `${FIELD_LABELS[firstField]}: ` : ""}${detail}` : "Please check the highlighted fields.",
    fieldErrors,
  };
}
