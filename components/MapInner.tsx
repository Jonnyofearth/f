'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import type { LocationUpdate } from '@/lib/database';

interface MapInnerProps {
  locations: LocationUpdate[];
}

function formatTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function MapInner({ locations }: MapInnerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';

  useEffect(() => {
    if (!token || !containerRef.current) return;

    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [0, 20],
      zoom: 1.5,
    });

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [token]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const active = locations.filter(
      (l) => l.coordinates && (l.active !== false)
    );

    if (active.length === 0) return;

    const bounds = new mapboxgl.LngLatBounds();

    active.forEach((loc) => {
      if (!loc.coordinates) return;
      const { lng, lat } = loc.coordinates;

      const popup = new mapboxgl.Popup({ offset: 12, closeButton: false }).setHTML(`
        <div style="font-family:sans-serif;padding:4px 2px;min-width:140px">
          <p style="font-weight:600;margin:0 0 2px">${loc.displayName}</p>
          <p style="margin:0 0 2px;font-size:13px">📍 ${loc.location}</p>
          ${loc.activity ? `<p style="margin:0 0 2px;font-size:13px">🎯 ${loc.activity}</p>` : ''}
          <p style="margin:0;font-size:11px;color:#6b7280">${formatTime(loc.createdAt)}</p>
        </div>
      `);

      const el = document.createElement('div');
      el.style.cssText = `
        width:36px;height:36px;border-radius:50%;
        background:#4f46e5;color:#fff;font-size:14px;
        display:flex;align-items:center;justify-content:center;
        box-shadow:0 2px 8px rgba(0,0,0,0.3);cursor:pointer;
        border:2px solid #fff;
      `;
      el.textContent = loc.displayName.charAt(0).toUpperCase();

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map);

      markersRef.current.push(marker);
      bounds.extend([lng, lat]);
    });

    if (active.length === 1) {
      const { lng, lat } = active[0].coordinates!;
      map.flyTo({ center: [lng, lat], zoom: 12, duration: 1000 });
    } else if (active.length > 1) {
      map.fitBounds(bounds, { padding: 60, maxZoom: 14, duration: 1000 });
    }
  }, [locations]);

  if (!token) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg border border-dashed border-gray-300">
        <div className="text-center text-gray-400 px-6">
          <p className="text-3xl mb-2">🗺️</p>
          <p className="font-medium text-sm">Map unavailable</p>
          <p className="text-xs mt-1">Add your Mapbox token to <code className="bg-gray-200 px-1 rounded">.env.local</code></p>
        </div>
      </div>
    );
  }

  return <div ref={containerRef} className="w-full h-full rounded-lg" />;
}
