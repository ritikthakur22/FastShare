# Migration from the old website

How the new site replaces the deployed one at `https://fastshare.ritikthakur.com.np` without losing links, pairings, settings or installed apps. It covers the audit, feature parity, the legacy data, the service-worker handover, the cut-over and rollback, and what other repos must change.

## The old site (audit 2026-11-14)

| Item | Finding |
|---|---|
| Code | `~/testing/websites-project/fastshare/frontend` (vanilla JavaScript, derived from PairDrop), repo `ritikthakur22/FastShare`. The same repo holds the signaling server (`backend/`), deployed on Render |
| Live version | Vercel serves exactly repo HEAD `65334e2` (2026-11-05): the live `index.html` is identical to it. Service-worker cache `fastshare-cache-v1.1.22`. HSTS is sent (`max-age=63072000`); no CSP |
| Uncommitted local changes | The owner's working copy has changes that are not deployed (a version label, autofocus attributes, a zoom lock in the viewport tag, the old app's offline-mode script). They belong to the owner: never touch that repo |
| Render origin | `https://fastshare-ja1a.onrender.com/` also serves the old frontend, because the server serves `frontend/` as static files. After cut-over it stays available as an "old site" peer for interop tests (different origin, separate storage) |
| Old app 1.1.x | Bundles its own copy of the frontend (`www/`, Capacitor `webDir`, no remote URL) and only links to the website in About. Cut-over does not change its UI. Its pairing QR is built from the page address inside the app, so it most likely doesn't encode the website at all; check before relying on it |

## What is reused

