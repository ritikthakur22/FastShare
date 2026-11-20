# Architecture

How the new site is put together. The reasons behind each choice are in [DECISIONS.md](DECISIONS.md), cited by ID. What goes over the wire is in [PROTOCOL.md](PROTOCOL.md).

## System overview

```
┌──────────────────────── Browser tab (one active tab per browser, W-013) ─────────────────────────┐
│  UI (Preact)        src/screens ─► src/ui                                                         │
│  Core (plain TS)    src/core: signaling · peers · rooms · rtc · send · receive · storage · ...    │
│  Protocol (pure)    src/protocol: validators, builders, links, codecs                             │
│  Worker             OPFS writer (receive sink, W-008)                                             │
│  Service worker     /service-worker.js: precache, share target, notifications (W-010)            │
└───────┬───────────────────────────┬────────────────────────────────┬────────────────────────────┘
        │ HTTPS (static files)      │ WSS (signaling, W-005)          │ WebRTC data channel (DTLS)
        ▼                           ▼                                 ▼
┌──────────────────┐      ┌─────────────────────────────┐      ┌──────────────────────────────────┐
│ Vercel (static)  │      │ Signaling server             │      │ Other device: new site, old site, │
│ W-004            │      │ Render now (app D-010)       │      │ app 2.0, old app 1.1.x             │
└──────────────────┘      │ Cloudflare later (app D-011) │      └──────────────────────────────────┘
                          └─────────────────────────────┘        STUN/TURN from ws-config (app D-012)
```

No FastShare server stores anything. The signaling server keeps room membership in memory and relays setup messages; file bytes go device to device.

## Stack

Vite, Preact with hooks, TypeScript strict, plain CSS with custom properties (W-002). Stores without a library (W-003). Service worker with `vite-plugin-pwa` in `injectManifest` mode. Unit tests with Vitest, browser tests with Playwright ([TESTING.md](TESTING.md)).

## Repository layout

```
fastsharewebn/                     repo root (GitHub name: owner question, PRD)
├── AGENTS.md  README.md  LICENSE   entry points (AGENTS.md first)
├── index.html                      app shell; no inline script or style (W-018)
├── privacy.html  terms.html        static pages (if the owner agrees, PRD question 6)
├── public/
│   ├── manifest.json               same URL as the old site (W-010)
│   ├── theme.js                    render-blocking first-paint palette (W-018)
│   ├── icons/                      PWA icons, favicon.svg, notification badge
│   ├── sounds/                     arrival sound (new asset, W-001)
│   └── robots.txt
├── src/
│   ├── main.tsx                    startup (Flows → Startup)
│   ├── strings.ts                  every UI string, keyed by feature (W-016)
│   ├── protocol/                   PURE TypeScript: no DOM, no I/O, runs under Node
│   │   ├── server.ts               signaling messages: types, validators, builders
│   │   ├── channel.ts              data-channel messages: types, validators, builders
│   │   ├── links.ts                entry-point parameters and created links
│   │   ├── webText.ts  fileName.ts  format.ts     copied from the app (W-007)
│   │   ├── connectionCode.ts       cyrb53 connection code
│   │   ├── legacy.ts               validators and mapping for old-site storage
│   │   └── fixtures/web-v1/        recorded messages (PROTOCOL.md → Fixtures)
│   ├── core/                       app logic; browser APIs behind small adapters; no Preact
│   │   ├── signaling.ts  peers.ts  rooms.ts  rtc.ts
│   │   ├── send.ts  receive.ts  save.ts  zip.ts
│   │   ├── sinks/                  opfs.worker.ts, opfs.ts, memory.ts, folder.ts
│   │   ├── db.ts  settings.ts  history.ts  inbox.ts  migration.ts
│   │   ├── tabs.ts  notify.ts  wakeLock.ts  log.ts
│   ├── ui/                         tokens.css, palette.ts (copied colour functions), components
│   ├── screens/                    Nearby, Activity, Settings, LinkDevices, sheets, pages
│   └── sw/service-worker.ts        built to /service-worker.js
├── tests/                          Playwright tests (two browser contexts + local server)
├── tools/                          test peer for interop and fixture recording (WT1.5)
├── docs/                           this documentation
├── vercel.json                     headers, cache rules, rewrites (W-004)
└── .github/workflows/ci.yml        SETUP.md
```

