import { useEffect, useState, ImgHTMLAttributes } from 'react';
import { getGarmentImageUrl } from '@/lib/garment-images';

interface SignedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string;
  expiresIn?: number;
}

/**
 * Renders an <img> sourced from a private storage path or legacy public URL,
 * resolving to a fresh signed URL on mount.
 */
const SignedImage = ({ src, expiresIn = 3600, ...rest }: SignedImageProps) => {
  const [url, setUrl] = useState<string | undefined>();

  useEffect(() => {
    let cancelled = false;
    getGarmentImageUrl(src, expiresIn).then(u => { if (!cancelled) setUrl(u); });
    return () => { cancelled = true; };
  }, [src, expiresIn]);

  if (!url) return <div {...(rest as any)} aria-hidden />;
  return <img src={url} {...rest} />;
};

export default SignedImage;
