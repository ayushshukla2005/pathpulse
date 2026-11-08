"use client";

import { useEffect, useRef } from "react";
import { Map, Marker, NavigationControl, LngLatBounds, type StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { VenueListItem } from "@pathpulse/shared-types";

interface VenueMapProps {
  venues: VenueListItem[];
  selectedVenueId?: string | null;
  onSelectVenue?: (venueId: string) => void;
  center?: [number, number];
  zoom?: number;
}

const defaultMapStyle: StyleSpecification = {
  version: 8,
  sources: {
    "osm-raster-tiles": {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
    },
  },
  layers: [
    {
      id: "osm-raster-layer",
      type: "raster",
      source: "osm-raster-tiles",
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  const attr = document.documentElement.getAttribute("data-reduced-motion");
  if (attr === "true") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function VenueMap({
  venues,
  selectedVenueId,
  onSelectVenue,
  center = [77.5946, 12.9716],
  zoom = 13,
}: VenueMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const markersRef = useRef<Marker[]>([]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new Map({
      container: mapContainerRef.current,
      style: process.env.NEXT_PUBLIC_MAP_STYLE_URL || defaultMapStyle,
      center,
      zoom,
      maxZoom: 18,
      minZoom: 2,
    });

    map.addControl(new NavigationControl({ showCompass: true, showZoom: true }), "top-right");

    mapInstanceRef.current = map;

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    venues.forEach((venue) => {
      const isSelected = venue.id === selectedVenueId;
      const el = document.createElement("button");
      el.type = "button";
      el.setAttribute("aria-label", `Map marker for ${venue.name}`);
      el.setAttribute("data-venue-id", venue.id);
      el.className = `flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-transform shadow-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-600 ${
        isSelected
          ? "border-white bg-blue-700 text-white scale-125 z-20 ring-2 ring-blue-700"
          : "border-blue-900 bg-white text-blue-900 hover:scale-110 z-10"
      }`;
      el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;

      el.addEventListener("click", () => {
        onSelectVenue?.(venue.id);
        const card = document.getElementById(`venue-card-${venue.id}`);
        if (card) {
          card.focus();
          card.scrollIntoView({
            behavior: prefersReducedMotion() ? "auto" : "smooth",
            block: "nearest",
          });
        }
      });

      const marker = new Marker({ element: el })
        .setLngLat([venue.longitude, venue.latitude])
        .addTo(map);

      markersRef.current.push(marker);
    });

    if (venues.length > 0 && !selectedVenueId) {
      const bounds = new LngLatBounds();
      venues.forEach((v) => bounds.extend([v.longitude, v.latitude]));
      map.fitBounds(bounds, {
        padding: 50,
        maxZoom: 15,
        animate: !prefersReducedMotion(),
      });
    }
  }, [venues, selectedVenueId, onSelectVenue]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedVenueId) return;

    const venue = venues.find((v) => v.id === selectedVenueId);
    if (!venue) return;

    const targetCoords: [number, number] = [venue.longitude, venue.latitude];
    if (prefersReducedMotion()) {
      map.jumpTo({ center: targetCoords, zoom: 15 });
    } else {
      map.flyTo({ center: targetCoords, zoom: 15, speed: 1.2 });
    }
  }, [selectedVenueId, venues]);

  return (
    <div className="relative h-full w-full min-h-[350px] overflow-hidden rounded-lg border-2 border-[var(--border)] bg-[var(--card)] shadow-inner">
      <div
        ref={mapContainerRef}
        className="h-full w-full min-h-[350px]"
        role="region"
        aria-label="Interactive venue map"
      />
      <p className="sr-only">Interactive MapLibre map showing {venues.length} venues.</p>
    </div>
  );
}
