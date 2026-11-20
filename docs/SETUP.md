# Setup, Builds and Releases (website)

How to run, test, deploy and release the new site. Stack and hosting are decided in W-002 and W-004.

> **Status:** nothing is scaffolded yet (task WT1.1). The commands below become valid once that task lands. Until then this file is the target.

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Node.js | 22.18+ or 24 LTS | the same range as the app repo |
| npm | bundled | lockfile committed; CI uses `npm ci` |
| Chromium and Firefox | current | installed by Playwright (`npx playwright install chromium firefox`) |
| The old website repo | local copy at `~/testing/websites-project/fastshare` | provides the signaling server for local tests. Read-only: it holds the owner's uncommitted changes |
| Devices for the manual matrices | an Android phone, an iPhone, a laptop | [TESTING.md](TESTING.md#5-browser-matrix) |

## First run

```bash
npm ci
npm run dev            # Vite dev server on http://localhost:5173
```

The dev build connects to the production signaling server unless `VITE_SIGNALING_URL` says otherwise (see below).

## Scripts

| Script | Does |
|---|---|
| `npm run dev` | Vite dev server with reload |
| `npm run build` | type-check, then the production build into `dist/` (page, hashed assets, `/service-worker.js`) |
| `npm run preview` | serves `dist/` locally, with the service worker |
| `npm run typecheck` | `tsc --noEmit` (strict) |
| `npm run lint` | ESLint and Prettier check, plus the colour-literal and HTML-string checks ([CODE_STYLE.md](CODE_STYLE.md)) |
| `npm test` | Vitest: protocol, core, palette, migration ([TESTING.md](TESTING.md#1-unit-and-protocol-tests)) |
| `npm run test:e2e` | Playwright against `dist/` and the local signaling server ([TESTING.md](TESTING.md#3-integration-tests)) |
| `npm run size` | fails when the build exceeds the budget in [ARCHITECTURE.md](ARCHITECTURE.md#performance-budget) |

## Configuration

| Variable | Where | Default |
|---|---|---|
| `VITE_SIGNALING_URL` | `.env.local` for development (git-ignored); Vercel project settings for Preview and Production | `wss://fastshare-ja1a.onrender.com/server` (W-005) |

There are no secrets. Never commit a personal server URL as the default.

## Local signaling server and browser flags

Run the existing server from the old repo (don't change anything there):

```bash
cd ~/testing/websites-project/fastshare && npm ci && npm start     # ws://localhost:3000/server
```

Then point the site at it: `VITE_SIGNALING_URL=ws://localhost:3000/server npm run dev`. The server puts every private address into one IP room, so all local browsers see each other.

**WebRTC on one machine.** Browsers hide local addresses behind mDNS names, which often fail to resolve between two headless browsers. The Playwright config starts them with host candidates exposed:
- Chromium: `--disable-features=WebRtcHideLocalIpsWithMdns`
- Firefox: preference `media.peerconnection.ice.obfuscate_host_addresses` set to `false`

**The W-021 cases** (I5, I6 in TESTING) use Chromium's DevTools protocol to change the emulated network conditions, and Playwright's WebSocket routing to block and release the signaling socket.

**An old-site peer** for manual interop: open `https://fastshare-ja1a.onrender.com/` in another browser profile ([MIGRATION.md](MIGRATION.md#the-old-site-audit-2026-11-14)).

## Vercel

| Setting | Value |
|---|---|
| Project | the existing project that owns `fastshare.ritikthakur.com.np`, connected to the new repo (W-004; confirm in WT5.1 that old deployments stay available) |
| Framework preset | Vite |
| Build command / output | `npm run build` / `dist` |
| Environment variables | `VITE_SIGNALING_URL` for Production and Preview |
| Headers, cache rules, rewrites | `vercel.json` in the repo ([SECURITY.md](SECURITY.md#headers), [ARCHITECTURE.md](ARCHITECTURE.md#hosting-on-vercel)) |
| Web Analytics, Speed Insights | off (W-017) |

Every PR gets a preview URL. A preview is its own origin: its own storage and its own service worker. Links it shows (`?pair_key=`) point at the preview, so the app's scanner won't accept them; that is expected.

**Staging for the handover rehearsal (WS-2, WT5.1):** a second Vercel project or a fixed preview domain that can serve the old repo's `frontend/` first and the new build afterwards, on the same origin.

## CI

`.github/workflows/ci.yml`, on every push and PR:

```
ubuntu-latest:
  npm ci → typecheck → lint → test → build → size
  → check out the old website repo at a pinned commit → start its server on :3000
  → playwright (chromium, firefox) with axe checks → upload traces on failure
```

Deploys are done by Vercel's Git integration, not by CI. `npm audit --omit=dev` runs as a report.

## Release checklist

1. Typecheck, lint, unit and end-to-end tests are green; the size budget holds.
2. The rows of the matrices that the change touches have run ([TESTING.md](TESTING.md#10-what-ci-proves-and-what-it-doesnt)).
3. Bump the version in `package.json` (shown in About).
4. Merge to `main`; Vercel builds production.
5. Smoke test on the live site: a fresh visit, a returning visit, a `?pair_key=` link, text and one file with the app.

The first release is the cut-over; its own checklist is in [MIGRATION.md](MIGRATION.md#cut-over-and-rollback).
