"use client";

import { useEffect, useRef } from "react";
import createGlobe from "cobe";

export interface Marker {
  id: string;
  location: [number, number];
  label?: string;
}

export interface Arc {
  id: string;
  from: [number, number];
  to: [number, number];
}

interface GlobeProps {
  className?: string;
  size?: number;
  showLabels?: boolean;
  dark?: number;
  markers?: Marker[];
  arcs?: Arc[];
  markerColor?: [number, number, number];
  arcColor?: [number, number, number];
  phi?: number;
  theta?: number;
}

const defaultMarkers: Marker[] = [
  { id: "nyc", location: [40.71, -74.01], label: "New York" },
  { id: "london", location: [51.5, -0.12], label: "London" },
  { id: "dubai", location: [25.2, 55.27], label: "Dubai" },
  { id: "singapore", location: [1.35, 103.8], label: "Singapore" },
  { id: "tokyo", location: [35.68, 139.65], label: "Tokyo" },
  { id: "sydney", location: [-33.86, 151.2], label: "Sydney" },
  { id: "saopaulo", location: [-23.55, -46.63], label: "São Paulo" },
  { id: "losangeles", location: [34.05, -118.24], label: "Los Angeles" },
  { id: "hongkong", location: [22.31, 114.16], label: "Hong Kong" },
  { id: "frankfurt", location: [50.11, 8.68], label: "Frankfurt" },
  { id: "mumbai", location: [19.07, 72.87], label: "Mumbai" },
  { id: "chennai", location: [13.08, 80.27], label: "Chennai" },
  { id: "johannesburg", location: [-26.2, 28.04], label: "Johannesburg" },
];

const defaultArcs: Arc[] = [
  { id: "arc1", from: [40.71, -74.01], to: [51.5, -0.12] },
  { id: "arc2", from: [34.05, -118.24], to: [35.68, 139.65] },
  { id: "arc3", from: [13.08, 80.27], to: [1.35, 103.8] },
  { id: "arc4", from: [13.08, 80.27], to: [35.68, 139.65] },
  { id: "arc5", from: [13.08, 80.27], to: [25.2, 55.27] },
  { id: "arc6", from: [13.08, 80.27], to: [19.07, 72.87] },
  { id: "arc7", from: [51.5, -0.12], to: [-26.2, 28.04] },
  { id: "arc8", from: [40.71, -74.01], to: [-23.55, -46.63] },
];

export function Globe({
  className = "",
  size = 500,
  showLabels = true,
  dark = 0,
  markers,
  arcs,
  markerColor = [0.2, 0.4, 1],
  arcColor = [0.3, 0.5, 1],
  phi: initialPhi = 0,
  theta = 0.2,
}: GlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phiRef = useRef(initialPhi);
  const isDraggingRef = useRef(false);
  const lastMouseXRef = useRef(0);
  const velocityRef = useRef(0);

  const activeMarkers = markers ?? defaultMarkers;
  const activeArcs = arcs ?? defaultArcs;

  useEffect(() => {
    let globe: ReturnType<typeof createGlobe> | null = null;
    let animationId: number;
    const canvas = canvasRef.current;

    if (canvas) {
      const isDark = dark === 1;
      globe = createGlobe(canvas, {
        devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
        width: size * 2,
        height: size * 2,
        phi: initialPhi,
        theta,
        dark,
        diffuse: 1.2,
        mapSamples: 16000,
        mapBrightness: isDark ? 2 : 6,
        baseColor: isDark
          ? ([0.15, 0.15, 0.2] as [number, number, number])
          : ([1, 1, 1] as [number, number, number]),
        markerColor: markerColor,
        glowColor: isDark
          ? ([0.15, 0.15, 0.2] as [number, number, number])
          : ([1, 1, 1] as [number, number, number]),
        scale: 1,
        markers: activeMarkers.map((m) => ({
          location: m.location,
          size: 0.04,
          id: m.id,
        })),
        arcs: activeArcs.map((a) => ({
          from: a.from,
          to: a.to,
          id: a.id,
        })),
        arcColor: arcColor,
        arcWidth: 0.4,
        arcHeight: 0.25,
      });

      const handleMouseDown = (e: MouseEvent | TouchEvent) => {
        isDraggingRef.current = true;
        const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
        lastMouseXRef.current = clientX;
        velocityRef.current = 0;
      };

      const handleMouseMove = (e: MouseEvent | TouchEvent) => {
        if (!isDraggingRef.current) return;
        const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
        const delta = clientX - lastMouseXRef.current;
        velocityRef.current = delta * 0.005;
        phiRef.current += velocityRef.current;
        lastMouseXRef.current = clientX;
        globe?.update({ phi: phiRef.current });
      };

      const handleMouseUp = () => {
        isDraggingRef.current = false;
      };

      canvas.addEventListener("mousedown", handleMouseDown);
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);

      canvas.addEventListener("touchstart", handleMouseDown, { passive: true });
      window.addEventListener("touchmove", handleMouseMove, { passive: true });
      window.addEventListener("touchend", handleMouseUp);

      const animate = () => {
        if (!isDraggingRef.current) {
          if (Math.abs(velocityRef.current) > 0.001) {
            velocityRef.current *= 0.95;
            phiRef.current += velocityRef.current;
          } else {
            phiRef.current += 0.002;
          }
          globe?.update({ phi: phiRef.current });
        }
        animationId = requestAnimationFrame(animate);
      };
      animate();

      return () => {
        cancelAnimationFrame(animationId);
        canvas.removeEventListener("mousedown", handleMouseDown);
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
        canvas.removeEventListener("touchstart", handleMouseDown);
        window.removeEventListener("touchmove", handleMouseMove);
        window.removeEventListener("touchend", handleMouseUp);
      };
    }
  }, [
    size,
    dark,
    initialPhi,
    theta,
    markerColor,
    arcColor,
    activeMarkers,
    activeArcs,
  ]);

  return (
    <div
      className={`relative ${className}`}
      style={{ width: size, height: size }}
    >
      <canvas
        ref={canvasRef}
        className="block cursor-grab active:cursor-grabbing"
        style={{
          width: size,
          height: size,
        }}
      />

      {showLabels && (
        <>
          {activeMarkers
            .filter((m) => m.label)
            .map((marker) => (
              <div
                key={marker.id}
                className="absolute pointer-events-none"
                style={
                  {
                    positionAnchor: `--cobe-${marker.id}`,
                    bottom: "anchor(top)",
                    left: "anchor(center)",
                    translate: "-50% 0",
                    marginBottom: "8px",
                    padding: "0.25rem 0.5rem",
                    background: "rgba(56, 68, 238, 1)",
                    color: "#fff",
                    fontSize: "0.75rem",
                    borderRadius: "4px",
                    whiteSpace: "nowrap",
                    opacity: `var(--cobe-visible-${marker.id}, 0)`,
                    transition: "opacity 0.3s",
                  } as React.CSSProperties
                }
              >
                {marker.label}
              </div>
            ))}
        </>
      )}
    </div>
  );
}
