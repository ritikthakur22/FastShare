# Website: Product Requirements

## One line

Open a web page and send files, text and links to any nearby or paired device: no install, no account, nothing stored on a server, and the same look as the FastShare app.

## Problem

- The legacy site works, but it has a dated look, in-memory receiving that crashes on large files, and a cache-first service worker that keeps people on stale versions.
- The new native app has a clear identity (app D-018) and talks to the site over the same server. Users moving between app and site meet two different products.
- The site is the zero-install client of FastShare (app D-019): for laptops without the app, for people who can't install apps, and for sending to an app user from any browser.

## Users

| Persona | Need |
|---|---|
| Laptop or desktop user without an app | Get a phone's photos onto the computer, or a document onto the phone, in a few seconds |
| Someone on a locked-down computer (work, school, library) | Share without installing anything |
| App user with a friend who has no app | Send to the friend's browser, on the same Wi-Fi or across the internet |
| Returning user of the old site | Same address, same links, pairings and settings still there |

## Goals

1. **Works with every FastShare client:** the new app, the old app 1.1.x and the old site, through the existing server ([PROTOCOL.md](PROTOCOL.md)).
2. **Same identity as the app:** the radar, cards, floating tab bar and colours ([DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)).
3. **Large files without crashes:** received files go to disk where the browser allows (W-008).
4. **Fast to load:** within the budget in [ARCHITECTURE.md](ARCHITECTURE.md#performance-budget).
5. **Accessible:** WCAG 2.2 AA ([DESIGN_SYSTEM.md](DESIGN_SYSTEM.md#accessibility-checklist)).
6. **Private:** no analytics, no third-party requests (W-017); bytes go device to device.
7. **No lost users:** links, pairings, settings and installed apps carry over ([MIGRATION.md](MIGRATION.md)).
8. **Transfers survive the network:** a change in network quality, or a reconnect to the signaling server, never stops a running transfer. The old site loses transfers this way (W-021).

## Non-goals

- The LAN protocol (LocalSend-compatible HTTPS) in the browser: browsers can't open sockets or trust self-signed peers. The site is online-only.
- Cloud links, accounts or server-side history.
- Relaying file bytes through the server. A TURN relay for paired devices (app D-012) comes later, from the server side.
- A QR scanner (W-014).
- Translations at launch (W-016).

## Features

**P0** = required for cut-over (parity with the old site, migration or protocol safety). **P1** = expected at cut-over for the app's identity; may follow within days. **P2** = after cut-over. **P3** = later. Phases are in [ROADMAP.md](ROADMAP.md). Old-site parity per feature is in [MIGRATION.md](MIGRATION.md#feature-parity-with-the-old-site).

| # | Feature | P | Notes |
|---|---|---|---|
| WF1 | Devices on the radar: same network (same public IP), paired devices, public room; connection state; link badges | P0 | W-020 |
| WF2 | Send files to one or several devices: picker, photos (phones), drag and drop, paste, send tray | P0 | "Send to all" button: P1 |
| WF3 | Receive files: incoming sheet with thumbnail; accept, partial accept, decline; disk-backed storage; received sheet with preview, Save, Share; save automatically; zip several | P0 | W-008 |
| WF4 | Send and receive text and links; safe links; Copy | P0 | 64 KiB send limit ([PROTOCOL.md](PROTOCOL.md#text)) |
| WF5 | Progress on the device's ring and in Activity, with speed and time left; cancel | P0 | |
| WF6 | Pairing with the server's 6-digit key and its QR link; paired list; auto-accept per device; unpair; Auto download for paired devices | P0 | W-015 |
| WF7 | Public rooms: create, join by code or QR link, leave, rejoin after reconnect | P0 | |
| WF8 | Link entry points: `pair_key`, `room_id`, `init`, `share_target` | P0 | non-negotiable for the first two |
| WF9 | Device name: server default, rename, sent to connected devices and other tabs | P0 | |
| WF10 | Device type: Automatic, Phone, Computer | P0 | sets the icon others see |
| WF11 | Appearance: System, Light, Dark; the app's six accent presets | P0 | custom hue or hex colour with contrast correction: P1 |
| WF12 | Notifications while the page is hidden; sound; title and favicon badge | P0 | permission only from a tap |
| WF13 | Installable app: install, offline shell, share target (Android), safe updates | P0 | W-010 |
| WF14 | Clipboard history: texts sent and received; copy, share, delete | P0 | |
| WF15 | Activity: live transfers and local history | P1 | metadata only; files are saved by the user |
| WF16 | Screen kept awake during transfers; warning before closing mid-transfer | P0 | |
| WF17 | Review pasted or shared text before sending (setting); edit text in the tray | P0 | |
| WF18 | Connection status; server address (Advanced); Restart; Refresh | P0 | |
| WF19 | One-time import of the old site's data | P0 | [MIGRATION.md](MIGRATION.md#data-migration) |
| WF20 | Connection code for checking a connection out of band | P0 | |
| WF21 | About, privacy, terms, licences, developer link | P0 | developer: Ritik Thakur, GitHub `ritikthakur22` |
| WF22 | "Get the app" card | P2 | owner question 9 |
| WF23 | Save received files straight into a chosen folder (Chromium desktop) | P2 | W-008 |
| WF24 | Copy debug info (redacted) | P1 | W-017 |
| WF25 | Translations, written fresh | P3 | W-016 |
| WF26 | Remove all FastShare data from this browser (unpairs every device first) | P1 | for shared computers ([SECURITY.md](SECURITY.md#local-data-and-secrets)) |

## Key user flows

Screen details: [DESIGN_SYSTEM.md → Screens](DESIGN_SYSTEM.md#screens).

### UF1: Phone to laptop on the same Wi-Fi (primary)

1. Both open fastshare.ritikthakur.com.np. Each sees the other on the radar within a few seconds of the server answering.
2. On the phone: Send → pick 3 photos → the send tray shows "3 items ready to send" → tap the laptop.
3. The laptop shows the incoming sheet with a thumbnail → Accept.
4. Both rings fill. On the laptop the received sheet opens; with Save automatically on, the zip is already downloading.

**Acceptance:** 4 taps or fewer for the sender; nothing held in memory beyond the 64 MiB write buffer; works in all supported browsers ([TESTING.md](TESTING.md#5-browser-matrix)).

### UF2: Pair a browser with the app

1. App: Link devices → Pair → Show my code (QR of `https://fastshare.ritikthakur.com.np/?pair_key=NNNNNN`).
2. The laptop user scans it with their phone's camera, or types the 6 digits in Link devices → Pair.
3. Both show the device as paired. It now appears on both sides on any network.

### UF3: App user sends a 2 GB video to a laptop browser

The laptop accepts; the file streams into browser storage on disk; Save hands it to the browser's downloads. Memory stays flat; the laptop's ring and Activity show speed and time left.

**Acceptance:** the transfer completes in Chromium even though its network-quality events fire during it, and it survives the signaling socket being dropped and restored mid-transfer (W-021; [TESTING.md](TESTING.md#3-integration-tests) cases I5 and I6).

### UF4: Public room across networks

A user creates a room and reads out the 5-letter code (or shares the QR link). The friend joins; each appears on the other's radar with a room badge; they send; one taps Leave room.

### UF5: Share from the Android gallery into the installed site

Gallery → Share → FastShare (installed from the browser) → the site opens with the items in the send tray → tap a device.

### UF6: Returning user after cut-over

They open the site as usual. At the latest on the second open they see the new design with their paired devices, name, theme and colour already in place. A `?pair_key=` link works on the first open.

## Success measures

Measured by hand, without analytics (W-017):
- the interop matrix passes on every release ([TESTING.md](TESTING.md#4-interop-matrix));
- the performance budget holds on every release;
- no report of "the site is stuck on the old version" or "my pairings are gone" in the four weeks after cut-over;
- GitHub issues get a first answer within 7 days.

## Open questions for the owner

Most important first. Each blocks the task named in brackets.

1. **Translations (W-016).** The clean-room rule means the old 34 language files can't be reused. Launch in English only and add fresh translations later, or wait for fresh translations of the main languages before cut-over? Recommendation: English at launch. [WT0.1, cut-over]
2. **Repository and Vercel (W-001, W-004).** Approve a new public repo (proposed `ritikthakur22/fastshare-web`) with this folder as its root, and connecting the existing Vercel project to it (keeps instant rollback) rather than moving the domain to a new project. The old repo keeps the backend and the frozen old frontend. [WT1.1, WT5.2]
3. **Stack (W-002).** Approve Vite + Preact + TypeScript, or pick an alternative (Svelte 5, Lit, vanilla TypeScript). It is the hardest decision to change later. [WT1.1]
4. **Auto download (W-015).** The old global switch accepts files from anyone. The plan limits it to paired devices, like the app. Approve, or keep an "everyone" option behind a warning? [WT3.2]
5. **Drops and behaviour changes** ([MIGRATION.md](MIGRATION.md#feature-parity-with-the-old-site) rows 20, 25, 26, 42, 48): drop the `base64text` / `base64zip` links and file-handler launches; drop Save to Gallery (meaningless in a browser); one active tab per browser instead of one device per tab; contact through GitHub instead of an e-mail address in About. [WT2.7, WT2.8, WT4.3]
6. **Privacy policy and terms.** Host them as pages on the new site (`/privacy`, `/terms`), replacing the current shared documents, and use the same URL for the Play listing? [WT4.3]
7. **App D-019 timing.** The app's D-019 and ROADMAP put this rewrite after the Cloudflare server and call it optional. Confirm doing it now, and skip the old site's short-term fixes except its `LICENSE` file ([MIGRATION.md](MIGRATION.md#follow-ups-in-other-repos)). [WT5.3]
8. **Server keep-alive (app D-010).** Deploy the 25 s / 60 s change before cut-over? Recommended: browsers on phones also lose connections and data at 1-second pings. Not blocking. [WT5.2]
9. **"Get the app" card (WF22).** Link to the Play listing or GitHub releases, and show it from when (after app 2.0 reaches production)? [WT6.1]
10. **Old colour choices.** Keep each user's old colour as a custom colour (contrast-corrected), with the old default mapped to the new default, as planned? Or reset everyone to the default? [WT4.2]
11. **Zip file name.** Use the app's format (`crdyo-YYYYMMDD-HHmm.zip`) or keep the old site's (`FastShare_files_YYYYMMDD_HHMM.zip`)? Planned: the app's. [WT3.3]
12. **Browser floor (W-019).** Approve Safari/iOS 16.4+ and the current plus previous versions of the other browsers. [WT4.7]
