/**
 * Downscale a large phone photo to a web-friendly JPEG before upload.
 * Zero dependencies — uses the browser canvas API.
 *
 * Salem Tailors operates on low-bandwidth Lusaka connections; a 12MB
 * unmodified phone photo routinely times out during upload. We cap
 * the longest edge at 1600px and re-encode at ~0.82 quality.
 */
export async function compressImage(
  file: File,
  { maxEdge = 1600, quality = 0.82, skipUnderBytes = 400 * 1024 } = {},
): Promise<File> {
  if (!file.type.startsWith('image/')) return file;
  if (file.size <= skipUnderBytes) return file;
  // Some formats (HEIC, AVIF) may not decode in-browser; fall back to original.
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();
    const blob: Blob | null = await new Promise(res =>
      canvas.toBlob(res, 'image/jpeg', quality),
    );
    if (!blob || blob.size >= file.size) return file;
    const base = file.name.replace(/\.[^.]+$/, '');
    return new File([blob], `${base}.jpg`, { type: 'image/jpeg' });
  } catch {
    return file;
  }
}
