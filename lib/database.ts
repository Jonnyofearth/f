import {
  ref,
  push,
  set,
  get,
  update,
  remove,
  onValue,
  off,
  query,
  orderByChild,
} from 'firebase/database';
import { db } from './firebase';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  createdAt: number;
}

export interface LocationUpdate {
  id: string;
  userId: string;
  displayName: string;
  location: string;
  activity: string;
  description: string;
  coordinates: { lat: number; lng: number } | null;
  createdAt: number;
  active: boolean;
  joiners: Record<string, { displayName: string; joinedAt: number }>;
}

export interface Friend {
  uid: string;
  displayName: string;
  email: string;
  status: 'pending' | 'accepted';
  direction: 'sent' | 'received';
}

export interface Notification {
  id: string;
  type: 'new_plan' | 'friend_request' | 'friend_accepted' | 'plan_joined';
  fromUserId: string;
  fromDisplayName: string;
  message: string;
  read: boolean;
  createdAt: number;
  planId?: string;
}

// ─── User Profiles ────────────────────────────────────────────────────────────

export async function createUserProfile(profile: UserProfile): Promise<void> {
  await set(ref(db, `users/${profile.uid}`), profile);
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await get(ref(db, `users/${uid}`));
  return snap.exists() ? (snap.val() as UserProfile) : null;
}

export async function searchUserByEmail(email: string): Promise<UserProfile | null> {
  const snap = await get(query(ref(db, 'users'), orderByChild('email')));
  if (!snap.exists()) return null;
  let found: UserProfile | null = null;
  snap.forEach((child) => {
    if (child.val().email === email) {
      found = child.val() as UserProfile;
    }
  });
  return found;
}

// ─── Friends ──────────────────────────────────────────────────────────────────

export async function sendFriendRequest(
  fromUid: string,
  fromProfile: UserProfile,
  toUid: string,
  toProfile: UserProfile
): Promise<void> {
  const dbUpdates: Record<string, unknown> = {
    [`friends/${fromUid}/${toUid}`]: {
      status: 'pending',
      direction: 'sent',
      displayName: toProfile.displayName,
      email: toProfile.email,
      addedAt: Date.now(),
    },
    [`friends/${toUid}/${fromUid}`]: {
      status: 'pending',
      direction: 'received',
      displayName: fromProfile.displayName,
      email: fromProfile.email,
      addedAt: Date.now(),
    },
  };
  await update(ref(db), dbUpdates);
  await createNotification(toUid, {
    type: 'friend_request',
    fromUserId: fromUid,
    fromDisplayName: fromProfile.displayName,
    message: `${fromProfile.displayName} sent you a friend request`,
    read: false,
    createdAt: Date.now(),
  });
}

export async function acceptFriendRequest(
  myUid: string,
  myDisplayName: string,
  friendUid: string
): Promise<void> {
  const dbUpdates: Record<string, unknown> = {
    [`friends/${myUid}/${friendUid}/status`]: 'accepted',
    [`friends/${friendUid}/${myUid}/status`]: 'accepted',
  };
  await update(ref(db), dbUpdates);
  await createNotification(friendUid, {
    type: 'friend_accepted',
    fromUserId: myUid,
    fromDisplayName: myDisplayName,
    message: `${myDisplayName} accepted your friend request`,
    read: false,
    createdAt: Date.now(),
  });
}

export async function removeFriend(myUid: string, friendUid: string): Promise<void> {
  await remove(ref(db, `friends/${myUid}/${friendUid}`));
  await remove(ref(db, `friends/${friendUid}/${myUid}`));
}

export function subscribeFriends(
  uid: string,
  callback: (friends: Friend[]) => void
): () => void {
  const friendsRef = ref(db, `friends/${uid}`);
  const listener = onValue(friendsRef, (snap) => {
    const friends: Friend[] = [];
    if (snap.exists()) {
      snap.forEach((child) => {
        friends.push({ uid: child.key!, ...(child.val() as Omit<Friend, 'uid'>) });
      });
    }
    callback(friends);
  });
  return () => off(friendsRef, 'value', listener);
}

// ─── Location Updates ─────────────────────────────────────────────────────────

export async function postLocationUpdate(
  userId: string,
  displayName: string,
  data: {
    location: string;
    activity: string;
    description: string;
    coordinates: { lat: number; lng: number } | null;
  },
  friendUids: string[]
): Promise<string> {
  const updatesRef = ref(db, `locationUpdates/${userId}`);
  const newRef = push(updatesRef);
  const updateId = newRef.key!;

  const payload = {
    userId,
    displayName,
    location: data.location,
    activity: data.activity,
    description: data.description,
    coordinates: data.coordinates,
    createdAt: Date.now(),
    active: true,
    joiners: {},
  };

  await set(newRef, payload);

  for (const friendUid of friendUids) {
    await createNotification(friendUid, {
      type: 'new_plan',
      fromUserId: userId,
      fromDisplayName: displayName,
      message: `${displayName} is at ${data.location}${data.activity ? ` — ${data.activity}` : ''}`,
      read: false,
      createdAt: Date.now(),
      planId: updateId,
    });
  }

  return updateId;
}

