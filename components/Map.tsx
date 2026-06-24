'use client';

import dynamic from 'next/dynamic';
import type { LocationUpdate } from '@/lib/database';

const MapInner = dynamic(() => import('./MapInner'), { ssr: false });

interface MapProps {
  locations: LocationUpdate[];
}

export default function Map({ locations }: MapProps) {
  return <MapInner locations={locations} />;
}