## Layer rules

| Layer | May import | Must not |
|---|---|---|
| `src/screens` | `src/core`, `src/ui`, `src/strings.ts` | open sockets, parse wire messages, touch storage directly |
| `src/ui` | `src/ui` only (plus `src/strings.ts`) | import `src/core` or know about peers |
| `src/core` | `src/protocol` | import Preact or anything under `src/ui` or `src/screens` |
| `src/protocol` | nothing outside itself | use the DOM, timers, storage or the network |
| `src/sw` | `src/protocol` | import UI code |
| workers | `src/protocol` | touch the DOM |

## Modules

| Unit | Responsibility |
|---|---|
| `signaling` | WebSocket to the server: URL with parameters, join order, `pong`, reconnect with backoff after real disconnects only, queue of link actions until the server answers ([PROTOCOL.md](PROTOCOL.md#signaling-connection)). Owns no WebRTC objects (W-021) |
| `peers` | One entry per peer id: rooms, names, device line, connection state, older-tab marker; the store the radar reads |
| `rooms` | Pairing flow, paired list, unpair, secret-room events, public rooms, `public_room_id` |
| `rtc` | One `RTCPeerConnection` per peer, caller rule, data-channel wiring, name on open, connection code, eager limit (W-020). Links live until their channel closes or the no-room rule ends them; signaling state never closes them (W-021) |
| `send` | Send queue per peer: `request`, thumbnail, headers, chunks, flow control, partitions, waits, cancel (W-009) |
| `receive` | Request checks, accept policy, sink choice, header checks, write buffer, acknowledgements, overall progress |
| `sinks` | Where received bytes go: OPFS writer worker, memory, chosen folder (W-008) |
| `save` | Hands finished files to the user: download link, Web Share, folder; temporary-file cleanup |
| `zip` | Streams several files into one zip (store only), loaded on demand |
| `db`, `settings`, `history`, `inbox` | IndexedDB and localStorage access ([Local data](#local-data)) |
| `migration` | One-time import of the old site's data ([MIGRATION.md](MIGRATION.md#data-migration)) |
| `tabs` | Web Lock for the active tab; `peer_ids_browser` bookkeeping (W-012, W-013) |
| `notify` | Notifications through the service worker, sound, title and favicon badge, permission state |
| `wakeLock` | Screen Wake Lock while a transfer runs; reacquired when the page becomes visible |
| `log` | Capped in-memory event log for "Copy debug info", redacted ([SECURITY.md](SECURITY.md#privacy)) |

## Flows

### Startup

1. `/theme.js` (render-blocking, in `<head>`) applies the cached palette before the first paint (W-018).
2. `main.tsx` checks the required APIs (W-019). Missing: the unsupported-browser page.
3. `tabs` requests the Web Lock. Not granted: the "open in another tab" screen with "Use here".
4. `db` opens `fastshare_web`. `migration` runs once.
5. `links` reads the entry-point parameters and strips them from the address bar.
6. The UI renders; `signaling` connects; the service worker is registered; a `share_target` parameter makes `inbox` fill the send tray.

### Discovery and connection

`signaling` receives `peers` / `peer-joined` → `peers` adds the device in "Connecting" → `rtc` calls (caller) or waits (callee) → channel opens → `display-name-changed` both ways → the device is ready. No open channel after 15 s → "Can't connect directly". `peer-left` removes rooms; the no-room rule in [PROTOCOL.md](PROTOCOL.md#peers-and-connections) decides when the link and the device go.

### Connection lifecycle (W-021)

The signaling socket and the WebRTC links are separate lifetimes:

```
socket:  open ──(close / error)──► retrying ──► open again (same peer id) ──► rooms re-confirmed
links:   open ───────────────────────────────────────────────────────────────► open (untouched)
```

- Nothing but a real disconnect restarts the socket. `navigator.connection` is never observed: Chromium fires its `change` event during transfers as the bandwidth estimate moves, and the old site's reconnect on that event lost running transfers (measured 2026-11-15).
- A reconnect never closes, recreates or renegotiates a link. A transfer keeps running while the socket is down; only its own data channel closing, or a protocol timeout, can stop it.
- Status shown to the user follows the socket ("Connecting to the FastShare server…"), but devices with an open link stay tappable meanwhile.

### Send

```
tray items + device tap
 → send: skip 0-byte files, build request (thumbnail: first image scaled to ≤ 400 px wide)
 → request ─► wait for files-transfer-response (Cancel = close the channel)
 → for each file: header → 64,000-byte chunks (pause above 1 MiB buffered)
                 → partition every 16 MiB → wait partition-received (60 s)
                 → wait file-transfer-complete (60 s)
 → ring and Activity show bytes sent minus bufferedAmount
```

### Receive

```
request ─► checks (one per peer, sizes, ≤ 1000 files) ─► capacity check (W-008)
 → paired + Auto download? accept : incoming sheet (queued)
 → files-transfer-response
 → header ─► sink.open(file) ─► chunks ─► write buffer (≤ 64 MiB) ─► sink
 → partition ─► flush ─► partition-received
 → progress (overall, ≥ 0.5% steps) ─► file-transfer-complete per file
 → received sheet (Save / Share) or automatic save; zip when several and the setting is on
```

### Pairing and public rooms

Server-key pairing and room flows are in [PROTOCOL.md → Pairing and public rooms](PROTOCOL.md#pairing-and-public-rooms). A pairing is stored only after the other peer appears in the secret room; its secret goes into `room-secrets` on every connect.

### Share target

```
Android share sheet ─► POST / (multipart: title, text, url, allfiles)
 → service worker stores the items in fastshare_web.inbox
 → 303 to /?share_target=inbox ─► page reads and clears the inbox ─► send tray
```

The old worker's redirect formats (`?share_target=text&…`, `?share_target=files`) are still read ([PROTOCOL.md](PROTOCOL.md#entry-points-and-links)).

### Update

A new deploy changes the precache list, so `/service-worker.js` changes. The browser installs it in the background; it activates at once (`skipWaiting`). Page navigations are network-first, so the next open shows the new version. If a page has been open for more than 24 hours and no transfer runs, a small "Update ready · Reload" message appears. Pages are never reloaded automatically.

## Data path in the browser

### Sending

Files from the picker, drag and drop, paste and the share-target inbox are disk-backed `File` objects. `send` reads 1 MiB slices with `slice().arrayBuffer()` and splits them into 64,000-byte messages, so memory holds at most the slice plus the channel buffer (about 2 MiB per transfer). Thumbnails are made once per request.

### Receiving

`receive` picks one sink per transfer (W-008):

| Sink | Where it works | How |
|---|---|---|
| Folder (P2, WF23) | Chromium on desktop, after the user picks a folder in Settings | `FileSystemDirectoryHandle` kept in IndexedDB; files written with `createWritable()`; nothing to save afterwards |
| OPFS | browsers with the origin private file system and sync access handles in workers | a dedicated worker receives transferred `ArrayBuffer`s and writes with `createSyncAccessHandle()`; the page later reads the disk-backed `File` |
| Memory | fallback when OPFS is unavailable (some private windows) | chunks kept until the file completes; capped (W-008, WS-5) |

Rules for every sink:
- Unwritten data is capped at 64 MiB per transfer; above that the transfer fails cleanly (old senders never pause).
- Capacity is checked before accepting: `navigator.storage.estimate()` for OPFS (offer size plus 10% must fit, doubled when a zip will be made), the cap for memory.
- Temporary files: `/incoming/<transferId>/<index>` in OPFS, zips in `/zips/<transferId>.zip`. They are deleted after saving, after 24 hours, or with Settings → Storage → Clear. Startup removes orphans.

WS-1 measures throughput, memory and saving per browser; its results go into W-008 and may change this table.

### Saving

- **Download:** an `<a download>` link to an object URL of the disk-backed file. One file saves as itself; several save as one zip when "Save several files as one zip" is on (default), otherwise one download each.
- **Share (phones):** `navigator.share({ files })` where `navigator.canShare` allows it.
- **Save automatically:** on by default, as the old site behaved; runs after the last file. Browsers may ask once before allowing several downloads.
- **Zip:** a streaming writer (`client-zip`, store only) reads the finished files and writes the zip into OPFS; the originals are deleted after the zip is saved. Name format: owner question 11 in [PRD.md](PRD.md#open-questions-for-the-owner).

## Local data

All data stays in the browser (W-012, W-017).

**localStorage**

| Key | Content |
|---|---|
| `fs.settings` | JSON settings, schema version `v: 1` (table below) |
| `fs.palette` | JSON of the computed colour variables for the current choice, light and dark; written on every appearance change; read by `/theme.js` |
| `peer_ids_browser` | legacy key, shared with old tabs: the site adds and removes its own peer id (W-012) |

**Settings (`fs.settings`)**

| Field | Type | Default | Set in |
|---|---|---|---|
| `deviceName` | string ≤ 64, or null | null (use the server's name) | device card, Settings |
| `deviceType` | `auto` \| `phone` \| `computer` | `auto` | Settings |
| `theme` | `system` \| `light` \| `dark` | `system` | Settings → Appearance |
| `accent` | `signal` \| `cobalt` \| `violet` \| `ember` \| `rose` \| `graphite` \| `custom` | `signal` | Settings → Appearance |
| `customHue` | number 0–359 | 200 | Settings → Appearance |
| `customHex` | `#RRGGBB` or null | null | Settings → Appearance; wins over `customHue` when set |
| `autoDownloadPaired` | boolean | false | Settings → Receiving |
| `autoSave` | boolean | true | Settings → Receiving |
| `zipMultiple` | boolean | true | Settings → Receiving |
| `notify` | boolean | true (the permission is still asked from a tap) | Settings → Receiving |
| `sound` | boolean | true | Settings → Receiving |
| `reviewText` | boolean | false | Settings → Sending |
| `keepTextHistory` | boolean | true | Settings → Storage |
| `serverUrl` | `wss:` URL or null | null (build default) | Settings → Advanced |

**sessionStorage** (per tab, the old site's keys and meaning): `peer_id`, `peer_id_hash`, `public_room_id`.

**IndexedDB `fastshare_web`, version 1**

| Store | Key | Value |
|---|---|---|
| `pairings` | `id` (UUID) | `{ id, secret, alias, deviceName, autoAccept, createdAt, lastSeenAt }`; index `secret` (unique) |
| `history` | `id` (UUID) | `{ id, direction: 'out' \| 'in' \| null, peerAlias \| null, kind: 'files' \| 'text', files?: [{ name, size, mime, state, opfsPath? }], text? (≤ 64 KiB), state, error?, createdAt, finishedAt? }`; index `createdAt`; the newest 500 rows are kept |
| `inbox` | auto-increment | `{ at, title?, text?, url?, files?: File[] }` from the share target; cleared when read |
| `meta` | `key` | `legacyImport` (time and counts), `folderHandle` (WF23) |

Clipboard history is the `history` rows of kind `text`. With `keepTextHistory` off, new text rows store no body and existing bodies are removed.

Room secrets sit in IndexedDB: browsers have no secret store a page can use. The main threat to them is injected script, which the CSP blocks ([SECURITY.md](SECURITY.md#local-data-and-secrets)).

## Configuration

| Setting | Where | Default |
|---|---|---|
| Signaling URL | `VITE_SIGNALING_URL` at build time; Settings → Advanced at run time (W-005) | `wss://fastshare-ja1a.onrender.com/server` |
| ICE servers | the server's `ws-config` message | whatever the server sends |
| Public origin for links | the page's own origin | `https://fastshare.ritikthakur.com.np` in production |

There are no secrets in the site and no `.env` with real values in the repo.

## Service worker and installed app

- Built from `src/sw/service-worker.ts` to `/service-worker.js`, scope `/` (W-010). Handover from the old worker: [MIGRATION.md](MIGRATION.md#service-worker-and-installed-app-handover).
- Precache: the hashed build assets plus the shell page, icons and sound (list injected at build time).
- Routes: navigations network-first with the cached shell as offline fallback; hashed assets cache-first; POST `/` = share target; other requests to the network.
- Notifications: shown with `registration.showNotification`; a click focuses an open FastShare window or opens one.
- Manifest `/manifest.json`: `id` `/`, `start_url` `/`, `scope` `/`, `display` `standalone`, name "FastShare", new icons (any and maskable), `theme_color` and `background_color` from the default palette, `share_target` as in W-010, `launch_handler` per WS-3.

## Hosting on Vercel

- Build: `npm run build`; output `dist/`; framework preset Vite; Node as in [SETUP.md](SETUP.md#prerequisites).
- `vercel.json`: security headers ([SECURITY.md](SECURITY.md#headers)); cache rules: `/assets/*` immutable for a year; `/`, `/index.html`, `/service-worker.js`, `/manifest.json` and `/theme.js` with `no-cache`; rewrite of unknown paths to `/index.html`.
- Preview deployments get their own `*.vercel.app` origins, each with its own storage and service worker; they use the production signaling server unless their environment says otherwise.
- Off: Web Analytics, Speed Insights, image optimisation, serverless functions (W-004, W-017).

## Error handling

Failures carry a code; UI copy maps from the code, never from an exception message.

| Code | Meaning | Typical copy |
|---|---|---|
| `server_unreachable` | no signaling connection for 90 s | "Can't reach the FastShare server. Check your connection." |
| `no_direct_connection` | data channel didn't open in 15 s | "Couldn't connect directly to Teal Fox." |
| `peer_gone` | the device left during a transfer | "Teal Fox left before the transfer finished." |
| `declined` | the receiver said no | "Teal Fox declined." |
| `too_big` | declined with `ios-memory-limit`, or our own capacity check | "This browser can't store that much at once. Send fewer or smaller files." |
| `storage_full` | the sink ran out of space while writing | "Your browser storage is full." |
| `mismatch` | headers or sizes differ from the offer | "The files didn't match what was offered." |
| `timeout` | a wait in [PROTOCOL.md](PROTOCOL.md#sending-files) ran out | "Teal Fox stopped answering." |
| `cancelled` | either side cancelled (channel closed) | "Cancelled." |
| `unsupported` | a needed API is missing | unsupported-browser page |

Retries: none automatic for transfers (no resume online, app D-007); the user sends again. Signaling reconnects by itself after real disconnects only, without touching open links ([Connection lifecycle](#connection-lifecycle-w-021)).

## Performance budget

| Metric | Target | How it's measured |
|---|---|---|
| Initial JavaScript (gzip) | ≤ 45 KB | `npm run size` in CI |
| Initial CSS (gzip) | ≤ 12 KB | same |
| First-load transfer, without icons and lazy chunks | ≤ 80 KB | DevTools network panel |
| Web fonts | none (system fonts) | — |
| Largest Contentful Paint, Lighthouse mobile preset | ≤ 1.8 s | Lighthouse, run per release |
| Cumulative Layout Shift | ≤ 0.02 | same |
| Interaction to Next Paint | ≤ 200 ms on a mid-range Android phone | DevTools performance panel |
| Lighthouse scores | Performance ≥ 95, Accessibility 100, Best Practices 100 | same |
| Repeat visit with the service worker | shell shown ≤ 1 s | same |
| Radar and progress animation | 60 fps on a mid-range phone; only `transform` and `opacity` animate (plus the ring's stroke offset) | performance panel |
| Main thread during a transfer | no task over 50 ms from transfer code; progress updates ≤ 10 per second | performance panel |
| Memory while receiving 2 GB on the OPFS path | tab under 300 MB | WS-1, [TESTING.md](TESTING.md#8-performance-tests) |
| Throughput browser ↔ browser, same network | ≥ 90% of the old site's, same devices and link | [TESTING.md](TESTING.md#8-performance-tests) |
