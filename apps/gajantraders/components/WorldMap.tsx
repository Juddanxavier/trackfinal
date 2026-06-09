"use client";

import { Globe, type Marker, type Arc } from "@repo/ui/ui/globe";

interface WorldMapProps {
  className?: string;
  size?: number;
  dark?: number;
  markers?: Marker[];
  arcs?: Arc[];
  markerColor?: [number, number, number];
  arcColor?: [number, number, number];
  phi?: number;
  theta?: number;
  showLabels?: boolean;
}

export function WorldMap({
  className = "",
  size = 450,
  dark = 0,
  markers,
  arcs,
  markerColor,
  arcColor,
  phi,
  theta,
  showLabels,
}: WorldMapProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Globe
        size={size}
        dark={dark}
        markers={markers}
        arcs={arcs}
        markerColor={markerColor}
        arcColor={arcColor}
        phi={phi}
        theta={theta}
        showLabels={showLabels}
      />
    </div>
  );
}
