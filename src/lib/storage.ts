import { createClient } from '@/lib/supabase/client';

// Private buckets holding sensitive student media (CV, video pitch).
export const PRIVATE_BUCKETS = {
  video: 'video-pitches',
  cv: 'student-docs',
} as const;

export type PrivateMediaKind = keyof typeof PRIVATE_BUCKETS;

/**
 * Resolve a stored media reference into a URL usable in the browser.
 *
 * New uploads store the object PATH inside a private bucket; access is granted
 * by storage RLS and served via a short-lived signed URL. Legacy rows still
 * hold full public URLs (from before the buckets were made private) — those are
 * returned unchanged so existing media keeps rendering.
 */
export async function resolveMediaUrl(
  ref: string | null | undefined,
  kind: PrivateMediaKind
): Promise<string | null> {
  if (!ref) return null;
  if (/^https?:\/\//.test(ref)) return ref; // legacy public URL

  const supabase = createClient();
  const { data } = await supabase.storage
    .from(PRIVATE_BUCKETS[kind])
    .createSignedUrl(ref, 3600);
  return data?.signedUrl ?? null;
}
