# LSI Mobile — Full Codebase Audit

**Date:** 2026-09-03 · **Branch:** `arena/01a06509-lsi-mobile-beta` (based on `master @ 406b105`)
**Scope:** all 44 source files (~4,900 lines), `package.json`, `app.json`, `.env`, tsconfig, ESLint + `tsc --noEmit` results.
**Context:** Expo SDK 54 + expo-router mobile client for the LUA V6 web backend (`http://localhost:9000`, Laravel-style `/api` routes, Bearer tokens).

---

## 1. Overall verdict

**Good bones, not yet a real client.** The visual work is genuinely strong — the screens are a faithful, polished port of the LUA V6 web UI (dashboard, exams list, assignments, grades, agenda, chats, NGL, leaderboard, public profile) and most of them *do* call real endpoints. The API layer, SecureStore token handling, and file-based routing are solid.

But as things stand the app will **not work on a phone**, and the **core exam flow is 100% mocked**. Half the auth screens are fakes. There is no route protection, the error-handling contract is broken app-wide, and a large number of screens are unreachable from the UI.

| Area | Rating | Notes |
|---|---|---|
| UI / design consistency | ★★★★★ | Consistent design system, skeletons, modals, safe areas |
| API layer (`lib/api.ts`) | ★★★☆☆ | Centralized, but error contract is broken for consumers |
| Auth | ★★☆☆☆ | Login/register real; 2FA/forgot/reset/verify fake; no route guards |
| Exams (core feature) | ★☆☆☆☆ | Entire take-exam flow is mock data, zero API calls |
| Connectivity to LUA V6 | ★☆☆☆☆ | `localhost:9000` is unreachable from a device; all errors swallowed |
| Code quality | ★★★☆☆ | Clean structure, but 12 files under `@ts-nocheck`, dead code, unused deps |
| Security | ★★★☆☆ | Token storage good; fake security screens, token leak in UI, no guards |

---

## 2. P0 — Blockers (fix before anything else)

### 2.1 The app cannot reach LUA V6 from a device — `lib/api.ts`, `.env`
`.env` (committed) hard-codes:
```
EXPO_PUBLIC_API_URL=http://localhost:9000
```
`getBaseUrl()` returns the env value first, so the sensible fallback (machine LAN IP from `Constants.expoConfig.hostUri`) is **dead code**. On a physical phone `localhost` is the *phone itself* — every request fails, and because every screen does `.catch(() => setX([]))` the user just sees empty states with zero feedback.

**Fix:**
- Emulator (Android): `EXPO_PUBLIC_API_URL=http://10.0.2.2:9000`
- iOS simulator: `http://localhost:9000` is fine
- Physical device: machine's LAN IP (e.g. `http://192.168.1.20:9000`), both on same Wi-Fi, or a tunnel (ngrok/cloudflared)
- Production: **HTTPS** — browsers and app stores require it; plain HTTP also exposes credentials in transit.
- Add a one-line "Can't reach server" banner on API failure instead of silent empty states.

### 2.2 Broken error contract — every screen misreads errors
`lib/api.ts` throws `ApiError` with shape `{ message, status, code }`. But nearly every screen reads the **axios** shape:
```ts
const msg = e?.response?.data?.message || ...   // login.tsx, register.tsx, (tabs)/index.tsx …
```
`e.response` is never set → **no real server error is ever shown** (bad password, "email already taken", invalid join code…). They all fall back to the generic string.

**Fix:** one helper in `lib/api.ts`:
```ts
export function errorMessage(e: unknown): string {
  if (e instanceof ApiError) return e.message;
  return 'Something went wrong.';
}
```
and also capture Laravel field errors (`error.errors?.[field]?.[0]`) inside the client so screens get them for free.

### 2.3 `alert()` crashes on native — `app/(tabs)/index.tsx:148,159`
`handleClaim` and `handleJoin` use the **web global** `alert(msg)` in their catch blocks. `alert` does not exist in React Native (iOS/Android) → `ReferenceError` the moment an API call fails (which, per 2.1, is always on a device). Use `Alert.alert(...)`.

### 2.4 Exam take flow is a complete mock — `app/exams/[id].tsx`
The header comment says *"Mirrors C:\luav6\...\Exams\Show.vue logic"* — but the file makes **zero API calls**:
- Hardcoded title `Mathematics Midterm`, hardcoded 45 min, `MOCK_PARTS` (two parts, 6 demo questions).
- "Submit" only flips local state (`// Simulate PUT /exams/{exam}/parts/{part}/answers`); XP award is hardcoded `{total: 85, ...}`.
- Autosave indicator is a fake pulse (`setTimeout 600ms`), not a real save.
- The Exams tab's "View results" modal (`app/(tabs)/exams.tsx`) likewise shows a **hardcoded demo question**, not the user's real results.

