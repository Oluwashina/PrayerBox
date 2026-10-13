# PrayerBox · The New Church Ibadan

A mobile-first web app for the prayer team to host and join live, audio-only prayer sessions. Listeners open a link, enter their name and join. They don't need to install an app or create an account.

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, React Router, Vite
- **Session data, host sign-in, and access rules:** Supabase (Postgres with row-level security, Auth, Realtime, Edge Functions)
- **Live audio:** LiveKit Cloud (`livekit-client` in the browser; `livekit-server-sdk` in Edge Functions)

```bash
npm install
npm run dev          # http://localhost:5173
npm run typecheck    # frontend + edge functions
npm run build
```

Until the Supabase values below are set, the app shows a setup screen.

## How it fits together

```
Browser ──(publishable key, RLS)──► Supabase Postgres    sessions: read by all, written by hosts
   │                                    ▲
   │ functions.invoke                   │ service role
   ▼                                    │
Supabase Edge Functions ────────────────┘
   room-token       checks the session is live, the caller's role, bans and speaker grants → short-lived LiveKit token
   room-moderate    raise hand, list participants, allow or revoke speaking, mute, remove (host-only actions are checked on the server)
   session-control  start (creates the LiveKit room), end (deletes the room), change mode (revokes publishing on the server)
   │
   ▼  LiveKit API key and secret (Supabase secrets only)
LiveKit Cloud ◄──── WebRTC audio ────► Browser
```

- **Hosts** sign in with Supabase Auth (email and password) and must be listed in the `hosts` table. Their LiveKit identity is `host_<user id>`, and they can publish their microphone.
- **Guests** don't sign in. The server gives each one a random `guest_<uuid>` identity, signed with HMAC and kept in the tab's `sessionStorage`. This means a guest can't take on someone else's identity, and a host's ban sticks to that guest.
- **Permissions:** tokens grant microphone-only publishing, and only to hosts and approved speakers in interactive sessions. Data messages and metadata self-updates are off. Raising a hand goes through the server.
  - Speaker grants and bans are stored in Postgres, so they survive a reconnect.
  - Switching to broadcast mode or ending the session revokes publishing on the server.
- **Session status:** a database trigger enforces scheduled → live or cancelled, and live → ended. A room token is only issued while the session is live.

## Setup

### 1. Supabase project
1. Create a project at [supabase.com](https://supabase.com).
2. Apply the schema. Either paste `supabase/migrations/20261013000000_prayer_platform.sql` into **SQL Editor** and run it, or use:
   ```bash
   npx supabase login
   npx supabase link --project-ref <your-project-ref>
   npm run db:push
   ```
3. **Authentication → Sign In / Providers:** keep Email enabled and **turn off "Allow new users to sign up"**, so only people you invite can become hosts.
4. **Authentication → Users → Add user:** create each host with an email and password (tick "Auto confirm"). Then make them a host in the SQL Editor:
   ```sql
   insert into public.hosts (user_id, display_name)
   select id, 'Pastor Ade' from auth.users where email = 'ade@example.com';
   ```
5. **Project Settings → API:** copy the project URL and the publishable (or anon) key into `.env.local`:
   ```
   VITE_SUPABASE_URL=https://<ref>.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```

### 2. LiveKit Cloud project
1. Create a project at [cloud.livekit.io](https://cloud.livekit.io).
2. **Settings → API Keys:** create a key and note the WebSocket URL (`wss://<project>.livekit.cloud`), the API key and the API secret.

### 3. Server secrets and functions
The LiveKit secret never goes in `.env.local` or the browser.

```bash
npx supabase secrets set \
  LIVEKIT_URL=wss://<project>.livekit.cloud \
  LIVEKIT_API_KEY=API... \
  LIVEKIT_API_SECRET=... \
  GUEST_SIGNING_SECRET=$(openssl rand -hex 32) \
  ALLOWED_ORIGINS=http://localhost:5173,https://<your-site>

npm run functions:deploy
```

`ALLOWED_ORIGINS` is optional. Without it, the functions accept requests from any origin. Docker is not needed to deploy.

### 4. Try it
1. Run `npm run dev`, sign in at `/host/sign-in`, create a session and press **Start**.
2. Open the room, and allow the microphone when the browser asks.
3. Open the share link in a **different browser or a private window** (or on a phone), enter a name and join. You should hear the host.
4. For interactive mode: switch the session to Interactive. The guest taps **Ask to speak**, then the host taps **Allow** in the participant list. The guest can then unmute and be heard.

To test from a phone on your network, run `npm run dev -- --host`. Phones only allow microphone access on HTTPS or `localhost`, so test on the deployed site or through an HTTPS tunnel.

## Deploying the frontend
It's a static Vite build (`npm run build` produces `dist/`). It works on Netlify, Vercel, Cloudflare Pages and similar hosts.

- Set the two `VITE_SUPABASE_*` variables in the host's environment settings.
- Add a single-page-app fallback that rewrites everything to `/index.html`.
- Add the site's URL to `ALLOWED_ORIGINS`.

## Project layout

```
src/
  domain/                     types and pure helpers
  services/
    supabase/                 SessionService + AuthService (Postgres, Realtime, Auth)
    moderationService.ts      host moderation through the room-moderate function
    audio/livekitClient.ts    LiveKit room: connect, reconnect, mic, devices, levels, autoplay
  hooks/  components/  pages/
supabase/
  migrations/                 schema, RLS, status trigger
  functions/                  room-token, room-moderate, session-control (+ _shared)
```
