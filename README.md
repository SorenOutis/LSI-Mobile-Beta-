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

The app talks to the LUA V6 backend (`/api` routes on the backend's origin).

| Where you're running | `EXPO_PUBLIC_API_URL` |
|---|---|
| Web (dev) | `http://localhost:9000` |
| Android emulator | `http://10.0.2.2:9000` |
| iOS simulator | `http://localhost:9000` |
| Physical device (same Wi-Fi) | `http://<your-machine-lan-ip>:9000` |
| Production / release builds | `https://<your-domain>` (HTTPS is required for release) |

Copy `.env.example` to `.env` and set the value (`.env` is git-ignored). If you leave it unset, the app auto-detects the dev machine: Android emulator → `10.0.2.2`, physical device → your LAN IP (from the Expo `hostUri`), web → `localhost` — all on port `9000`.

> If requests fail, look for the orange "Can't reach the LUA V6 server" banner at the top of the tabs — it means the network request never reached the backend (wrong URL, different Wi-Fi, backend not running, or HTTPS mixed-content on web).

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
  (auth)/                Login, register, 2FA, forgot/reset password, verify email
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
  AuthContext.tsx        Session (token in SecureStore), login/register/logout
```

### API contract assumptions

The client calls the LUA V6 backend under `/api`. Auth uses Bearer tokens (`/auth/login`, `/auth/register`, `/auth/logout`, `GET /user`). Where a route was not yet confirmed, the endpoint is a named constant near the top of the screen file (e.g. `ENDPOINTS` in `app/exams/[id].tsx`) — adjust there if your backend differs. Screens that depend on a not-yet-available contract show an honest error state with an "Open in web app" link instead of fake data.

## Notes

- Tokens are stored in `SecureStore` on native (localStorage on web).
- The app polls the dashboard every 30 s **only while the Home tab is focused**.
- Release builds must point `EXPO_PUBLIC_API_URL` at an `https://` origin.