This is the product's core feature. Until `GET /exams/{id}` (parts, questions, duration, server deadline) and the answer/submit endpoints are wired, a student "taking" an exam on the app is taking nothing — and it silently looks real.

**Fix:** wire the real endpoints (the web `Show.vue` already has the contract), or, if this is intentionally a demo, gate it behind an obvious "Demo" banner and don't show real exam titles that lead into mock parts.

### 2.5 No authentication gate / route protection
- `app/_layout.tsx` renders the `Stack` with no redirect logic.
- `app/index.tsx` (welcome) never checks `useAuth()` — so on cold start **with a valid token**, the user lands on the marketing screen instead of `(tabs)`.
- `(tabs)/_layout.tsx` has no guard — a logged-out user can navigate to the tabs (screens then show empty "Login to see…" states).

**Fix:** in `RootLayout` (or a `RootGate` component): `loading` → splash; `token && user` → `router.replace('/(tabs)')`; else `router.replace('/')`. Plus a guard on `(tabs)` for deep links.

---

## 3. P1 — Major issues

### 3.1 Fake security screens (ship risk) — `app/(auth)/`
| Screen | Reality |
|---|---|
| `two-factor.tsx` | **Any** 6-digit code is accepted after `setTimeout(600)`; no API call |
| `confirm-password.tsx` | Accepts any non-empty password, `router.back()` |
| `forgot-password.tsx` | No API call; always shows "We have emailed your password reset link." |
| `reset-password.tsx` | No API call; "succeeds" without resetting; pre-fills `user@example.com`; falls back to token `'demo-token'`; **displays the reset token in the UI** (`Token: {token.slice(0,16)}...`) |
| `verify-email.tsx` | Resend is fake |

If these ship, users will believe they have 2FA and reset capabilities that don't exist. Either wire them to LUA V6's real endpoints or remove/hide the routes.

### 3.2 Dead routes & dead UI
- `app/settings/index.tsx` links to **`/settings/password`, `/settings/two-factor`, `/settings/connected` — none exist** → "unmatched route" crash screens on tap.
- Settings **Log out button has no `onPress`** (the real `logout()` exists in `AuthContext` but is never called from anywhere).
- Dark-mode and 2FA toggles are local state only — nothing is persisted, nothing happens (the whole app is hard-coded light colors; `constants/theme.ts` dark palette is never used).
- Welcome screen moon + menu icons: no handlers. Login "Remember me" (not sent to server), Google/GitHub social buttons: no handlers. Grades filter/chevrons, Exams search/menu, Tasks search: no handlers.
- **Orphan screens:** `more`, `courses`, `games`, `ngl`, `leaderboard`, `profile`, `about`, `how-it-works` are unreachable — the home header only has "Join" + refresh, and there is no menu anywhere. `more.tsx` is the intended hub but nothing links to it.
- `app/modal.tsx` is leftover template boilerplate.

### 3.3 Stub functionality that looks real
- **Tasks:** the Submit modal's "Submit" button just closes (no `POST`); Group/Feedback/Detail modals are empty shells; `showDetail` is never even opened.
- **Courses:** `courses/index.tsx` silently falls back to a `MOCK` array when the API returns nothing — users can't tell demo from real. `courses/[id].tsx` and `courses/lesson.tsx` are 100% hard-coded ("Algebra Fundamentals", fake quiz).
- **Settings → Profile** (`settings/profile.tsx`): pre-filled with fake "Alex Rivera / alex@example.com" instead of the real user, and saving is fake.
- **Tower Defense:** a static placeholder ("Game canvas (Pixi.js)").
- **Leaderboard/public profile avatars** fall back to `https://i.pravatar.cc/...` — third-party service, breaks offline/blocked networks, and leaks the existence of user IDs. Use initials (already implemented in `profile.tsx`) instead.

### 3.4 Real bugs in wired screens
- `app/u/[publicId].tsx`: the fallback retry calls `api.get('/api/u/' + publicId)` → resolves to **`/api/api/u/...`** (double prefix, guaranteed 404).
- **Timezone drift:** date keys built with `d.toISOString().slice(0,10)` (UTC) in the agenda week strip, home heatmap, and `new Date('YYYY-MM-DD')` (parsed as UTC) in the agenda date title. West-of-UTC users can see the wrong "today". Build keys from local `getFullYear/getMonth/getDate`.
- `chats.tsx`: send failures are silent (empty `catch {}`); no keyboard/auto-scroll handling; `add` button is dead.
- `home` polls `/dashboard` every 30 s **forever**, even when the tab is not focused and in the background — use `useFocusEffect`/`AppState` to pause.
- `api.postForm` (file upload path) doesn't wrap network errors in `ApiError` — inconsistent with the rest of the client.
- `AuthContext.refreshUser`: on a 5xx the user is cleared but the token kept; combined with 2.5 the app just shows the welcome screen with no explanation.

