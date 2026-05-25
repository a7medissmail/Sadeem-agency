type IcsBooking = {
  uid: string;
  start: string;
  end: string;
  summary: string;
  description: string;
  location?: string | null;
};

function stamp(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function escapeIcs(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

function fold(line: string) {
  const chunks: string[] = [];
  let current = line;
  while (current.length > 72) {
    chunks.push(current.slice(0, 72));
    current = ` ${current.slice(72)}`;
  }
  chunks.push(current);
  return chunks.join("\r\n");
}

export function createBookingIcs(input: IcsBooking) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SADEEM//Consultation Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${escapeIcs(input.uid)}@sadeem.co`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(new Date(input.start))}`,
    `DTEND:${stamp(new Date(input.end))}`,
    `SUMMARY:${escapeIcs(input.summary)}`,
    `DESCRIPTION:${escapeIcs(input.description)}`,
    `LOCATION:${escapeIcs(input.location || "Meeting details to follow")}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.map(fold).join("\r\n");
}
