# Roadmap (website)

From these planning docs to the new site at `fastshare.ritikthakur.com.np`. Feature IDs (WF1…) are in [PRD.md](PRD.md#features), decisions (W-001…) in [DECISIONS.md](DECISIONS.md), tasks (WT…) in [TASKS.md](TASKS.md).

Estimates assume one developer at about 20 hours a week; they are ranges, not promises. A phase is done only when its exit criteria pass in real browsers ([TESTING.md](TESTING.md)).

```
Phase W0  Owner decisions and spikes (1–2 wk)
Phase W1  Foundation (1–2 wk)
Phase W2  Devices, pairing, rooms, text (2–3 wk)
Phase W3  Files (3–4 wk)
Phase W4  Installable app, migration, quality (2–3 wk)
Phase W5  Cut-over (1 wk, then 2 wk of watching)
Phase W6  Later
```

**Status 2026-11-15:** planning documents only. No code, no repo yet. Owner decisions are pending ([PRD.md → Open questions](PRD.md#open-questions-for-the-owner)).

**Why this order.** Protocol and discovery come before files because every later test needs two real peers. Files come before the PWA because the share target and notifications need the transfer code. The handover and migration come last but are rehearsed early (WS-2), because they are the one step that can strand existing users.

## Spikes

Throwaway prototypes in a scratch folder (`~/extra/fastshare-web-spikes`), never merged. Each records its result (browsers, versions, devices, numbers) in its decision in DECISIONS.md.

| ID | Question | Pass criteria | Decides |
|---|---|---|---|
| WS-1 | Can each browser receive to disk? An OPFS writer worker with sync access handles, then saving (download, share) and zipping | 2 GB received over WebRTC from another browser on the same network: the tab stays under 300 MB, no crash, saving finishes, SHA-256 equal. Recorded per browser: throughput, the largest size that worked, whether `navigator.share` takes a 1 GB file, whether a zip of 3 × 500 MB saves. Browsers: Chrome (desktop, Android), Firefox (desktop, Android), Safari (macOS, iOS), Edge, Samsung Internet | W-008 sink order |
| WS-2 | Does a returning visitor of the old site get the new one without doing anything? | On a staging origin that first served the old site (old worker installed, PWA installed on Android): after deploying a new build with a worker at `/service-worker.js`, the second open shows the new site on Chrome desktop, Chrome Android (installed app), Safari iOS (home-screen app) and Firefox; a `?pair_key=` link shows it on the first open; old caches are gone; nobody clears anything by hand. Also recorded: what happens if `/service-worker.js` answers 404 | W-010; MIGRATION sequence |
| WS-3 | Does the share target survive for installs that hold the old manifest? | Android: sharing 3 files and a link from the gallery and Chrome reaches the new site's send tray, both before and after the installed app refreshes its manifest; icon-change prompts recorded; the better `launch_handler` value chosen | W-010 |
| WS-4 | Notifications and wake lock per platform | Per browser: permission asked from a tap; a notification shows while the page is hidden; a click focuses the tab or app; the screen stays on during a 5-minute transfer. iOS: in a Safari tab and as a home-screen app | WF12, WF16 |
| WS-5 | How much can be received in memory where OPFS is missing? | In private windows of Safari (iOS, macOS) and Firefox: the largest receive that completes without a crash; the caps in W-008 set below it | W-008 memory caps |

## Phase W0: Owner decisions and spikes (1–2 weeks)

- The owner answers PRD questions 1–5 (translations, repo and Vercel, stack, auto download, drops). Answers are written into DECISIONS.md (status Approved) and MIGRATION.md.
- Spikes WS-1, WS-2 (first pass with a minimal worker) and WS-5.

**Exit:** W-002, W-008 and W-010 have results or approvals; the repo exists.

## Phase W1: Foundation (1–2 weeks)

**Depends on:** W0.

- Repo scaffold ([ARCHITECTURE.md → Repository layout](ARCHITECTURE.md#repository-layout)), CI, Vercel preview with the headers.
- Tokens, palette with its contrast test, first-paint theming; the layouts and core components.
- The protocol module with its tests; fixtures recorded from the deployed old site.

**Exit:** CI green; a preview URL shows the empty Nearby screen in both themes and three size classes with the CSP active; protocol tests pass on the recorded fixtures; the owner has seen the first visual mock (D-018 sign-off started).

## Phase W2: Devices, pairing, rooms, text (2–3 weeks)

**Depends on:** W1.

WF1, WF4, WF6–WF10, WF14, WF18, WF20 and the connection lifecycle of W-021.

**Exit:** integration cases I1, I2, I6, I9–I12 pass; the W2 rows of the interop matrix pass; the owner signs off the look (D-018).

## Phase W3: Files (3–4 weeks)

**Depends on:** W2, WS-1.

WF2, WF3, WF5, WF15, WF16, WF17; the send tray, drag and drop and paste; notifications and sound (WF12) after WS-4.

**Exit:** I3–I5, I7, I8, I13 pass; the W3 interop rows pass, including a 500 MB transfer with each peer and a 60-second Chromium transfer; the 2 GB memory check passes in the browsers WS-1 marked as OPFS-capable.

## Phase W4: Installable app, migration, quality (2–3 weeks)

**Depends on:** W3, WS-2, WS-3.

WF13, WF19, WF21, WF24, WF26; the accessibility, performance and security passes; the browser matrix.

**Exit:** M1–M9 pass on the staging origin; axe clean; the performance budget holds; every P0 row in the parity table is Kept or approved by the owner; the browser matrix passes.

## Phase W5: Cut-over (1 week, then 2 weeks of watching)

**Depends on:** W4; owner approval; ideally app D-010 deployed.

- Rehearse the cut-over and the rollback on staging; then cut over on Vercel ([MIGRATION.md → Cut-over and rollback](MIGRATION.md#cut-over-and-rollback)).
- Follow-ups in the other repos (owner).

**Exit:** two weeks after cut-over with no open "stuck on the old version" or "pairings lost" reports; smoke tests pass after every deploy.

## Phase W6: Later

| Item | Prerequisite |
|---|---|
| WF22 "Get the app" card | owner answer (PRD question 9); app 2.0 in production |
| WF23 save into a chosen folder (Chromium desktop) | WS-1 result |
| WF25 translations, written fresh | stable string set; owner decides the languages |
| Signaling move to Cloudflare (app D-011) | the new server live; then only `VITE_SIGNALING_URL` changes (W-005) |
| TURN relay for paired devices (app D-012) | the server mints credentials; needs a site change to request them |
| `require-trusted-types-for 'script'` | the built site runs clean with it |

## Dependencies on the app repo

| Needs | Before |
|---|---|
| App T3.4 (native online file path) | meaningful N ↔ A2 throughput numbers (interop matrix) |
| App D-010 server change | recommended before W5; not blocking |
| Owner updates app D-019 timing | W5 (documentation only) |
| App tools retargeted (`web_peer.mjs`, `web_files.mjs`) | W5, or the app's online tests break at cut-over |
