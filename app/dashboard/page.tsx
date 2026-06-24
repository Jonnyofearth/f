'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  getUserProfile,
  searchUserByEmail,
  sendFriendRequest,
  acceptFriendRequest,
  removeFriend,
  subscribeFriends,
  postLocationUpdate,
  deactivateLocationUpdate,
  joinPlan,
  subscribeToFriendsUpdates,
  subscribeToMyUpdates,
  subscribeNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type UserProfile,
  type Friend,
  type LocationUpdate,
  type Notification,
} from '@/lib/database';
import Map from '@/components/Map';
import LocationForm from '@/components/LocationForm';
import ActivityFeed from '@/components/ActivityFeed';
import FriendsList from '@/components/FriendsList';
import NotificationBell from '@/components/NotificationBell';

type Tab = 'feed' | 'map' | 'friends';

export default function DashboardPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendUpdates, setFriendUpdates] = useState<LocationUpdate[]>([]);
  const [myUpdates, setMyUpdates] = useState<LocationUpdate[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [tab, setTab] = useState<Tab>('feed');

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  // Load profile
  useEffect(() => {
    if (!user) return;
    getUserProfile(user.uid).then((p) => {
      if (p) {
        setProfile(p);
      } else {
        // Profile might not exist yet (race condition on sign-up), retry once
        setTimeout(() => {
          getUserProfile(user.uid).then((p2) => {
            if (p2) setProfile(p2);
          });
        }, 1000);
      }
    });
  }, [user]);

  // Subscribe to friends list
  useEffect(() => {
    if (!user) return;
    return subscribeFriends(user.uid, setFriends);
  }, [user]);

  // Subscribe to friends' location updates
  useEffect(() => {
    const accepted = friends.filter((f) => f.status === 'accepted');
    const uids = accepted.map((f) => f.uid);
    return subscribeToFriendsUpdates(uids, setFriendUpdates);
  }, [friends]);

  // Subscribe to my own updates
  useEffect(() => {
    if (!user) return;
    return subscribeToMyUpdates(user.uid, setMyUpdates);
  }, [user]);

  // Subscribe to notifications
  useEffect(() => {
    if (!user) return;
    return subscribeNotifications(user.uid, setNotifications);
  }, [user]);

  const handlePostLocation = useCallback(
    async (data: {
      location: string;
      activity: string;
      description: string;
      coordinates: { lat: number; lng: number } | null;
    }) => {
      if (!user || !profile) return;
      const acceptedFriendUids = friends
        .filter((f) => f.status === 'accepted')
        .map((f) => f.uid);
      await postLocationUpdate(user.uid, profile.displayName, data, acceptedFriendUids);
    },
    [user, profile, friends]
  );

  const handleAddFriend = useCallback(
    async (email: string) => {
      if (!user || !profile) return;
      const found = await searchUserByEmail(email);
      if (!found) throw new Error('No user found with that email.');
      await sendFriendRequest(user.uid, profile, found.uid, found);
    },
    [user, profile]
  );

  const handleAcceptFriend = useCallback(
    async (friendUid: string) => {
      if (!user || !profile) return;
      await acceptFriendRequest(user.uid, profile.displayName, friendUid);
    },
    [user, profile]
  );

  const handleRemoveFriend = useCallback(
    async (friendUid: string) => {
      if (!user) return;
      await removeFriend(user.uid, friendUid);
    },
    [user]
  );

  const handleJoinPlan = useCallback(
    async (update: LocationUpdate) => {
      if (!user || !profile) return;
      await joinPlan(update.userId, update.id, user.uid, profile.displayName);
    },
    [user, profile]
  );

  const handleDeactivate = useCallback(
    async (update: LocationUpdate) => {
      if (!user) return;
      await deactivateLocationUpdate(user.uid, update.id);
    },
    [user]
  );

  const handleMarkRead = useCallback(
    async (id: string) => {
      if (!user) return;
      await markNotificationRead(user.uid, id);
    },
    [user]
  );

  const handleMarkAllRead = useCallback(async () => {
    if (!user) return;
    await markAllNotificationsRead(user.uid);
  }, [user]);

  // Combined feed: friends' updates + my own, sorted by time
  const allUpdates = [...friendUpdates, ...myUpdates].sort(
    (a, b) => b.createdAt - a.createdAt
  );

  // All locations with coords (friends + my own) for the map
  const mapLocations = allUpdates.filter(
    (u) => u.coordinates && u.active !== false
  );

  const acceptedFriends = friends.filter((f) => f.status === 'accepted');

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading…</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <span className="font-bold text-indigo-600 text-lg whitespace-nowrap">
            📍 Whereabouts
          </span>

          {/* Tabs */}
          <nav className="flex gap-1">
            {(
              [
                { id: 'feed', label: '📜 Feed' },
                { id: 'map', label: '🗺️ Map' },
                { id: 'friends', label: '👥 Friends' },
              ] as { id: Tab; label: string }[]
            ).map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  tab === id
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <NotificationBell
              notifications={notifications}
              onMarkAllRead={handleMarkAllRead}
              onMarkRead={handleMarkRead}
            />
            <span className="text-sm text-gray-600 hidden sm:block">
              {profile?.displayName ?? user.email}
            </span>
            <button
              onClick={() => signOut().then(() => router.replace('/'))}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1 rounded"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        {tab === 'feed' && (
          <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
            <div>
              <LocationForm
                onSubmit={handlePostLocation}
                acceptedFriends={acceptedFriends}
              />
            </div>
            <div>
              <h2 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">
                Activity Feed
              </h2>
              <ActivityFeed
                updates={allUpdates}
                currentUserId={user.uid}
                onJoin={handleJoinPlan}
                onDeactivate={handleDeactivate}
              />
            </div>
          </div>
        )}

        {tab === 'map' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
                Friends&apos; Locations
              </h2>
              <p className="text-xs text-gray-400">
                {mapLocations.length} active pin{mapLocations.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="h-[calc(100vh-12rem)] min-h-[400px]">
              <Map locations={mapLocations} />
            </div>
            {mapLocations.length === 0 && (
              <p className="text-center text-sm text-gray-400 -mt-2">
                No active locations to show. Share yours or wait for friends!
              </p>
            )}
          </div>
        )}

        {tab === 'friends' && (
          <div className="max-w-xl">
            <FriendsList
              friends={friends}
              currentUserProfile={profile}
              onAddFriend={handleAddFriend}
              onAccept={handleAcceptFriend}
              onRemove={handleRemoveFriend}
            />
          </div>
        )}
      </main>
    </div>
  );
}