### 3.5 Security specifics
- ✅ Token in `SecureStore` on native (good).
- ⚠️ Web: token in plain `localStorage` — acceptable for a school-internal tool, note it.
- ⚠️ Reset token partially rendered in `reset-password.tsx` (see 3.1).
- ⚠️ No HTTPS in dev; make it a requirement for release builds (fail fast if `BASE_URL` isn't `https` when not debug).
- ✅ No `dangerouslySetInnerHTML` anywhere — no HTML injection surface.
- ⚠️ `.env` is committed to git. The value isn't secret, but it defeats per-developer overrides; add `.env` to `.gitignore` and ship a `.env.example`.
- ⚠️ Public profile endpoints (`/u/{id}`, follow, kudos) are callable with no meaningful auth on the client side — confirm LUA V6 enforces them server-side (anonymous POST /ngl, /follow, /kudos should be rejected).

### 3.6 Tooling / project hygiene
- `// @ts-nocheck` in **12 files** (all the data screens) — `strict: true` is effectively off where it matters most; `tsc` passing says nothing about them.
- ESLint: **6 errors** (unescaped `'`/`"` in JSX text — login, register, courses, GlobalLoader) + 20 warnings (unused vars, missing hook deps).
- **Unused dependencies:** `axios` (the client deliberately uses fetch), `@expo/ui` (beta), `expo-image`, `expo-linking`; `expo-haptics`/`expo-web-browser`/`expo-symbols` only referenced by unused template components.
- **`@tanstack/react-query`** is installed and `QueryClientProvider` wraps the app, but **no `useQuery`/`useMutation` is used anywhere** — every screen hand-rolls `useEffect + fetch + loading`. Pick one: adopt RQ (you get retries, cache, refetch-on-focus — which fixes 3.4 polling and silent failures for free) or delete it.
- Leftover template files: `components/hello-wave.tsx`, `parallax-scroll-view.tsx`, `themed-text.tsx`, `themed-view.tsx`, `external-link.tsx`, `haptic-tab.tsx`, `components/ui/icon-symbol*`, `app/modal.tsx`, `hooks/use-color-scheme*`, `use-theme-color.ts`.
- `app.json` is still template-branded: `name: "MyApp"`, `slug: "MyApp"`, `scheme: "myapp"`.
- `experiments.reactCompiler: true` — opt-in beta; pin or drop before release.
- `app.json` `web.output: "static"` — fine for a client-rendered SPA, but combined with polling it just ships a big JS bundle; OK for now.

---

## 4. What's done well
- Consistent, high-quality visual system (colors, cards, modals, skeletons, safe-area) that matches the web app closely.
- Clean `lib/api.ts` design: single base-URL resolution, bearer injection, `ApiError` type, FormData-aware `postForm`.
- `AuthContext` 401/403 → token removal logic is sensible, and the web-compatible `localStorage` mirror for logout is a nice touch for shared storage keys.
- Registration validation mirrors the backend rules (lengths, email pattern, password strength meter) — good parity work.
- Home dashboard is the most complete screen: real dashboard payload, greeting logic, streak/XP/season, announcements, heatmap, daily-claim POST.
- Typed routes + strict TS in tsconfig (a good foundation once the `@ts-nocheck`s come off).

---

## 5. Recommended order of attack

1. **P0.1 + P0.2 + P0.3** (half a day): base-URL strategy, `errorMessage()` helper, `alert` → `Alert.alert`. Nothing else is testable on a device until these land.
2. **P0.5** auth gate (1–2 h) — cold start → `(tabs)` when signed in.
3. **P0.4** wire the real exam flow (1–2 days, the big one).
4. **P1.1** make-or-remove the five fake auth screens.
5. **P1.2** fix settings dead routes, wire real logout, delete fake toggles.
6. **P1.2b** put a menu on home → `more` (restores all orphan screens).
7. **P1.3** remove/label mocks (courses fallback, exam review, profile prefill, pravatar).
8. **P1.4** timezone date keys, focus-aware polling, fix `/api/api` double prefix.
9. **P1.6** drop `@ts-nocheck`s, fix ESLint errors, prune unused deps/template files, rename `app.json`, add `.env.example`.
10. Decide the **react-query** question (adopt or remove).

**Bottom line:** it's a strong visual/structural foundation — "is this good?" → the design and wiring of the read-only screens are good, but today this is closer to a *styled prototype with a few live endpoints* than a connected client. The five P0 items above are what turn it into the real thing.
