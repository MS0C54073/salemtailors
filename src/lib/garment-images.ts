import { supabase } from '@/integrations/supabase/client';

const BUCKET = 'garment-images';
const PUBLIC_MARKER = `/storage/v1/object/public/${BUCKET}/`;
const SIGN_MARKER = `/storage/v1/object/sign/${BUCKET}/`;

/**
 * Extract the storage path from a stored value which may be either a bare path
 * (new format) or a legacy public URL (old format).
 */
export function getGarmentImagePath(stored: string): string | null {
  if (!stored) return null;
  if (stored.includes(PUBLIC_MARKER)) {
    return decodeURIComponent(stored.split(PUBLIC_MARKER)[1].split('?')[0]);
  }
  if (stored.includes(SIGN_MARKER)) {
    return decodeURIComponent(stored.split(SIGN_MARKER)[1].split('?')[0]);
  }
  if (/^https?:\/\//i.test(stored)) return null; // external URL — leave alone
  return stored;
}

/** Create a signed URL for a stored garment-image path or legacy public URL. */
export async function getGarmentImageUrl(stored: string, expiresIn = 3600): Promise<string> {
  const path = getGarmentImagePath(stored);
  if (!path) return stored;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, expiresIn);
  if (error || !data) return stored;
  return data.signedUrl;
}
