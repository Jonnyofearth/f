'use client';

import { useState } from 'react';
import type { LocationUpdate } from '@/lib/database';

interface ActivityFeedProps {
  updates: LocationUpdate[];
  currentUserId: string;
  onJoin: (update: LocationUpdate) => void;
  onDeactivate: (update: LocationUpdate) => void;
}

function timeAgo(ts: number): string {
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

interface UpdateCardProps {
  update: LocationUpdate;
  isOwn: boolean;
  onJoin: () => void;
  onDeactivate: () => void;
}

function UpdateCard({ update, isOwn, onJoin, onDeactivate }: UpdateCardProps) {
  const [joining, setJoining] = useState(false);
  const joinerCount = Object.keys(update.joiners ?? {}).length;

  const handleJoin = async () => {
    setJoining(true);
    try {
      await onJoin();
    } finally {
      setJoining(false);
    }
  };

  return (
    <div
      className={`bg-white rounded-xl border p-4 flex flex-col gap-2 ${
        !update.active ? 'opacity-60' : 'border-gray-200'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm flex-shrink-0">
            {update.displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-sm text-gray-900">{update.displayName}</p>
            <p className="text-xs text-gray-400">{timeAgo(update.createdAt)}</p>
          </div>
        </div>
        {!update.active && (
          <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5 flex-shrink-0">
            ended
          </span>
        )}
      </div>

      <div className="pl-11">
        <p className="text-sm text-gray-900 font-medium">
          📍 {update.location}
        </p>
        {update.activity && (
          <p className="text-sm text-gray-600 mt-0.5">🎯 {update.activity}</p>
        )}
        {update.description && (
          <p className="text-sm text-gray-500 mt-1 italic">{update.description}</p>
        )}
        {!update.coordinates && (
          <p className="text-xs text-gray-400 mt-1">⚠️ Location not geocoded — won&apos;t show on map</p>
        )}

        {joinerCount > 0 && (
          <p className="text-xs text-indigo-600 mt-1.5">
            👥 {joinerCount} {joinerCount === 1 ? 'person' : 'people'} joining
            {Object.values(update.joiners ?? {}).length > 0 && (
              <span className="text-gray-500">
                {' '}
                ({Object.values(update.joiners).map((j) => j.displayName).join(', ')})
              </span>
            )}
          </p>
        )}

        {update.active && (
          <div className="mt-2 flex gap-2">
            {!isOwn && (
              <button
                onClick={handleJoin}
                disabled={joining}
                className="text-xs px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {joining ? 'Joining…' : '👋 Join'}
              </button>
            )}
            {isOwn && (
              <button
                onClick={onDeactivate}
                className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Mark as done
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ActivityFeed({
  updates,
  currentUserId,
  onJoin,
  onDeactivate,
}: ActivityFeedProps) {
  if (updates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <p className="text-4xl mb-3">📭</p>
        <p className="font-medium text-sm">No updates yet</p>
        <p className="text-xs mt-1">Add friends and share your location to get started.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {updates.map((update) => (
        <UpdateCard
          key={`${update.userId}-${update.id}`}
          update={update}
          isOwn={update.userId === currentUserId}
          onJoin={() => onJoin(update)}
          onDeactivate={() => onDeactivate(update)}
        />
      ))}
    </div>
  );
}
