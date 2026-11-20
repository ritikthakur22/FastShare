# Decision Records (website)

Every architectural choice for the new website lives here, once. Other docs cite decisions by ID (`W-008`) and never restate the rationale. Decisions of the native app are cited as "app D-0xx" and live in the app's [DECISIONS.md](../../fastshare-n/docs/DECISIONS.md).

**Statuses** (same meaning as in the app):
- **Approved**: the owner chose it, or delegated the choice. Build on it.
- **Proposed**: recommended, not yet confirmed by the owner. Build on it, but keep it easy to change.
- **Superseded**: replaced; kept for history.

Every decision below is **Proposed** (planning session, 2026-11-14). Where a spike (WS-n, [ROADMAP.md](ROADMAP.md#spikes)) must confirm details, the decision says so. Don't build on those details until the spike result is written into the decision.

Changing a decision means editing its entry, changing its status, and adding a line to the change log at the bottom.

| ID | Decision | Status |
|---|---|---|
| W-001 | Clean-room rewrite under GPL-3.0-or-later, in a new repo; the old repo keeps the backend and its notices | Proposed |
| W-002 | Stack: Vite + Preact + TypeScript, plain CSS with custom properties | Proposed |
| W-003 | State: framework-free stores in `src/core` plus one small hook; no state library | Proposed |
| W-004 | Hosting: static build on the existing Vercel project; headers in `vercel.json`; no server code | Proposed |
| W-005 | Signaling URL: build-time default, user override in Settings, no `/config` request | Proposed |
| W-006 | Protocol: legacy web protocol v1 as deployed; strict on send, tolerant on receive | Proposed |
| W-007 | Share pure protocol code with the app by copying small files, plus shared fixtures | Proposed |
| W-008 | Receive path: disk-backed sinks (OPFS worker, optional folder), memory only as a capped fallback | Proposed (details: spikes WS-1, WS-5) |
| W-009 | Send path: disk-backed reads, 64,000-byte chunks, 1 MiB buffer limit, 16 MiB partitions with acknowledgement | Proposed |
| W-010 | PWA handover: service worker at `/service-worker.js`, manifest at `/manifest.json` with `id` `/`, same share-target action and fields | Proposed (details: spikes WS-2, WS-3) |
| W-011 | Layout: floating pill tab bar on phone and tablet; two panes (radar + Activity) on desktop | Proposed |
| W-012 | Local data: new IndexedDB `fastshare_web` + one settings key; legacy data copied read-only, never upgraded | Proposed |
| W-013 | One active FastShare tab per browser (Web Locks) | Proposed |
| W-014 | No QR scanner in the site; QR codes drawn as SVG by a small encoder | Proposed |
| W-015 | Auto download only for paired devices | Proposed (needs owner confirmation) |
| W-016 | English only at launch; translations written fresh later | Proposed (needs owner confirmation) |
| W-017 | No analytics, trackers or third-party requests besides the signaling server and the ICE servers it names | Proposed |
| W-018 | Strict CSP; `connect-src 'self' wss:`; first-paint theme from a same-origin boot script | Proposed |
| W-019 | Browser support: current evergreen browsers, Safari/iOS 16.4+, everything else gets an "update your browser" page | Proposed |
| W-020 | Devices appear when the server announces them, with a connection state; eager connections capped at 20 | Proposed |
| W-021 | Signaling and WebRTC links are independent: reconnect only on a real disconnect, never on network-quality changes; open links survive a signaling reconnect | Proposed (measured bug in the old site) |

---

## W-001 Clean-room rewrite, GPL-3.0-or-later, new repo

**Context.**
- The current website and its signaling server are derived from PairDrop (GPL-3.0). The app made the same call for itself in app D-003, and app D-019 says the website keeps its upstream notices until it is rewritten.
- The owner now wants the website rewritten (this plan), before app D-011. That changes the timing in app D-019 and app ROADMAP Phase 5; the follow-up is listed in [MIGRATION.md](MIGRATION.md#follow-ups-in-other-repos).

**Decision.**
- The new site contains no code, CSS, UI strings, translations, sounds, fonts or images from the old `frontend/`, from PairDrop or from Snapdrop.
- Implementing the same wire protocol, URL parameters, storage formats and manifest fields is allowed: they are interfaces, specified in [PROTOCOL.md](PROTOCOL.md) and [MIGRATION.md](MIGRATION.md#legacy-data-inventory).
- Code may be copied from the native app (owner-written, GPL-3.0-or-later; W-007).
- Licence: GPL-3.0-or-later, with a `LICENSE` file from the first commit. No PairDrop attribution is needed because nothing is derived from it.
- Repository: a new public repo whose root is this folder (proposed name `ritikthakur22/fastshare-web`; owner question in [PRD.md](PRD.md#open-questions-for-the-owner)). The old repo `ritikthakur22/FastShare` keeps the backend (Render deploys it) and the old frontend, frozen, as the rollback source. Its GPL notices stay.

**Consequences.** All strings are written fresh in English (W-016). The old repo still needs its own `LICENSE` file (app D-019); that is an old-repo task, listed in MIGRATION.

## W-002 Stack: Vite + Preact + TypeScript

**Context.** Requirements: small bundle, TypeScript, a protocol module testable in Node, PWA support, accessible app-like UI with dialogs, sheets and a radar. The owner works in React Native and TypeScript every day. App D-023 rules out sharing the React Native UI with the web.

**Options.**

| | A: Vite + Preact + TS (recommended) | B: Svelte 5 + Vite | C: Lit (web components) + Vite | D: Vanilla TS + Vite |
|---|---|---|---|---|
| UI runtime (gzip, approx.) | Preact + hooks about 5 KB | small compiled runtime | about 5 KB | 0 |
| Familiar to the owner | JSX and hooks, same as React Native | new syntax and reactivity model | classes, decorators, shadow DOM | DOM by hand |
| Protocol module tests | pure TS under Vitest, same for all options | same | same | same |
| Accessibility work | plain DOM, native `<dialog>`, labels work normally | plain DOM | shadow roots complicate labels, forms and focus | plain DOM, all by hand |
| Risk | small ecosystem quirks (`preact/compat` not needed) | one more paradigm to maintain | verbose for app-like screens | the old site's 9k lines of vanilla JS show the maintenance cost |

React itself (about 45 KB gzip for React + ReactDOM) and Next.js (server features the site doesn't need) were also considered and rejected for size and complexity.

**Decision.**
- Vite (build and dev server), Preact with hooks (no `preact/compat`), TypeScript strict.
- Plain CSS: one tokens file of custom properties plus per-component CSS files. No CSS framework, no CSS-in-JS.
- PWA: `vite-plugin-pwa` in `injectManifest` mode, so the service worker is our own code (handover, share target, notifications) and only the precache list is injected. Its manifest output is turned off: the site ships its own `public/manifest.json` at the legacy URL (W-010).
- Runtime dependencies, all justified in the PR that adds them: `preact`; a streaming zip writer (`client-zip`, loaded only when zipping); a small QR encoder (W-014, loaded only when a code is shown); `workbox-precaching` inside the service worker only.

**Consequences.** Initial JavaScript stays inside the budget in [ARCHITECTURE.md](ARCHITECTURE.md#performance-budget). Screens are written much like the app's, which keeps the visual language in one head.

## W-003 State without a library

**Decision.**
- `src/core` holds small stores (`get`, `subscribe`, typed setters) with no Preact import, the same idea as app D-022.
- `src/ui` has one hook that subscribes a component to a store.
- Add a library only if this proves insufficient, with a reason in the PR.

**Consequences.** Core logic runs in Node tests without a DOM framework.

## W-004 Hosting on the existing Vercel project

**Decision.**
- `vite build` produces static files in `dist/`. No serverless functions, no edge middleware, no image optimisation.
- Prefer connecting the existing Vercel project (which owns `fastshare.ritikthakur.com.np`) to the new repo, so earlier deployments stay available for instant rollback. Check in the Vercel dashboard that switching the Git repository keeps old deployments before relying on it (task WT5.1).
- Response headers (CSP and the rest from [SECURITY.md](SECURITY.md#headers)) and cache rules live in `vercel.json`.
- Vercel Web Analytics and Speed Insights stay off (W-017).

**Consequences.** Hosting cost stays at zero. A move to another static host needs only the headers file translated.

## W-005 Signaling URL configuration

**Context.** The old site hard-codes the Render host and never requests `/config`. App D-011 plans a Cloudflare server with the same API; the requirement is that this move needs nothing beyond a URL change in the site.

**Decision.**
- Build-time default from the environment variable `VITE_SIGNALING_URL`, default `wss://fastshare-ja1a.onrender.com/server`.
- Settings → Advanced → Server address overrides it per browser (parity with the old "Signaling Server URL" setting, migrated from `setting-wss`).
- The site depends only on the WebSocket API in app [API.md](../../fastshare-n/docs/API.md#signaling-server-api). It never calls `/config`, `/health` or any other HTTP endpoint of the server.
- ICE servers come from the server's `ws-config` message (app D-012), never from site config.

**Consequences.** The app D-011 move is: set `VITE_SIGNALING_URL`, redeploy. CSP already allows any `wss:` host (W-018), so the header needs no edit.

## W-006 Protocol: as deployed

**Decision.**
- The site speaks the signaling API and the "legacy web protocol v1" of app [TRANSFER_PROTOCOL.md](../../fastshare-n/docs/TRANSFER_PROTOCOL.md#online-protocol) and app [API.md](../../fastshare-n/docs/API.md#signaling-server-api).
- **Strict on send:** only the messages and fields listed in [PROTOCOL.md](PROTOCOL.md). Nothing new on the wire until a capability exchange exists.
- **Tolerant on receive:** where the deployed old site behaves differently from the app's spec, the deployed behaviour is accepted. Each difference is listed in [PROTOCOL.md](PROTOCOL.md#differences-from-the-app-spec).
- All parsing and validation lives in the pure `src/protocol` module (no DOM, no I/O).

## W-007 Sharing protocol code with the app

**Context.** The app already has pure, tested TypeScript for the web text encoding, file-name sanitising, byte formatting, website link parsing and the palette builder. A shared package would need publishing and versioning across two repos.

**Decision.**
- Copy the small pure files the site needs from the app (`src/protocol/webText.ts`, `fileName.ts`, `format.ts`, the link parser in `qr.ts`, the colour functions of `src/ui/tokens.ts`). Each copied file starts with a one-line provenance comment naming the source path and app commit.
- Both repos test against the same message fixtures (`src/protocol/fixtures/web-v1/*.json`), recorded from the deployed old site (task WT1.5).
- Extract a shared package only when a third consumer appears (the desktop app of app D-023).

**Consequences.** A fix in one copy must be ported to the other; the provenance comment makes that greppable.

## W-008 Receive path: disk-backed sinks

**Context.** The old site keeps every received file in memory as a list of chunks and joins them into a Blob at the end, and refuses 200 MB or more on iOS. Large files crash tabs.

**Decision** (order of preference, per transfer):
1. **Folder** (optional, Chromium desktop): the user picks a folder once in Settings with the File System Access API; files stream straight into it. P2 (WF23).
2. **OPFS**: a dedicated worker writes chunks into the origin private file system with a sync access handle. When the file is complete, the page offers it with an `<a download>` link to the disk-backed `File`, or the Web Share API on phones. The temporary file is deleted after saving, or after 24 h.
3. **Memory**: only when OPFS is unavailable (some private windows). Capped (starting values: 200 MB on phones, 500 MB on desktop; WS-5 sets the real numbers).

Before accepting, the site checks capacity (`navigator.storage.estimate()` for OPFS, the cap for memory). If the offer can't fit, it declines with `reason: "ios-memory-limit"`, the only reason old clients understand ([PROTOCOL.md](PROTOCOL.md#receiving-files)).

Several files are zipped with a streaming zip writer (store only, no compression) into a second OPFS file, then saved once.

**Spikes.** WS-1 measures OPFS throughput, memory, saving and zipping per browser; WS-5 measures memory ceilings. Their results are written here and may reorder the list.

## W-009 Send path

**Decision.**
- Read files from the disk-backed `File` objects that pickers, drag and drop and share-target give, in 1 MiB slices, and send 64,000-byte binary messages.
- Pause while `bufferedAmount` is over 1 MiB and resume on `bufferedamountlow` (threshold 1 MiB).
- Send `partition` after every 16 MiB of a file and wait for `partition-received` (60 s timeout) before sending more. Old receivers answer at once; app receivers answer after writing.
- Progress shown to the sender is computed from bytes sent minus `bufferedAmount`, never from the receiver's `progress` messages (their meaning differs between clients).

## W-010 PWA handover

**Context.** The deployed site registered a cache-first service worker at `/service-worker.js` (cache `fastshare-cache-v1.1.22`), linked `/manifest.json` (no `id`, `start_url` `./`) and declared a share target posting to `/`. Installed home-screen apps and returning visitors run that worker. Details in [MIGRATION.md](MIGRATION.md#service-worker-and-installed-app-handover).

**Decision.**
- The new service worker is served at the same URL, `/service-worker.js`, with scope `/`. It calls `skipWaiting()`, claims clients, and deletes caches named `fastshare-cache-*`.
- The manifest stays at `/manifest.json`, adds `id: "/"` and `start_url: "/"` (the same app identity the old manifest resolved to), and keeps the share target exactly: `action` `/`, `method` POST, `enctype` `multipart/form-data`, fields `title`, `text`, `url` and files field `allfiles`.
- The new worker stores share-target items in IndexedDB and redirects to `/?share_target=inbox`, so shared text never travels in a URL. The site still reads the old worker's redirect formats.
- The worker does not force-reload open pages (a transfer may be running); the next open shows the new site.

**Spikes.** WS-2 (returning user with the old cache, on each platform) and WS-3 (share target from an install holding the old manifest) confirm this before cut-over.

## W-011 Layout per screen size

**Decision.**
- **Compact (< 600 px wide)** and **medium (600–1023 px):** the app's layout. Three tabs (Nearby, Activity, Settings) in the floating pill tab bar; content centred, at most 720 px wide.
- **Expanded (≥ 1024 px):** two panes. The Nearby radar fills the main area; a 360–400 px Activity column stays visible on the right. Settings and Link devices open as a side sheet. No tab bar.
- Screen details and the reasoning are in [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md#layouts).

**Why.** On a desktop people drop files and watch them go; both the drop targets (devices) and the progress (Activity) should be on screen at once. A bottom tab bar is a touch idiom that would sit far from the content on a wide screen. Rejected alternative: a vertical pill rail on the left, which keeps the tab metaphor but still hides Activity behind a click.

## W-012 Local data

**Decision.**
- New data lives in a new IndexedDB database `fastshare_web` and one localStorage key for settings (schema in [ARCHITECTURE.md](ARCHITECTURE.md#local-data)).
- The old database `fastshare_store` and the old localStorage keys are **copied once, read-only** ([MIGRATION.md](MIGRATION.md#data-migration)). The site never opens `fastshare_store` with a version number and never creates it, so a rollback to the old frontend finds its data exactly as it left it.
- The only writes to legacy storage: the site adds and removes its own peer id in localStorage `peer_ids_browser` (so old tabs treat it as the same browser), and clears the old `share_target_files` store after importing from it. Neither changes a schema.

## W-013 One active tab

**Context.** The old site let every tab join the server as a separate device and recognised its own tabs through `peer_ids_browser`. Tabs share storage, so a tab could pair with itself.

**Decision.** A Web Lock (`navigator.locks`, name `fastshare-active`) lets one tab of a browser be the active FastShare tab. Other tabs show "FastShare is open in another tab" with a "Use here" button that takes over. Old-site tabs (until reloaded) are recognised through `peer_ids_browser` and shown as "This browser, older tab", never paired with and never auto-accepted.

## W-014 QR codes: show, don't scan

**Decision.**
- The site draws QR codes for pairing and room links as inline SVG, dark on white in both themes, with a small MIT- or ISC-licensed encoder chosen in WT2.5 (candidates: `uqr`, `qrcode-generator`), loaded only when a code is shown.
- The site has no camera scanner. The codes it shows are `https://` links: a phone's camera app opens them in the browser, and the app's in-app scanner reads them. The app's `fastshare://c?...` codes are LAN-only and a browser can't use them.

**Consequences.** No camera permission, no scanner library.

## W-015 Auto download only for paired devices

**Context.** The old site has two switches: a per-paired-device "auto accept" and a global "Auto Download" (`setting-autodownload`) that accepts files from anyone without asking. The app's Auto download covers paired devices only (app F28).

**Decision.** Keep the per-device switch. The global switch means "accept files from paired devices without asking", like the app. Files from devices that aren't paired always ask. A migrated `setting-autodownload = true` turns on the paired-device switch and shows a one-time notice.

**Why.** Anyone behind the same public IP (offices, campuses, carrier-grade NAT) can send to a site user. Silent downloads from strangers are a malware and abuse risk. Needs owner confirmation because it narrows an existing behaviour.

## W-016 English first

**Decision.** Launch with English only. Strings live in one module keyed by feature from the start, so translations can be added without touching screens. Translations are written fresh (the old 34 language files are PairDrop-derived and can't be reused, W-001). The old `language_code` key is not migrated.

Needs owner confirmation: users who saw the old site in their language get English at launch.

## W-017 No analytics, no third parties

**Decision.**
- No analytics, error-tracking, A/B or tag-manager scripts. No cookies. No web fonts or scripts from other origins.
- The only network peers: the site's own origin, the signaling server (W-005), the ICE servers named in `ws-config`, and the other device over WebRTC.
- Problems are diagnosed with a user-copied debug report (About → Copy debug info), redacted per [SECURITY.md](SECURITY.md#privacy).

## W-018 CSP and first-paint theming

**Context.** Two tensions. (1) A custom signaling server URL and "Cloudflare move = URL only" both need connections to WSS hosts not known at build time. (2) A strict CSP forbids inline scripts, but the theme and accent must apply before the first paint.

**Decision.**
- `connect-src 'self' wss:`: any secure WebSocket host is allowed. Accepted because `script-src 'self'` (no inline, no eval) is what prevents injected code in the first place; the full header is in [SECURITY.md](SECURITY.md#headers).
- First paint: a tiny same-origin, render-blocking `/theme.js` in `<head>` reads the cached palette from localStorage (`fs.palette`) and sets the CSS variables before any content paints. The default palettes for light and dark are also in the stylesheet (`prefers-color-scheme`), so the page looks right with JavaScript off.
- Dynamic colours are applied through the CSSOM (`style.setProperty`), which `style-src 'self'` allows. No inline `<style>` or `style` attributes in HTML.

## W-019 Browser support

**Decision.**
- Supported: the current and previous major versions of Chrome, Edge, Firefox (plus the current ESR), Samsung Internet and Safari on macOS; Safari on iOS and iPadOS 16.4 or later.
- The site detects `RTCPeerConnection`, `HTMLDialogElement` and IndexedDB at startup. Without them it shows a plain page: "This browser can't run FastShare. Update it, or open the site in Chrome, Edge, Firefox or Safari."
- Enhancements that are used only when present: Screen Wake Lock, File System Access, Notifications, Web Share, `linear()` spring easing.
- The minimum versions are confirmed against MDN and the WS-1 results before launch (task WT4.7).

## W-020 Devices appear on announcement

**Context.** The old site shows a device only after its data channel opens. Devices that can't connect (both behind symmetric NAT) never appear, and people don't know why.

**Decision.**
- A device appears on the radar when the server announces it, in a "Connecting" state, and becomes tappable when the channel opens.
- If the channel hasn't opened after 15 s, the device shows "Can't connect directly" and a one-line explanation in its details.
- The site opens connections eagerly to at most 20 announced devices (most recent first); others connect when tapped. This protects tabs in very busy public-IP rooms.

## W-021 Signaling and WebRTC links are independent

**Context (measured 2026-11-15).** The live site disconnects from the server and reconnects whenever `navigator.connection` fires `change`. Chromium fires that event as its bandwidth estimate moves, about 30 s into a transfer. The reconnect sends `disconnect`, the server tells every peer `peer-left` with `disconnect: true`, the peers close their WebRTC connections, and the running transfer is lost. With `navigator.connection` hidden from the page, a 53 MB transfer to the app finished in 12 s with no drop. The current server also announces `disconnect: true` for any client that misses pongs for 5 s (app D-010 raises that to 60 s).

**Decision.**
- The site never reconnects because of network-quality signals: it does not listen to `navigator.connection` at all.
- It reconnects only after a real disconnect: the socket's `close` or `error` event, the `online` event while the socket isn't open, or the page becoming visible while the socket isn't open. An open socket is never closed to "refresh" it. A network switch that changes the public IP also breaks the socket, so the site still lands in the right IP room.
- `disconnect` is sent only on `pagehide`, never as part of a reconnect.
- Every reconnect reuses the tab's peer id (`peer_id`, `peer_id_hash`), so the server keeps the same identity and peers see `peer-left` with `disconnect: false` followed by `peer-joined`.
- `RTCPeerConnection`s and data channels don't depend on the socket. A signaling reconnect never closes or renegotiates them; the server's new room lists re-attach rooms to existing devices.
- `peer-left`, with either flag, never closes a data channel that carries a running transfer. The data channel's own `close` event and the transfer timeouts decide that transfer. This also protects transfers from old-site peers that still reset on network changes, because an old site keeps its own side of the link open when it resets its socket.
- Message-level rules are in [PROTOCOL.md → Signaling connection](PROTOCOL.md#signaling-connection) and [PROTOCOL.md → Peers and connections](PROTOCOL.md#peers-and-connections); test cases in [TESTING.md](TESTING.md#3-integration-tests).

**Consequences.** After a server restart, peers get new ids, so a device can show twice for a few seconds (its old link and its new announcement); the room rules in PROTOCOL clean that up. Owner follow-up: the app's signaling code may need the same rules ([MIGRATION.md](MIGRATION.md#follow-ups-in-other-repos)).

---

## Change log

| Date | Change |
|---|---|
| 2026-11-14 | Initial records W-001 to W-020 from the website planning session. All Proposed. |
| 2026-11-15 | W-021 added after a measurement: the old site resets its server connection on `navigator.connection` changes, which kills running transfers. |
