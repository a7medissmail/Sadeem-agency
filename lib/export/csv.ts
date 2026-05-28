/**
 * Minimal, RFC 4180-compliant CSV serializer.
 * All values are stringified; nulls/undefineds become empty strings.
 * Fields containing commas, double-quotes, or newlines are quoted.
 */

export function escCsv(v: unknown): string {
  if (v == null) return "";
  const s = String(v).replace(/\r\n|\r/g, "\n"); // normalize line endings
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const keys = Object.keys(rows[0]);
  const lines = [
    keys.join(","),
    ...rows.map((row) => keys.map((k) => escCsv(row[k])).join(",")),
  ];
  return lines.join("\n");
}

export function csvResponse(csv: string, filename: string): Response {
  // Prepend UTF-8 BOM so Excel auto-detects encoding
  const bom = "﻿";
  return new Response(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
