/**
 * Turning stored contact strings into hrefs.
 *
 * The admin stores numbers the way a person reads them — "+20 2 2414 4266" —
 * because that is what belongs on the page. A dialable href needs the same
 * number with the punctuation stripped, and wa.me needs bare digits with no
 * leading plus. Both derive from the display string, so an editor never has to
 * keep a second, machine-shaped copy in sync.
 *
 * Each returns null when the input could not be a real number, which is the
 * signal to render plain text rather than a link that goes nowhere.
 */

/** Shortest plausible national number; below this it is a typo, not a phone. */
const MIN_DIGITS = 7;

export function telHref(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < MIN_DIGITS) return null;
  // Keep a leading + so international numbers dial correctly from abroad.
  return `tel:${trimmed.startsWith("+") ? `+${digits}` : digits}`;
}

export function whatsappHref(raw: string | null | undefined): string | null {
  if (!raw) return null;
  // wa.me wants country code + number, digits only, no plus and no spaces.
  const digits = raw.replace(/\D/g, "");
  if (digits.length < MIN_DIGITS + 1) return null; // must carry a country code

  // A leading zero is a national trunk prefix — "01025882766" dials fine inside
  // Egypt but wa.me reads it as a country code and opens an empty chat. We
  // cannot guess which country to prepend, so this renders as plain text and
  // the editor sees the number is not linked. A silently wrong link would send
  // every WhatsApp lead nowhere.
  if (digits.startsWith("0")) return null;

  return `https://wa.me/${digits}`;
}
