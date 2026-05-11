'use client';

import { Globe } from '@repo/ui/ui/globe';

interface WorldMapProps {
  className?: string;
  size?: number;
}

export function WorldMap({ className = '', size = 450 }: WorldMapProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Globe size={size} />
    </div>
  );
}
