# LSI Koamishin — Mobile

Expo (React Native) mobile client for the **LUA V6** learning platform (school assessments: exams, assignments, grades, agenda, chats, NGL, XP/gamification, leaderboards).

Built with Expo SDK 54, expo-router (file-based routing), TypeScript (strict), and a small fetch-based API client that mirrors the web app's storage and route conventions.

## Getting started

```bash
npm install
npm start          # Expo dev server
```

Press `i` / `a` for the iOS simulator / Android emulator, or scan the QR code with Expo Go / a dev build.

## Connecting to LUA V6

The app talks to the **live** LUA V6 deployment by default:

```
https://lsi.koamishin.com
```

All endpoints are the mobile JSON API under `/api/mobile/*` (token auth issued by
`POST /api/mobile/auth/login`). No local or LAN backend is required.

### Overriding the base URL

Set `EXPO_PUBLIC_API_URL` to point the app somewhere else (a staging deploy, or a
local backend while developing the API itself). Copy `.env.example` to `.env`
and edit it (`.env` is git-ignored). Leave it unset and the live URL above is used.

> If requests fail, look for the orange "Can't reach the LUA V6 server" banner at
> the top of the tabs — it means the network request never reached the backend
> (the app is offline, the deploy is down, or a custom URL is wrong).

> Release builds must point `EXPO_PUBLIC_API_URL` at an `https://` origin.

## Scripts

| Command | What it does |
|---|---|
| `npm start` | Start the Expo dev server |
| `npm run web` | Run the web build (browser) |
| `npm run android` / `npm run ios` | Start for a specific platform |
| `npm run lint` | ESLint (expo config) |

Type-checking: `npx tsc --noEmit`.

## Project structure

```
app/
  _layout.tsx            Root stack + auth gate (token → tabs, else welcome) + splash
  index.tsx              Welcome / marketing screen (pre-login)
  (auth)/                Login + 2FA; register / forgot password link to the web app
  (tabs)/                Home, Exams, Agenda, Tasks, Grades, Chats
  exams/[id].tsx         Real exam take flow: parts, timer, autosave, submit, review
  courses/               Course list / detail / lesson (quiz)
  settings/              Profile, password, two-factor, connected accounts
  ngl.tsx                Anonymous shoutouts
  leaderboard.tsx        Section leaderboards
  profile.tsx            Own profile
  u/[publicId].tsx       Public profile (follow, kudos, activity)
  more.tsx               Hub for secondary screens
lib/
  api.ts                 API client: base URL resolution, Bearer auth, ApiError,
                         errorMessage(), connection status hook, webLink()
  format.ts              Date/time + initials helpers (local-time aware)
context/
  AuthContext.tsx        Session (token in SecureStore), login + 2FA, logout
```

### API contract

The client calls the LUA V6 **mobile JSON API** (`/api/mobile/*`) with Bearer
tokens issued by `POST /api/mobile/auth/login` (two-leg flow: email+password →
`requires_two_factor` → code). Every screen's endpoints and payload shapes match
the routes in the backend's `routes/api.php`. Where an action can't be done from
the mobile client yet (e.g. assignment file uploads), the screen links to the web
app instead of faking it.

## Notes

- Tokens are stored in `SecureStore` on native (localStorage on web).
- The app polls the dashboard every 30 s **only while the Home tab is focused**.
- Release builds must point `EXPO_PUBLIC_API_URL` at an `https://` origin.
