# Backend patch for the live LUA V6 app (luav6 repo)

`luav6-mobile-api.patch` adds the **mobile API** to `SorenOutis/luav6` — the
only backend change needed for the LSI mobile app to fetch live from
`https://lsi.koamishin.com` instead of a local dev server.

## What it does

- New JSON surface at **`/api/mobile/*`** (routes/api.php) — stateless, no
  CSRF, no session. The web app (sessions + Inertia + CSRF) is untouched.
- **Token login**: `POST /api/mobile/auth/login` (email + password, optional
  `two_factor_code`) returns `{ token, user }`. The token is a personal
  access token (only its SHA-256 hash is stored); it is sent as
  `Authorization: Bearer <token>` and revoked by `POST /api/mobile/auth/logout`.
- **2FA**: login reuses Fortify's own TOTP verification and recovery codes,
  so the same authenticator app works for web and mobile.
- **Data endpoints** reuse the exact same controller methods the web app
  calls (dashboard, exams + take-flow, assignments, calendar, courses,
  grades, leaderboard, chats, NGL, profiles, XP, section join, profile
  update, password change, 2FA management).
- One migration adds an `api_tokens` table.
- Pest tests cover the whole flow (see `tests/Feature/MobileApiTest.php`).

## Apply it (on your machine, in the luav6 repo)

```bash
cd luav6
git fetch origin && git checkout main && git pull
git checkout -b mobile-api
git am /path/to/luav6-mobile-api.patch
# sanity check (needs PHP 8.2+ and Composer deps installed) — same as CI
composer ci:check      # npm lint/format/types + Pint lint:check + php artisan test
git push -u origin mobile-api
# open a pull request, watch CI (composer ci:check), then merge
```

## After merging: redeploy

Redeploy the production app on Render (the Dockerfile runs migrations
automatically on boot). The mobile app then works against
`https://lsi.koamishin.com` with `EXPO_PUBLIC_API_URL` already set to it.

## Alternative: give the Arena agent access

If you'd rather I open the PR and iterate on CI myself, add
`arena-ai-coding-agent[bot]` as a collaborator (write access) on the
`SorenOutis/luav6` repo (Settings → Collaborators).
