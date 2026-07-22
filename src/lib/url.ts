/**
 * Sanitise a user-supplied or DB-stored URL before using it as a link href.
 * Returns a safe http(s) URL, or undefined for anything unsafe (e.g. a
 * `javascript:` / `data:` scheme) so the link renders inert instead of
 * executing script.
 */
export function safeExternalHref(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;

  // Already an http(s) URL — use as-is.
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  // Some other explicit scheme (javascript:, data:, vbscript:, mailto:, …) — reject.
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return undefined;

  // No scheme → treat as a bare domain/path and force https.
  return `https://${trimmed}`;
}
