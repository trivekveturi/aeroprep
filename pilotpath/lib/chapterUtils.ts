/**
 * Chapter display name utilities — safe to import in client components.
 * No server-side dependencies (no mysql2, no fs).
 */

/**
 * Convert a raw quiz slug to a human-readable chapter display name.
 * Raw: "dgca-met-01-dgca-met-01-atmosphere"  → "Atmosphere"
 * Raw: "new-syllabusdgca-rtr-1-radio-propagation" → "Radio Propagation"
 * Raw: "dgca-bali-air-navigation-sample-paper-05"  → "Air Navigation Sample Paper 05"
 */
export function cleanChapterDisplay(raw: string): string {
  const tokens = raw
    .replace(/^new-syllabus/i, '')
    .split('-')
    .map(t => t.trim())
    .filter(Boolean);

  const meaningful = tokens.filter(t => {
    if (/^\d+$/.test(t)) return false;               // pure number "01"
    if (/^[a-z]{1,5}\d+$/i.test(t)) return false;   // code "met01"
    if (/^dgca$/i.test(t)) return false;             // word "dgca"
    if (/^bali$/i.test(t)) return false;             // word "bali" (source prefix)
    if (t.length <= 2) return false;                 // very short
    return true;
  });

  const source = meaningful.length > 0 ? meaningful : tokens;

  // De-duplicate repeated tokens while preserving order
  const seen = new Set<string>();
  const deduped = source.filter(t => {
    const lower = t.toLowerCase();
    if (seen.has(lower)) return false;
    seen.add(lower);
    return true;
  });

  return deduped
    .map(t => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase())
    .join(' ');
}