Nothing of the implementation (W-001). Only interfaces:
- the wire protocol ([PROTOCOL.md](PROTOCOL.md));
- the link parameters ([PROTOCOL.md → Entry points](PROTOCOL.md#entry-points-and-links));
- the storage formats, read once ([Legacy data inventory](#legacy-data-inventory));
- the service-worker URL, the manifest URL and identity, and the share-target fields (W-010).

The page metadata is written fresh too: the old page still carries upstream author tags and an Open Graph URL of another domain.

## Feature parity with the old site

**Rule:** every feature of the deployed old site exists in the new site, or the owner agreed to change or drop it. An agent who finds an old feature missing from this table adds it here and to [PRD.md](PRD.md#features) before doing anything else.

Statuses: **Kept**: same job. **Changed**: same job, done differently (the reason is in the cited decision). **Dropped (owner)**: needs the owner's approval; listed in [PRD.md → Open questions](PRD.md#open-questions-for-the-owner). **Not carried**: inactive on the deployed site, or not a website feature.

| # | Old site feature | New site | Feature | Status |
|---|---|---|---|---|
| 1 | Finds devices behind the same public IP through the server | same, on the radar | WF1 | Kept |
| 2 | A device appears only after its data channel opens | appears when announced, "Connecting" until the channel opens, "Can't connect directly" after 15 s (W-020) | WF1 | Changed |
| 3 | Device shows display name, device name and a phone, tablet or desktop icon | avatar with name, device line, icon and link badges (same network, paired, room) | WF1 | Kept |
| 4 | Coloured highlights for network, paired and room devices | badges with icon and text, never colour alone | WF1 | Changed |
| 5 | Animated rings in the page background | the radar | WF1 | Changed |
| 6 | Click a device to pick files; right-click or long-press to type a message | tap opens a menu (Files; Photos and videos on phones; Text; Clipboard); right-click and long-press still open Text | WF2, WF4 | Changed |
| 7 | Drop files or text on a device to send | same | WF2 | Kept |
| 8 | Drop or paste anywhere: a share panel; then click one or more devices; cancel | send tray (summary, thumbnails) that stays for several devices, plus Send to all; clear | WF2 | Kept |
| 9 | Edit shared text before sending | Edit in the send tray | WF17 | Kept |
| 10 | Send-text dialog; Ctrl/Cmd+Enter sends | same | WF4 | Kept |
| 11 | Incoming request: sender, file name, count, size, image thumbnail; Accept (Enter), Decline (Esc); requests queue | incoming sheet with the same, plus partial accept | WF3 | Kept |
| 12 | One waiting request per peer; others declined automatically | same (protocol rule) | WF3 | Kept |
| 13 | Received dialog: preview of an image, audio or video; downloads (or shares, on phones) by itself after half a second; download again | received sheet with preview, Save and Share; Save automatically on by default | WF3 | Changed |
| 14 | Several received files are zipped into one download | same, with the setting "Save several files as one zip" (on by default) | WF3 | Kept |
| 15 | iOS Safari declines offers of 200 MB or more | files go to disk, not memory; declines only offers that don't fit (W-008) | WF3 | Changed |
| 16 | Received text with clickable links; Copy (Ctrl/Cmd+C) | same; links built safely | WF4 | Kept |
| 17 | Dialogs for a device close when it leaves, with a message | same | WF1 | Kept |
| 18 | Pair with a 6-digit key or its QR link; paste a key; click the QR to copy the link; cancel; error and rate-limit messages | same, in Link devices → Pair | WF6 | Kept |
| 19 | Paired devices list: names, auto-accept per device, unpair | same | WF6 | Kept |
| 20 | Each tab is its own device; pairing with another tab of the same browser is refused | one active tab per browser (W-013); older tabs still refused | WF6 | Changed (owner) |
| 21 | Public room: create, join by 5-letter code or QR link, copy link, leave, rejoin after reconnect, "in room" badge | same, in Link devices → Public room | WF7 | Kept |
| 22 | Links `?pair_key=` and `?room_id=` | same (non-negotiable) | WF8 | Kept |
| 23 | Links `?init=pair` and `?init=public_room` | same | WF8 | Kept |
| 24 | Share-target redirects `?share_target=text` and `?share_target=files` | still read; the new worker uses `?share_target=inbox` (W-010) | WF8, WF13 | Kept |
| 25 | Links `?base64text=` and `?base64zip=` (text or a zip carried in the link or the clipboard, for command-line and shortcut helpers) | not supported | — | Dropped (owner) |
| 26 | Opening files from the OS (`?file_handler`, launch queue; already removed from the manifest) | not supported | — | Dropped (owner) |
| 27 | Server-assigned random name; edit in place (Enter, Esc); empty brings the random name back; other tabs follow | device card with a rename dialog; same rules; sent to connected devices | WF9 | Kept |
| 28 | Device Icon: Auto detect, Phone, Laptop | Device type: Automatic, Phone, Computer | WF10 | Kept |
| 29 | Theme: Auto, Light, Dark | System, Light, Dark | WF11 | Kept |
| 30 | App Color: 8 presets | the app's six presets plus a custom colour (hue or hex, corrected for contrast); the old choice is imported | WF11 | Changed |
| 31 | Notifications button; notifications while the page is hidden for a request, a text or link (click copies or opens) and finished files (click downloads) | permission from a banner or Settings, never on load; the same three notifications; a click focuses FastShare | WF12 | Kept |
| 32 | Sound when something arrives | a new sound, with a Sound switch | WF12 | Kept |
| 33 | Page title and favicon change when something arrives | same, new assets | WF12 | Kept |
| 34 | Install button when the browser offers installation | Install in Settings, and in the header when offered | WF13 | Kept |
| 35 | Works offline from a cache-first worker | precache with safe updates (W-010) | WF13 | Changed |
| 36 | Share target for files, text and links (Android) | same action and fields | WF13 | Kept |
| 37 | Keeps the screen on during transfers (NoSleep library) | Screen Wake Lock API | WF16 | Changed |
| 38 | Warns before closing the page during a transfer | same | WF16 | Kept |
| 39 | Clipboard history: last 50 texts, Copy | Clipboard history screen: copy, share, delete; imported | WF14 | Kept |
| 40 | Setting: review pasted or shared text before sending | same | WF17 | Kept |
| 41 | Setting: Auto Download (accepts everything, from anyone) | Auto download for paired devices only (W-015) | WF6 | Changed (owner) |
| 42 | Setting: Save to Gallery | no meaning in a browser (it only worked inside the old app) | — | Dropped (owner) |
| 43 | Setting: Signaling Server URL | Settings → Advanced → Server address | WF18 | Kept |
| 44 | Restart App (reloads) | Settings → Restart | WF18 | Kept |
| 45 | Connecting, connected, offline and online messages | connection status line and short messages | WF18 | Kept |
| 46 | Connection hash on hover over a name | connection code in device details and the incoming sheet | WF20 | Kept |
| 47 | About: name, version, licence, source link, privacy policy and terms links | About page: version, source, licences, privacy, terms, developer (GitHub) | WF21 | Kept |
| 48 | Contact e-mail in About | GitHub issues and security advisories only | WF21 | Changed (owner) |
| 49 | Keyboard: Esc closes, Enter accepts, Ctrl/Cmd+Enter sends, Ctrl/Cmd+C copies | same | WF3, WF4 | Kept |
| 50 | 34 languages, picked from the browser | English at launch; translations written fresh later (W-016) | WF25 | Changed (owner) |
| 51 | WebSocket fallback (file bytes through the server) | — | — | Not carried (off on the deployed server; app D-010) |
| 52 | Donation and social buttons configured by `/config` | — | — | Not carried (the deployed site never requests `/config`) |
| 53 | Capacitor scripts loaded by the website | — | — | Not carried (old app only; it bundles its own copy) |
| 54 | Reconnects to the server whenever the browser reports a network-quality change, which drops running transfers (measured 2026-11-15) | reconnects only after real disconnects; open links and running transfers survive (W-021) | WF5, WF18 | Changed (bug fix) |

## URL compatibility

The link formats are defined in [PROTOCOL.md → Entry points](PROTOCOL.md#entry-points-and-links). The guarantees:

1. `https://fastshare.ritikthakur.com.np/?pair_key=NNNNNN` joins the pairing: links from the app's QR codes, the old site's QR codes and links copied from it.
2. `https://fastshare.ritikthakur.com.np/?room_id=xxxxx`, in any case, joins the room.
3. Both work for first-time visitors, for returning visitors still controlled by the old service worker, and from installed apps.
4. Both work while the server wakes up: the action waits.

Why item 3 holds on the first visit after cut-over: the old worker answers only URLs it cached, and a URL with a query string was never cached, so the request reaches the network and gets the new page. WS-2 confirms this on every platform. Test rows: [TESTING.md → Migration and PWA](TESTING.md#6-migration-and-pwa-tests).

## Legacy data inventory

What the old site stores in the browser, at the same origin. These are interface facts, recorded here once.

**IndexedDB `fastshare_store`, version 5**

| Store | Key | Value | Meaning |
|---|---|---|---|
| `keyval` | string keys | `edited_display_name`: string (renamed from `editedDisplayName` by the old site's version-5 upgrade) | the user's chosen device name |
| `room_secrets` | auto-increment | `{ secret, display_name, device_name, auto_accept }`: secret 64–256 ASCII chars, two strings, a boolean; indexes `secret` (unique), `display_name`, `auto_accept` | paired devices |
| `share_target_files` | auto-increment | `{ name, buffer }`: string, ArrayBuffer | files handed over by the old worker's share target |

**localStorage**

| Key | Values | Meaning |
|---|---|---|
| `theme` | `light`, `dark`, or absent | absent = follow the system |
| `setting-color` | `#RRGGBB` | app colour. The old UI wrote its default (`#8FB996`) on first load, so the default can't be told apart from a choice; an older default was `#519E8A` |
| `setting-autodownload` | `"true"` / `"false"` | accept every request without asking, from anyone |
| `setting-gallery` | `"true"` / `"false"` | only meaningful inside the old app |
| `setting-icon` | `auto`, `phone-iphone`, `desktop-mac` | sent to the server as `device_icon` |
| `setting-wss` | string | custom signaling URL, used when longer than 5 characters |
| `approve-share-text` | `"true"` / `"false"` | show pasted or shared text in an editable dialog first |
| `fastshare-clipboard-history` | JSON array of strings, newest first, at most 50 | texts sent and received |
| `edited_display_name` | string | the device name, used only when IndexedDB failed |
| `language_code` | locale code | language override (no selector in the deployed UI) |
| `peer_ids_browser` | JSON array of peer ids | FastShare tabs open in this browser |

**sessionStorage** (per tab): `peer_id`, `peer_id_hash` (server identity of the tab), `public_room_id` (room to rejoin).

**Other:** BroadcastChannel `fastshare` carries `{ type: 'self-display-name-changed', detail }` between tabs. Cache Storage holds `fastshare-cache-<version>` (deployed: `v1.1.22`).

## Data migration

**When:** on the first start of the new site in a browser, before connecting to the server. A flag (`meta.legacyImport` in `fastshare_web`) makes it run once. It must take under a second; a failure never blocks the site (it is noted in the debug report and the site starts with defaults).

**Opening the old database without creating it** (W-012):
1. Call `indexedDB.open('fastshare_store')` with **no version**.
2. If `upgradeneeded` fires, the database did not exist: abort that upgrade transaction. The open fails, nothing is created, and there is nothing to import. Without this step, a browser that never ran the old site would get an empty `fastshare_store` at version 1, and a rollback to the old site would then fail its own upgrade from version 1.
3. Otherwise read the three stores in one read-only transaction and close the database. Never open it with a version number, never add stores.

**Mapping**

| Legacy | New ([ARCHITECTURE.md → Local data](ARCHITECTURE.md#local-data)) | Rule |
|---|---|---|
| `room_secrets` | `pairings` | keep entries whose secret is 64–256 ASCII chars; alias = `display_name` trimmed to 64, or "Paired device"; `deviceName` kept; `autoAccept` = `auto_accept === true`; skip duplicate secrets |
| `keyval.edited_display_name`, else localStorage `edited_display_name` | settings `deviceName` | trimmed, control characters removed, at most 64; empty = use the server's name |
| `theme` | settings `theme` | `light` or `dark`; absent = `system` |
| `setting-color` | settings `accent`, `customHex` | `#8FB996` and `#519E8A` (old defaults) = the default accent; any other valid hex = `custom` with that hex, shown contrast-corrected like the app |
| `setting-icon` | settings `deviceType` | `phone-iphone` = `phone`; `desktop-mac` = `computer`; else `auto` |
| `setting-wss` | settings `serverUrl` | kept only if it is a valid `wss:` URL other than the default |
| `setting-autodownload` | settings `autoDownloadPaired` | `"true"` turns it on and shows a one-time notice that it now covers paired devices only (W-015) |
| `approve-share-text` | settings `reviewText` | `"true"` = on |
| `fastshare-clipboard-history` | `history` text rows | order kept; direction and peer unknown; at most 64 KiB each |
| `setting-gallery`, `language_code` | — | not imported |
| sessionStorage `peer_id`, `peer_id_hash`, `public_room_id` | same keys | used as they are (same tab only), so a reload from old to new code keeps the tab's server identity and room |
| `share_target_files` | send tray | only when the address says `?share_target=files`; the store is cleared after reading |

**Rollback consequences.** The old data is never changed (apart from the two writes allowed in W-012), so a rollback finds the pairings and settings from before the cut-over. Pairings made in the new site are not visible to the old one. Unpairs made in the new site were also sent to the server, so the other device forgot them too; the old site would rejoin an empty room with the stale secret, which is harmless. Pairings made in the old site during a rollback window are not imported on a second cut-over (the import runs once): document this in the rollback note.

**An old tab and a new tab in one browser.** Old tabs keep running old code until reloaded (W-010). Both join the server as separate devices.
- The new site adds its peer id to `peer_ids_browser`, so old tabs treat it as the same browser and refuse to pair with it.
- The new site lists old tabs as "This browser, older tab" and never pairs with them or auto-accepts from them.
- The new site uses its own BroadcastChannel name (`fastshare-web`), so old tabs never get messages they don't expect.
- Settings changed in one are not seen by the other (separate keys). Accepted.

## Service worker and installed-app handover

**The deployed worker** (`/service-worker.js`, cache `fastshare-cache-v1.1.22`):
- install: caches a fixed list (the page as `./` and `index.html`, scripts, styles, images, sounds, language files), then `skipWaiting()`;
- fetch: same-origin GET from the cache first, network on a miss (and the response is then cached under its URL); other origins straight to the network; any POST is the share target: fields `title`, `text`, `url`, files `allfiles`; files go to `fastshare_store.share_target_files`; then it redirects to `/?share_target=files`, or to `/?share_target=text&title=…&text=…&url=…`;
- activate: deletes every other cache and claims the pages;
- it is replaced only when the bytes of `/service-worker.js` change.

**The new worker** (W-010):
- the same URL `/service-worker.js`, scope `/`; its bytes differ, so browsers install it at their next update check (on navigation; browsers skip the HTTP cache for this check by default and check at least once a day);
- install: precache the new hashed assets, then `skipWaiting()`;
- activate: delete caches whose names start with `fastshare-cache-`, claim the pages;
- fetch: page navigations go to the network first, with the precached page as the offline fallback (so a new deploy shows on the next open); hashed assets come from the cache first; POST `/` is the share target (items into `fastshare_web.inbox`, then a redirect to `/?share_target=inbox`); everything else goes to the network;
- `/service-worker.js` must keep answering at that URL for as long as the site exists. What browsers do when a registered worker's script disappears is a check for WS-2, not something to assume.

**A returning visitor** (sequence to confirm in WS-2):

| Visit | What happens |
|---|---|
| First open after cut-over, plain `/` | the old worker serves the old page from its cache; the browser fetches `/service-worker.js`, sees new bytes, installs and activates the new worker, and the old caches are deleted. The old page keeps running |
| First open through `?pair_key=`, `?room_id=` or a share redirect | the old worker has no cached copy of that URL, so the network answers with the new page. Works at once |
| Second open | the new worker serves the new page; the one-time import runs |
| An old tab left open | keeps running old code until reloaded, and interoperates through the server |

**Installed apps (home screen, Android WebAPK):**
- Identity: the old manifest has no `id`, so its identity is its start URL, `/`. The new manifest sets `id: "/"`, `start_url: "/"`, `scope: "/"`: the same app, updated in place.
- The manifest stays at `/manifest.json`.
- The name stays "FastShare". The icons change to the app's icon; some platforms ask the user to confirm an icon change. WS-3 records what users see.
- The share target keeps `action` `/`, POST, `multipart/form-data`, `title`, `text`, `url` and files `allfiles` (`*/*`), so installs still holding the old manifest keep working. If the old worker handles the POST before it is replaced, it redirects to its own formats, which the new site still reads.
- `launch_handler`: the old manifest asks for `focus-existing`. Keep it only if WS-3 shows that shares and links still reach the open window; otherwise use `navigate-existing`.
- Safari on iOS has no share target, so there is nothing to hand over there.

## Cut-over and rollback

**Before** (all owner-visible):
1. Every P0 feature is done, and the interop and migration rows in [TESTING.md](TESTING.md) pass.
2. Rehearsal on a staging origin (WT5.1): deploy the **old** site there, use it on each test device (installs the old worker; pair two browsers; pick a colour; install it as an app on Android), then deploy the new build to the same origin and walk the returning-visitor sequence. Then rehearse a rollback the same way.
3. The owner has answered the open questions that block launch (PRD).

**Cut-over** (owner, in the Vercel dashboard; WT5.2):
1. Connect the existing Vercel project to the new repo (or move the domain to a new project); set `VITE_SIGNALING_URL`; note the current production deployment for rollback.
2. Promote the new build to production.
3. Within 15 minutes, on three devices: a fresh visit; a returning visit with the old worker; `?pair_key=` from the app's QR; text and a 100 MB file both ways with the app and with the old site on the Render origin.

**Rollback:** promote the noted deployment again (Vercel instant rollback). The old worker code returns at `/service-worker.js`; browsers see new bytes and install it; the old site runs on its untouched data. Lost on rollback: only data that existed in the new site (history, items shared during that time, pairings made there).

**After:** watch GitHub issues for two weeks and repeat the smoke test after each deploy (WT5.4). Keep the legacy import code for at least a year; it costs a few milliseconds once per browser. Never delete `fastshare_store` automatically: it belongs to the user's browser profile.

## Follow-ups in other repos

Agents working here can't change those repos; the owner decides.

| Repo | Item | Why |
|---|---|---|
| app | D-019 and ROADMAP Phase 5 put the website rewrite after D-011 and call it optional | this plan does it now; update D-019's timing |
| app | MIGRATION "Website changes for 2.0", items 1 and 3 (16 MiB partitions and a "Get the app" banner in the old site) | the new site covers both; skip them in the old site if the new one launches first. Item 2 (a `LICENSE` in the old repo) still applies |
| app | TRANSFER_PROTOCOL online protocol: `progress` is per-file there, but deployed receivers send the overall fraction; `partition-received.offset` can be an object; old receivers can't take 0-byte files | the spec should match deployed behaviour ([PROTOCOL.md](PROTOCOL.md#differences-from-the-app-spec), rows 1, 2, 5) |
| app | DESIGN_SYSTEM colour table: the dark neutrals differ from `src/ui/tokens.ts` | the site takes its values from `tokens.ts` (W-007); fix the table or the code |
| app | `tools/web_peer.mjs` and `tools/web_files.mjs` drive the live site through its page elements and window events and will break at cut-over | point them at `https://fastshare-ja1a.onrender.com` (old frontend) or replace them with this repo's test peer (WT1.5) |
| app | MIGRATION item 5 removes `puppeteer` from the website repo, but those tools load it from there | settle together with the previous row |
| app | check that the app's signaling reconnect never closes WebRTC links, and that `peer-left` doesn't end a running transfer (W-021) | the same failure the old site has would hit app ↔ site transfers from the app's side |
| old website repo | the deployed site resets its server connection on `navigator.connection` changes and loses transfers (W-021); if the old site stays live for long, a one-line fix there is worth it | users keep losing transfers until cut-over |
| old website repo | add the GPL-3.0 `LICENSE` (app D-019); after cut-over, point the README to the new repo; keep `frontend/` frozen as the rollback source | licence; clarity |
| server | app D-010: keep-alive 25 s / 60 s, `/health`, `lan-endpoint` relay (owner approval) | fewer dropped devices and less mobile data for site users too; the site does not depend on it |
| server | Render's root still serves the old frontend | useful as an interop peer; consider redirecting it to the new domain once interop tests no longer need it |