export async function deactivateLocationUpdate(userId: string, updateId: string): Promise<void> {
  await update(ref(db, `locationUpdates/${userId}/${updateId}`), { active: false });
}

export async function joinPlan(
  planOwnerId: string,
  updateId: string,
  joinerId: string,
  joinerDisplayName: string
): Promise<void> {
  await update(ref(db, `locationUpdates/${planOwnerId}/${updateId}/joiners/${joinerId}`), {
    displayName: joinerDisplayName,
    joinedAt: Date.now(),
  });

  const snap = await get(ref(db, `locationUpdates/${planOwnerId}/${updateId}`));
  if (snap.exists()) {
    const plan = snap.val() as Omit<LocationUpdate, 'id'>;
    await createNotification(planOwnerId, {
      type: 'plan_joined',
      fromUserId: joinerId,
      fromDisplayName: joinerDisplayName,
      message: `${joinerDisplayName} joined your plan at ${plan.location}`,
      read: false,
      createdAt: Date.now(),
      planId: updateId,
    });
  }
}

export function subscribeToFriendsUpdates(
  friendUids: string[],
  callback: (updates: LocationUpdate[]) => void
): () => void {
  if (friendUids.length === 0) {
    callback([]);
    return () => {};
  }

  const allUpdates: Record<string, LocationUpdate[]> = {};

  const merge = () => {
    const merged = Object.values(allUpdates).flat();
    merged.sort((a, b) => b.createdAt - a.createdAt);
    callback(merged);
  };

  const unsubscribers = friendUids.map((uid) => {
    const updRef = ref(db, `locationUpdates/${uid}`);
    const listener = onValue(updRef, (snap) => {
      const items: LocationUpdate[] = [];
      if (snap.exists()) {
        snap.forEach((child) => {
          items.push({ id: child.key!, ...(child.val() as Omit<LocationUpdate, 'id'>) });
        });
      }
      allUpdates[uid] = items;
      merge();
    });
    return () => off(updRef, 'value', listener);
  });

  return () => unsubscribers.forEach((u) => u());
}

export function subscribeToMyUpdates(
  uid: string,
  callback: (updates: LocationUpdate[]) => void
): () => void {
  const updRef = ref(db, `locationUpdates/${uid}`);
  const listener = onValue(updRef, (snap) => {
    const items: LocationUpdate[] = [];
    if (snap.exists()) {
      snap.forEach((child) => {
        items.push({ id: child.key!, ...(child.val() as Omit<LocationUpdate, 'id'>) });
      });
    }
    items.sort((a, b) => b.createdAt - a.createdAt);
    callback(items);
  });
  return () => off(updRef, 'value', listener);
}

// ─── Notifications ────────────────────────────────────────────────────────────

export async function createNotification(
  userId: string,
  notification: Omit<Notification, 'id'>
): Promise<void> {
  const notifRef = push(ref(db, `notifications/${userId}`));
  await set(notifRef, notification);
}

export function subscribeNotifications(
  uid: string,
  callback: (notifications: Notification[]) => void
): () => void {
  const notifRef = ref(db, `notifications/${uid}`);
  const listener = onValue(notifRef, (snap) => {
    const notifications: Notification[] = [];
    if (snap.exists()) {
      snap.forEach((child) => {
        notifications.push({ id: child.key!, ...(child.val() as Omit<Notification, 'id'>) });
      });
    }
    notifications.sort((a, b) => b.createdAt - a.createdAt);
    callback(notifications);
  });
  return () => off(notifRef, 'value', listener);
}

export async function markNotificationRead(uid: string, notificationId: string): Promise<void> {
  await update(ref(db, `notifications/${uid}/${notificationId}`), { read: true });
}

export async function markAllNotificationsRead(uid: string): Promise<void> {
  const snap = await get(ref(db, `notifications/${uid}`));
  if (!snap.exists()) return;
  const dbUpdates: Record<string, boolean> = {};
  snap.forEach((child) => {
    if (!child.val().read) {
      dbUpdates[`notifications/${uid}/${child.key}/read`] = true;
    }
  });
  if (Object.keys(dbUpdates).length > 0) {
    await update(ref(db), dbUpdates);
  }
}
