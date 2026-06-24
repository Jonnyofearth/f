# Whereabouts — Location Sharing Website

A website that lets you **manually share your location** with friends and spontaneously join their plans — no GPS tracking required.

## Features

- **User Authentication** — Sign up and log in with email/password (Firebase Auth)
- **Manual Location Updates** — Type where you are and what you're doing; friends see it instantly
- **Interactive Map** — Mapbox GL JS map showing all friends' active location pins
- **Friends Management** — Add friends by email, accept/decline requests
- **Join Plans** — See a friend's update and tap "Join" to let them know you're coming
- **Notifications** — Real-time notifications for new plans, friend requests, and joins
- **Activity Feed** — Chronological feed of all friends' recent location updates

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router) + React + TypeScript |
| Styling | Tailwind CSS v4 |
| Auth | Firebase Authentication |
| Database | Firebase Realtime Database |
| Map | Mapbox GL JS |

## Getting Started

### 1. Clone & install

```bash
git clone https://github.com/Jonnyofearth/f
cd f
npm install
```

### 2. Set up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com) and create a project
2. Enable **Authentication** → Email/Password
3. Enable **Realtime Database** (start in test mode for development)
4. Go to Project Settings → Your apps → Add a Web app → copy the config

### 3. Set up Mapbox

1. Create a free account at [mapbox.com](https://www.mapbox.com)
2. Go to Account → Access tokens → copy your default public token

### 4. Configure environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and fill in your Firebase and Mapbox credentials.

### 5. Firebase Database Rules

In the Firebase Console → Realtime Database → Rules, set rules for development:

```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```

> ⚠️ For production, use more granular rules. See [Firebase Security Rules docs](https://firebase.google.com/docs/database/security).

### 6. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
app/
  page.tsx            # Landing page
  login/page.tsx      # Login
  signup/page.tsx     # Sign up
  dashboard/page.tsx  # Main app (protected)
  layout.tsx          # Root layout with AuthProvider
  providers.tsx       # Client-side context providers
components/
  Map.tsx             # Mapbox map wrapper (SSR-safe)
  MapInner.tsx        # Actual Mapbox implementation
  LocationForm.tsx    # Form to post a location update
  ActivityFeed.tsx    # Feed of friends' location updates
  FriendsList.tsx     # Friends management UI
  NotificationBell.tsx # Notification dropdown
lib/
  firebase.ts         # Firebase app initialisation
  auth-context.tsx    # Auth context + hooks
  database.ts         # All Firebase Realtime DB helpers & types
```

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```
