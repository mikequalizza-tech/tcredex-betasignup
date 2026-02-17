'use client';

import Image from 'next/image';
import { useState } from 'react';

interface SafeImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
  hideOnError?: boolean;
}

/**
 * Client component wrapper for Next.js Image that handles errors gracefully
 * Use this in server components where you can't pass event handlers directly
 */
export function SafeImage({ 
  src, 
  alt, 
  width, 
  height, 
  className, 
  priority,
  hideOnError = true 
}: SafeImageProps) {
  const [imageError, setImageError] = useState(false);
  const [_imageLoaded, setImageLoaded] = useState(false);

  if (imageError && hideOnError) {
    return null;
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
      onError={() => setImageError(true)}
      onLoad={() => setImageLoaded(true)}
    />
  );
}
