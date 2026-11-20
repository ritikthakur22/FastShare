# Task Backlog (website)

The ordered work list. [ROADMAP.md](ROADMAP.md) says what each phase delivers; this file breaks the phases into tasks small enough for one session or one PR.

## How to use this file

1. Take the first `todo` task whose dependencies are `done` and whose owner questions are answered.
2. Read the docs in its **Read** column before writing code.
3. One task = one logical commit or PR. Don't bundle unrelated tasks.
4. A task is `done` only when its **Done when** check passes. Checks marked **browser** run in real browsers or devices, and the result goes in the PR ([TESTING.md](TESTING.md#10-what-ci-proves-and-what-it-doesnt)).
5. Update the status here in the same PR: `todo` → `doing` → `done`, or `blocked: <reason>`.
6. If a task turns out wrong or too big, edit this file first, then do the work.

**Tracks:** `OWN` the owner decides or acts · `TS` pure TypeScript and core logic · `UI` screens and components · `PWA` service worker and manifest · `OPS` repo, CI, Vercel · `QA` test runs and matrices.

## Phase W0: Owner decisions and spikes

| ID | Track | Task | Read | Done when | Status |
|---|---|---|---|---|---|
| WT0.1 | OWN | Answer PRD questions 1–5 (translations, repo and Vercel, stack, auto download, drops) | PRD (open questions), DECISIONS, MIGRATION (parity) | each answer is written into the decision (status Approved, change-log line) and the parity table | todo |
| WT0.2 | TS | Spike WS-1: OPFS writer worker, saving, sharing and zipping, per browser | W-008, ARCHITECTURE (data path), ROADMAP (spikes) | **browser:** the results table is in W-008 and the sink order is confirmed or changed | todo |
| WT0.3 | PWA | Spike WS-2, first pass: a staging origin serves the old repo's `frontend/` as it is (deployed from its own repo, nothing copied here), then a minimal worker at `/service-worker.js` replaces it | W-010, MIGRATION (handover) | **browser:** the returning-visitor sequence is recorded per platform in W-010; MIGRATION is corrected wherever reality differs | todo |
| WT0.4 | QA | Spike WS-5: memory ceilings in private windows | W-008 | **browser:** memory caps written into W-008 | todo |

## Phase W1: Foundation

| ID | Track | Task | Read | Done when | Status |
|---|---|---|---|---|---|
| WT1.1 | OPS | Scaffold: Vite, Preact, TypeScript strict, ESLint and Prettier, Vitest, Playwright, `LICENSE` (GPL-3.0-or-later), the folder layout, the npm scripts | ARCHITECTURE (layout, layer rules), SETUP, CODE_STYLE, W-001, W-002 | `npm run typecheck && npm run lint && npm test && npm run build` pass on the empty app; the owner has created and pushed the repo | todo (needs WT0.1) |
| WT1.2 | OPS | CI workflow; Vercel preview with `vercel.json` headers, cache rules and rewrites; the bundle-size check | SETUP (CI, Vercel), SECURITY (headers), W-004 | a PR run is green; the preview answers with exactly the headers in SECURITY; a deliberately oversized branch fails `npm run size` | todo |
| WT1.3 | UI | Tokens and palette: copy the colour functions with provenance, port the contrast test, `/theme.js` first paint, mode and accent settings | DESIGN_SYSTEM (colour, typography, spacing, motion), W-007, W-018 | the contrast test passes for every preset, hue and extreme; **browser:** no flash of the wrong theme on reload with a slowed CPU; screenshots of the empty Nearby in both themes sent to the owner | todo |
| WT1.4 | UI | Shell and core components: `FloatingTabBar`, expanded header, `Sheet` on `<dialog>`, confirm and prompt dialogs, `Toast`, `Banner`, buttons, `Switch`, `Segmented`, `TextField`, `CodeInput`, `EmptyState`, icon sprite, `BrandMark` | DESIGN_SYSTEM (components, layouts, platform adaptation, accessibility) | axe clean on the shell in three size classes and both themes; **browser:** keyboard-only navigation works and back closes sheets first | todo |
| WT1.5 | TS+QA | Test peer in `tools/`: drives the old site on the Render origin in a headless browser, records data-channel and server messages both ways into `src/protocol/fixtures/web-v1/`; later reused as the fuzzing peer | PROTOCOL (fixtures, differences), TESTING (§9) | fixtures for request and response, header, partition with the object acknowledgement, progress series, text, name change and room messages are committed and offered to the app repo | todo |
| WT1.6 | QA | Preview checks: headers present, no CSP violation during the end-to-end run, Lighthouse baseline | SECURITY (headers), ARCHITECTURE (performance budget) | the check runs on every preview; the baseline numbers are in the PR | todo |
| WT1.7 | TS | Protocol module: `server.ts`, `channel.ts`, `links.ts`, the copied `webText`, `fileName` (plus the direction-character rule) and `format`, `connectionCode.ts`, `legacy.ts` | PROTOCOL, SECURITY (input validation), W-006, W-007 | every protocol bullet of TESTING §1 passes and every fixture is accepted | todo (needs WT1.5) |

## Phase W2: Devices, pairing, rooms, text

| ID | Track | Task | Read | Done when | Status |
|---|---|---|---|---|---|
| WT2.1 | TS | Signaling client: URL and parameters, join order, `pong`, backoff, link-action queue, and the connection lifecycle (no `navigator.connection`, `disconnect` only on `pagehide`, same peer id) | PROTOCOL (signaling connection), W-005, W-021 | the signaling and lifecycle bullets of TESTING §1 pass; **browser:** on the real Render server the tab joins the IP room and sees a phone running the app | todo |
| WT2.2 | TS | Peers registry and WebRTC links: caller rule, channel setup, name on open, connection code, eager limit, room re-confirmation, the no-room rule | PROTOCOL (peers and connections), W-020, W-021 | I1 and I6 pass; the connection code is equal on both sides | todo |
| WT2.3 | UI | Nearby: radar with real devices and avatar states, compact radar with list, expanded two panes, device card with rename, device type, Refresh | DESIGN_SYSTEM (Nearby, radar rule, layouts), PRD (UF1) | **browser:** the owner signs off the look (web part of D-018); reduced motion honoured; axe clean | todo |
| WT2.4 | TS+UI | Text both ways: send sheet with the 64 KiB rule and the text-file fallback, received text with safe links and Copy, history rows, Clipboard history screen | PROTOCOL (text), SECURITY (input validation), DESIGN_SYSTEM (screens) | I2 passes; **browser:** the text rows of the interop matrix pass with O, A2 and A1 | todo |
| WT2.5 | TS+UI | Pairing: show the code with its QR (pick the encoder, W-014) and Copy link; join by code; errors; paired list with auto-accept and Unpair; secret-room deleted and replaced-secret events | PROTOCOL (pairing), W-014, W-015, DESIGN_SYSTEM (Link devices) | I9 passes; **browser:** the pairing rows of the interop matrix pass, including the app's QR opened with a phone camera | todo |
| WT2.6 | TS+UI | Public rooms: create, join, leave, rejoin, room badge | PROTOCOL (public rooms), DESIGN_SYSTEM (Link devices) | I10 passes; **browser:** the room rows of the interop matrix pass | todo |
| WT2.7 | TS | Link entry points: parse, strip, wait for the server, run; the old `share_target` formats | PROTOCOL (entry points), MIGRATION (URL compatibility) | the link tests of TESTING §1 pass; I11 passes; **browser:** a QR shown by the app opens the site and pairs | todo |
| WT2.8 | TS+UI | One active tab with a Web Lock; `peer_ids_browser` bookkeeping; older tabs marked | W-012, W-013, MIGRATION (old tab and new tab) | I12 passes; M8 passes in the WT5.1 rehearsal | todo |

## Phase W3: Files

| ID | Track | Task | Read | Done when | Status |
|---|---|---|---|---|---|
| WT3.1 | TS | Send pipeline: `request` with thumbnail, headers, chunks, flow control, partitions with acknowledgement and timeouts, completion waits, 0-byte skip, cancel | PROTOCOL (sending files), W-009 | the send bullets of TESTING §1 pass; I3 and I4 pass for sending | todo |
| WT3.2 | TS | Receive pipeline: checks, one request per peer, capacity decline, accept policy (W-015), partial accept, header checks, write-buffer cap, acknowledgements after writing, overall progress | PROTOCOL (receiving files), W-008, W-015 | the receive bullets of TESTING §1 pass; I3, I4 and I8 pass | todo (needs PRD question 4) |
| WT3.3 | TS | Sinks and saving: OPFS worker, memory fallback, cleanup; download and share; streaming zip with the chosen name format | ARCHITECTURE (data path), W-008 | **browser:** the 2 GB memory check of TESTING §8 passes in the browsers WS-1 marked OPFS-capable; a zip of three files holds identical bytes | todo (needs WT0.2, PRD question 11) |
| WT3.4 | UI | Send tray, `DropOverlay`, drop on a device, paste, review text, Send to all, the Send menu | DESIGN_SYSTEM (tapping a device, drag and drop, paste), PRD (UF1) | **browser:** UF1 works phone to laptop in two browsers; every drag has a button alternative | todo |
| WT3.5 | UI | Incoming and Received sheets: thumbnail, file list, partial accept, connection code, auto-accept box, previews, Save and Share, Save automatically, the zip setting | DESIGN_SYSTEM (incoming, received), SECURITY (previews) | I4 passes through the UI; **browser:** screen-reader check of the incoming sheet | todo |
| WT3.6 | UI | Activity: live rows with speed and time left, history, filters, Save while the temporary file exists, Clear history | DESIGN_SYSTEM (Activity), ARCHITECTURE (local data) | **browser:** UF3 shows speed and time left; history survives a reload | todo |
| WT3.7 | TS+UI | Notifications, a new arrival sound, title and favicon badge, wake lock, the warning before closing | ROADMAP (WS-4), DESIGN_SYSTEM, W-017 | **browser:** behaviour matches the WS-4 record on each platform; nothing asks for permission on load | todo (needs WS-4) |
| WT3.8 | QA | W-021 on real devices: transfers of 60 s or more in Chromium with N ↔ N, N ↔ O and N ↔ A2; I5 and I7 in CI | W-021, TESTING (§3, §4, §8) | **browser:** the rows pass and are recorded | todo |

## Phase W4: Installable app, migration, quality

| ID | Track | Task | Read | Done when | Status |
|---|---|---|---|---|---|
| WT4.1 | PWA | Service worker (precache, routes, share target into the inbox, notification clicks, removal of `fastshare-cache-*`) and `/manifest.json` (`id`, icons made from the app icon, share target, `launch_handler` per WS-3) | W-010, MIGRATION (handover), ARCHITECTURE (service worker), DESIGN_SYSTEM (brand mark and icons) | **browser:** WS-2 and WS-3 pass on staging with the real build; the browser offers installation | todo |
| WT4.2 | TS | Legacy import: open without creating, mapping, run once, the auto-download notice, colour mapping per the owner's answer | MIGRATION (legacy data inventory, data migration), W-012 | the migration tests of TESTING §1 pass; M3–M5 pass on staging | todo (needs PRD question 10) |
| WT4.3 | UI | Settings complete; About, privacy and terms pages; unsupported-browser and other-tab screens; Remove all data (WF26); Copy debug info (WF24) | DESIGN_SYSTEM (Settings, other screens), SECURITY (privacy, local data), MIGRATION (parity) | every setting persists and takes effect; parity rows 27–48 checked off; a test shows the debug report holds no secret, code, file name or text | todo (needs PRD questions 5 and 6) |
| WT4.4 | QA | Accessibility pass | DESIGN_SYSTEM (accessibility checklist), TESTING (§7) | axe clean in CI; **browser:** screen-reader results recorded | todo |
| WT4.5 | QA | Performance pass | ARCHITECTURE (performance budget), TESTING (§8) | every budget holds; the numbers are in the PR | todo |
| WT4.6 | QA | Security pass: fuzzing peer, malicious names and text, headers, CSP-clean end-to-end runs | SECURITY, TESTING (§9) | TESTING §9 passes | todo |
| WT4.7 | QA | Full browser matrix and interop matrix; confirm the minimum versions in W-019 | TESTING (§4, §5), W-019 | **browser:** every row passes or has an exception the owner accepted; W-019 updated | todo (needs PRD question 12) |

## Phase W5: Cut-over

| ID | Track | Task | Read | Done when | Status |
|---|---|---|---|---|---|
| WT5.1 | OPS+QA | Rehearsal on staging: the old site first, then the new build on the same origin; M1–M9; a rollback; check that switching the Vercel project's repo keeps old deployments | MIGRATION (cut-over and rollback), TESTING (§6), W-004 | **browser:** every M row passes; the rollback brings back the old site with its data intact | todo |
| WT5.2 | OWN+OPS | Cut-over on Vercel and the 15-minute smoke test | MIGRATION (cut-over and rollback) | **browser:** the smoke test passes on three devices; the previous production deployment is noted | todo (needs PRD questions 1, 2; ideally 8) |
| WT5.3 | OWN | Follow-ups in the other repos | MIGRATION (follow-ups in other repos) | each row has an owner decision written next to it | todo |
| WT5.4 | QA | Two weeks of watching: issues, smoke test after each deploy, interop spot checks | MIGRATION (after) | two weeks with no unresolved "stuck on the old version" or "pairings lost" report; the status line in AGENTS.md updated | todo |

## Phase W6: Later

| ID | Track | Task | Read | Done when | Status |
|---|---|---|---|---|---|
| WT6.1 | UI | "Get the app" card (WF22) | PRD (question 9), DESIGN_SYSTEM | the card shows per the owner's answer and can be dismissed for good | todo (needs PRD question 9) |
| WT6.2 | TS+UI | Save into a chosen folder (WF23) | W-008, ARCHITECTURE (data path) | **browser:** a 2 GB receive in Chromium desktop lands in the folder with flat memory | todo |
| WT6.3 | UI | Translations, written fresh (WF25) | W-016 | the owner's chosen languages ship; layouts hold with longer strings | todo |
| WT6.4 | OPS | Move to the Cloudflare server (app D-011): change `VITE_SIGNALING_URL`, redeploy | W-005 | **browser:** the interop matrix passes against the new server | todo (needs app D-011) |
