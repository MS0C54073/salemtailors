/**
 * Hardened client-side image validation for uploads.
 *
 * Checks performed:
 *  1. MIME allow-list (declared content type)
 *  2. File size limit
 *  3. File-extension allow-list (sanitised)
 *  4. Magic-byte (file signature) sniffing — prevents renamed executables / SVG-XSS
 *  5. Decodes via Image() to confirm it is a real, non-corrupt raster image
 *  6. Max pixel dimensions (defends against decompression-bomb DoS)
 *
 * Note on "virus / malware scanning": real AV scanning cannot run safely in the
 * browser. The checks above eliminate the most common attack vectors for an
 * image upload pipeline (polyglot files, SVG with embedded scripts, oversized
 * decompression bombs, executables masquerading as images). For full AV
 * scanning, route uploads through an edge function that calls a scanning
 * service (e.g. ClamAV, VirusTotal) before persisting — see scanUploadedFile()
 * below for the hook point.
 */

export const ALLOWED_IMAGE_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
] as const;

export const ALLOWED_IMAGE_EXT = [
  'jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif',
] as const;

export const DEFAULT_MAX_BYTES = 10 * 1024 * 1024; // 10 MB
export const DEFAULT_MAX_PIXELS = 8000;            // per side

export type ValidatedFile = {
  file: File;
  ext: string;
  mime: string;
};

export class ImageValidationError extends Error {}

/** Read the first N bytes of a File as a Uint8Array. */
async function readHead(file: File, n = 16): Promise<Uint8Array> {
  const buf = await file.slice(0, n).arrayBuffer();
  return new Uint8Array(buf);
}

/** Detect a real image format from magic bytes. Returns null if unknown. */
function sniffImageMime(bytes: Uint8Array): string | null {
  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png';
  // GIF: 47 49 46 38
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) return 'image/gif';
  // WEBP: "RIFF"...."WEBP"
  if (
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) return 'image/webp';
  // HEIC/HEIF: "....ftypheic" / "ftypheix" / "ftypmif1" / "ftypheim" / "ftypheis" / "ftyphevc"
  if (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) {
    const brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
    if (['heic', 'heix', 'heim', 'heis', 'hevc', 'mif1', 'msf1', 'heif'].includes(brand)) {
      return 'image/heic';
    }
  }
  return null;
}

/** Confirm the file decodes as a real image and is within pixel limits. */
function probeDecode(file: File, maxPixels: number): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    const cleanup = () => URL.revokeObjectURL(url);
    img.onload = () => {
      cleanup();
      if (img.naturalWidth > maxPixels || img.naturalHeight > maxPixels) {
        reject(new ImageValidationError(
          `Image dimensions exceed ${maxPixels}px (got ${img.naturalWidth}x${img.naturalHeight})`,
        ));
        return;
      }
      if (img.naturalWidth === 0 || img.naturalHeight === 0) {
        reject(new ImageValidationError('Image could not be decoded'));
        return;
      }
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      cleanup();
      reject(new ImageValidationError('File is not a valid image'));
    };
    img.src = url;
  });
}

export type ValidateOptions = {
  maxBytes?: number;
  maxPixels?: number;
  allowHeic?: boolean; // HEIC can't be decoded by <img> in most browsers
};

/**
 * Validate an image upload. Throws ImageValidationError on rejection.
 * Returns the normalised extension and sniffed MIME on success.
 */
export async function validateImageFile(
  file: File,
  opts: ValidateOptions = {},
): Promise<ValidatedFile> {
  const maxBytes = opts.maxBytes ?? DEFAULT_MAX_BYTES;
  const maxPixels = opts.maxPixels ?? DEFAULT_MAX_PIXELS;

  // 1. Declared MIME allow-list
  if (!file.type || !(ALLOWED_IMAGE_MIME as readonly string[]).includes(file.type)) {
    throw new ImageValidationError(
      `Unsupported file type "${file.type || 'unknown'}". Allowed: JPG, PNG, WEBP, GIF, HEIC.`,
    );
  }

  // 2. Size
  if (file.size === 0) throw new ImageValidationError('File is empty');
  if (file.size > maxBytes) {
    throw new ImageValidationError(
      `File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max ${(maxBytes / 1024 / 1024).toFixed(0)}MB.`,
    );
  }

  // 3. Extension allow-list
  const rawExt = (file.name.split('.').pop() || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!(ALLOWED_IMAGE_EXT as readonly string[]).includes(rawExt)) {
    throw new ImageValidationError(`Unsupported file extension ".${rawExt}".`);
  }

  // 4. Magic-byte sniffing — rejects renamed executables, SVG, PDF, etc.
  const head = await readHead(file, 16);
  const sniffed = sniffImageMime(head);
  if (!sniffed) {
    throw new ImageValidationError('File contents do not match a known image format.');
  }
  // Catch declared/actual mismatch (e.g. .png renamed to .jpg)
  const declared = file.type === 'image/heif' ? 'image/heic' : file.type;
  if (sniffed !== declared) {
    throw new ImageValidationError(
      `File contents (${sniffed}) do not match declared type (${file.type}).`,
    );
  }

  // 5. Decode probe (skipped for HEIC — browsers can't decode it)
  if (sniffed !== 'image/heic' || opts.allowHeic === false) {
    if (sniffed !== 'image/heic') {
      await probeDecode(file, maxPixels);
    }
  }

  return { file, ext: rawExt, mime: sniffed };
}

/**
 * Hook for server-side malware scanning. Currently a no-op on the client;
 * wire this to an edge function (ClamAV / VirusTotal) when available.
 */
export async function scanUploadedFile(_storagePath: string, _bucket: string): Promise<void> {
  // Intentionally empty — replace with edge-function invocation when AV is wired up.
}

/** Generate a safe random storage filename, ignoring the user-supplied name. */
export function safeStorageName(ext: string): string {
  const safeExt = ext.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5) || 'jpg';
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${safeExt}`;
}
