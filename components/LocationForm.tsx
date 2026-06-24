'use client';

import { useState, FormEvent } from 'react';
import type { Friend } from '@/lib/database';

interface LocationFormProps {
  onSubmit: (data: {
    location: string;
    activity: string;
    description: string;
    coordinates: { lat: number; lng: number } | null;
  }) => Promise<void>;
  acceptedFriends: Friend[];
}

async function geocodeLocation(
  location: string
): Promise<{ lat: number; lng: number } | null> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token || !location.trim()) return null;
  try {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        location
      )}.json?access_token=${token}&limit=1`
    );
    const data = await res.json();
    if (data.features?.length > 0) {
      const [lng, lat] = data.features[0].center as [number, number];
      return { lat, lng };
    }
  } catch {
    // Geocoding failed; continue without coordinates
  }
  return null;
}

export default function LocationForm({ onSubmit, acceptedFriends }: LocationFormProps) {
  const [location, setLocation] = useState('');
  const [activity, setActivity] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!location.trim()) {
      setError('Please enter a location.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const coordinates = await geocodeLocation(location);
      await onSubmit({ location: location.trim(), activity, description, coordinates });
      setLocation('');
      setActivity('');
      setDescription('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError('Failed to post update. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <h2 className="font-semibold text-gray-900 mb-4">📍 Share your location</h2>

      {acceptedFriends.length === 0 && (
        <div className="mb-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Add friends first so they can see your updates.
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
        {success && (
          <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            ✓ Location shared with your friends!
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
            Where are you? *
          </label>
          <input
            type="text"
            required
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Blue Bottle Coffee, 9th Ave NYC"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-400">
            Be specific for a better map pin. City name works too.
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
            What are you doing?
          </label>
          <input
            type="text"
            value={activity}
            onChange={(e) => setActivity(e.target.value)}
            placeholder="e.g. Getting coffee, studying, brunch"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
            Extra details
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Join me! Planning to be here until 3pm"
            rows={2}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-1 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {loading ? 'Sharing…' : 'Share location'}
        </button>
      </form>
    </div>
  );
}
