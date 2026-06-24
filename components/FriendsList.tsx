'use client';

import { useState, FormEvent } from 'react';
import type { Friend, UserProfile } from '@/lib/database';

interface FriendsListProps {
  friends: Friend[];
  currentUserProfile: UserProfile | null;
  onAddFriend: (email: string) => Promise<void>;
  onAccept: (friendUid: string) => Promise<void>;
  onRemove: (friendUid: string) => Promise<void>;
}

function FriendRow({
  friend,
  onAccept,
  onRemove,
}: {
  friend: Friend;
  onAccept: () => Promise<void>;
  onRemove: () => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);

  const handle = async (fn: () => Promise<void>) => {
    setLoading(true);
    try {
      await fn();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm flex-shrink-0">
          {friend.displayName.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">{friend.displayName}</p>
          <p className="text-xs text-gray-400">{friend.email}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {friend.status === 'pending' && friend.direction === 'received' && (
          <button
            disabled={loading}
            onClick={() => handle(onAccept)}
            className="text-xs px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            Accept
          </button>
        )}
        {friend.status === 'pending' && friend.direction === 'sent' && (
          <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
            Pending
          </span>
        )}
        {friend.status === 'accepted' && (
          <span className="text-xs text-green-600 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
            Friends
          </span>
        )}
        <button
          disabled={loading}
          onClick={() => handle(onRemove)}
          className="text-xs px-2 py-1.5 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
          title="Remove"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export default function FriendsList({
  friends,
  currentUserProfile,
  onAddFriend,
  onAccept,
  onRemove,
}: FriendsListProps) {
  const [email, setEmail] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    if (trimmed === currentUserProfile?.email) {
      setAddError("You can't add yourself.");
      return;
    }
    if (friends.some((f) => f.email === trimmed)) {
      setAddError('Already in your friends list.');
      return;
    }
    setAddError('');
    setAdding(true);
    try {
      await onAddFriend(trimmed);
      setEmail('');
      setAddSuccess('Friend request sent!');
      setTimeout(() => setAddSuccess(''), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not find user.';
      setAddError(msg);
    } finally {
      setAdding(false);
    }
  };

  const pending = friends.filter((f) => f.status === 'pending' && f.direction === 'received');
  const accepted = friends.filter((f) => f.status === 'accepted');
  const sent = friends.filter((f) => f.status === 'pending' && f.direction === 'sent');

  return (
    <div className="flex flex-col gap-6">
      {/* Add friend */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-3">Add a friend</h3>
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="friend@example.com"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={adding || !email}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {adding ? '…' : 'Add'}
          </button>
        </form>
        {addError && (
          <p className="mt-2 text-sm text-red-600">{addError}</p>
        )}
        {addSuccess && (
          <p className="mt-2 text-sm text-green-600">{addSuccess}</p>
        )}
      </div>

      {/* Pending requests */}
      {pending.length > 0 && (
        <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-1">
            Friend requests{' '}
            <span className="text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-0.5 ml-1">
              {pending.length}
            </span>
          </h3>
          {pending.map((f) => (
            <FriendRow
              key={f.uid}
              friend={f}
              onAccept={() => onAccept(f.uid)}
              onRemove={() => onRemove(f.uid)}
            />
          ))}
        </div>
      )}

      {/* Friends */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-1">
          Friends{' '}
          <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5 ml-1">
            {accepted.length}
          </span>
        </h3>
        {accepted.length === 0 && sent.length === 0 ? (
          <p className="text-sm text-gray-400 py-4">No friends yet. Add someone above!</p>
        ) : (
          <>
            {accepted.map((f) => (
              <FriendRow
                key={f.uid}
                friend={f}
                onAccept={() => onAccept(f.uid)}
                onRemove={() => onRemove(f.uid)}
              />
            ))}
            {sent.map((f) => (
              <FriendRow
                key={f.uid}
                friend={f}
                onAccept={() => onAccept(f.uid)}
                onRemove={() => onRemove(f.uid)}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
