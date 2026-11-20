# Testing (website)

The site's risks are at its edges: other clients, browsers, networks and the handover from the old site. Most logic is checked in milliseconds in Node; real browsers and devices check what only they can.

```
           ▲  manual matrices: interop, browsers, migration (every release)    few, slow, essential
           │  Playwright: two or three browsers + local signaling server (every PR)
           ▼  Vitest: protocol, core with fakes, palette, migration (every commit)   many, fast
```

## 1. Unit and protocol tests

Vitest, Node environment. Every commit.

- **Validators** (`src/protocol`): accept every recorded fixture ([PROTOCOL.md → Fixtures](PROTOCOL.md#fixtures)); reject wrong types, missing fields, oversize strings, negative or unsafe sizes, more than 1000 files, `totalSize` not matching, non-UUID ids, room secrets outside 64–256 ASCII, thumbnails that aren't JPEG or PNG or exceed 256 KiB.
- **Deployed quirks:** `partition-received` with an object `offset` counts as an acknowledgement; incoming `progress` never changes the sender's display; a 0-byte `header` completes at once; the sender never offers 0-byte files.
- **Links:** order of precedence; `room_id` in any case; `pair_key` exactly 6 digits; invalid values ignored; the three `share_target` forms; parameters stripped before acting.
- **Text codec:** round trip with emoji, right-to-left text and exactly 64 KiB; invalid base64 and invalid UTF-8 dropped.
- **Connection code:** fixed SDP fingerprints give a fixed 16-digit code; the same test vector in the app's tests.
- **File-name sanitizer:** the app's cases (`../../etc/passwd` → `passwd`, control characters, leading dots, 300-byte names, empty, duplicates) plus direction-override characters.
- **Palette:** the contrast test ported from the app (every preset, every custom hue, typed extremes, both modes, focus ring).
- **Migration** (with `fake-indexeddb`): a browser without the old site gets **no** `fastshare_store` database; full legacy data imports per the mapping; invalid records are skipped; the name falls back to localStorage; the import runs once; colour mapping incl. the old defaults.
- **Send and receive** with a fake data channel: pauses above 1 MiB buffered; a `partition` every 16 MiB and a wait for its acknowledgement, with timeout; waits for `file-transfer-complete`; header mismatch and overflow abort; one request per peer; capacity decline with `ios-memory-limit`; unticked files discarded; cancel closes the channel.
- **Signaling** with a fake socket: join order; `pong`; backoff timings (fake timers); the tab reuses its peer id.
- **Connection lifecycle (W-021)** with fake socket, channel and timers:
  - the signaling module never subscribes to `navigator.connection`, and a dispatched `change` event causes no reconnect;
  - `online` and `visibilitychange` don't touch an open socket;
  - `disconnect` is sent only on `pagehide`;
  - a socket close and reconnect leaves every link and running transfer untouched;
  - rooms not re-confirmed within 10 s after a reconnect are dropped;
  - the no-room rule: a running transfer keeps the link until it ends; `disconnect: true` without a transfer removes the device at once; `disconnect: false` without a transfer waits 30 s.
- **Peers registry:** several rooms per peer, badges, older-tab marking, eager limit of 20.

## 2. Screen checks

No component gallery and no fake devices in the UI. Playwright opens the built site against the local signaling server, so screens show real peers. For UI changes the PR carries screenshots of the touched screens in both themes and in the compact, medium and expanded size classes.

## 3. Integration tests

Playwright, every PR. Setup ([SETUP.md](SETUP.md#local-signaling-server-and-browser-flags)):
- the existing signaling server from the old repo, at a pinned commit, on `localhost:3000` (it puts all private addresses in one IP room);
- two or three browser contexts: Chromium and Firefox (WebKit where its WebRTC works on the CI image);
- browser flags that expose host candidates on localhost.

| # | Case | Expected |
|---|---|---|
| I1 | Two contexts open the site | each lists the other within 5 s; names arrive through `display-name-changed` |
| I2 | Text both ways: emoji, exactly 64 KiB, one URL | arrives intact; "Sent" after the confirmation; the URL is a link |
| I3 | Files: a 0-byte file (skipped), 1 KB, 50 MB, three at once | SHA-256 equal; with zipping on, the zip holds identical files |
| I4 | Decline, partial accept, cancel from each side | as in [PROTOCOL.md](PROTOCOL.md#sending-files) |
| I5 | **Network-quality changes during a transfer** (W-021): in Chromium, change the emulated network conditions every few seconds through the DevTools protocol, and also dispatch `change` events on `navigator.connection`, during a 200 MB transfer | the transfer completes; the server saw one connection from the tab; no `disconnect` was sent |
| I6 | **Signaling drop during a transfer** (W-021): block the WebSocket for 20 s at 30% of a 200 MB transfer, then allow it | the transfer completes; the device stays listed and tappable; the socket comes back with the same peer id; the other side saw `peer-left` (`disconnect: false`) and `peer-joined` |
| I7 | Server restart during a transfer | the transfer completes over the existing link; any duplicate entry disappears once the transfer ends |
| I8 | A test peer resets its socket the old site's way (sends `disconnect`, reconnects) during a transfer to the site | the site keeps the link; the transfer completes |
| I9 | Pair by code and by a `?pair_key=` link; reload; unpair | both store the pairing; it works after reload; unpair removes it on both sides |
| I10 | Public room: create, join by `?room_id=` in capitals, leave, rejoin after reload | as in [PROTOCOL.md](PROTOCOL.md#pairing-and-public-rooms) |
| I11 | Open a `?pair_key=` link while the server is down; start the server 20 s later | the pairing runs once the server answers |
| I12 | Two tabs of one browser | the second shows "open in another tab"; "Use here" moves the lock |
| I13 | A fuzzing test peer ([§9](#9-security-tests)) | no crash; the transfer fails cleanly; the failures are counted in the debug log |

## 4. Interop matrix

Manual, at each phase exit from W2 and before cut-over. Peers:
- **N:** the new site (browsers from §5);
- **O:** the old site, still served at `https://fastshare-ja1a.onrender.com/` and using the same server;
- **A2:** the app 2.0 on Android (its online file path depends on app T3.4);
- **A1:** the old app 1.1.25 on Android (and iOS if a device is available).

| Case | N ↔ N | N ↔ O | N ↔ A2 | N ↔ A1 | Phase |
|---|---|---|---|---|---|
| Both appear (same network) | ✔ | ✔ | ✔ | ✔ | W2 |
| Pair by code, both directions of who shows it | ✔ | ✔ | ✔ | ✔ | W2 |
| Pair by QR link (camera opens the site) | ✔ | — | ✔ (app shows the code) | — | W2 |
| Public room, both directions | ✔ | ✔ | ✔ | ✔ | W2 |
| Text both ways, incl. 64 KiB | ✔ | ✔ | ✔ | ✔ | W2 |
| Rename shows on the other side | ✔ | ✔ | ✔ | ✔ | W2 |
| Files 3 MB both ways, SHA-256 equal | ✔ | ✔ | ✔ | ✔ | W3 |
| Files 500 MB both ways | ✔ | ✔ (old site receives into memory: may hit its limits) | ✔ | ✔ | W3 |
| Decline, partial accept, cancel | ✔ | ✔ | ✔ | ✔ | W3 |
| A transfer of 60 s or more in Chromium completes (W-021) | ✔ | ✔ | ✔ | ✔ | W3 |
| Unpair shows on the other side | ✔ | ✔ | ✔ | ✔ | W2 |
| Server cold start: devices appear once it wakes | ✔ | ✔ | ✔ | ✔ | W4 |

Record per row: devices, browsers, versions, result, throughput where measured.

## 5. Browser matrix

Manual, before cut-over and on each release.

| Browser | Platforms | Must work | Also record |
|---|---|---|---|
| Chrome | Windows or Linux, macOS, Android | everything | OPFS limits, install, share target (Android), notifications |
| Edge | Windows | everything | same as Chrome |
| Firefox | Linux or Windows, Android | everything | OPFS in private windows (memory fallback) |
| Safari | macOS, iOS, iPadOS | everything except share target | memory and OPFS limits, home-screen install, notifications for home-screen apps, wake lock |
| Samsung Internet | Android | everything | share target, install |

Each row runs UF1–UF4 from [PRD.md](PRD.md#key-user-flows) and the display checks: both themes, 200% zoom, 320 px wide, landscape phone.

## 6. Migration and PWA tests

On a staging origin that first served the old site (WS-2, WT5.1).

| # | Case | Expected |
|---|---|---|
| M1 | **Returning visitor with the old cache** (old worker `v1.1.22` installed) opens `/` | the first open may show the old site; the second shows the new one; old caches deleted; no manual clearing on any platform |
| M2 | The same visitor's first open is a `?pair_key=` link | the new site loads at once and joins the pairing |
| M3 | Old data present: pairings with auto-accept, a name in IndexedDB, a colour, clipboard history, settings | imported once, per the mapping in [MIGRATION.md](MIGRATION.md#data-migration) |
| M4 | A browser that never ran the old site | no `fastshare_store` database exists afterwards |
| M5 | Rollback to the old site after M3 | the old site starts with its own data intact |
| M6 | An installed Android app from the old manifest | updates in place; opens the new site; any icon-change prompt recorded |
| M7 | Share files and a link to that install, before and after its manifest refresh | the items land in the send tray |
| M8 | An old-site tab and a new tab open together | the old tab treats the new one as this browser; the new one marks the old tab; neither can pair with the other |
| M9 | An old-site tab reloaded into the new site | same peer id and public room after the reload |

## 7. Accessibility tests

- axe-core inside the Playwright runs, on every screen, both themes, three size classes: no serious or critical violations.
- Each release: a keyboard-only run of UF1–UF4.
- Screen readers on Nearby, the incoming sheet, Activity and Link devices: VoiceOver (Safari on macOS and iOS), NVDA (Windows), TalkBack (Chrome on Android).
- 200% zoom, 320 px width, reduced motion, and Windows high-contrast (forced colours) stay usable.

## 8. Performance tests

- The budget in [ARCHITECTURE.md](ARCHITECTURE.md#performance-budget): bundle sizes in CI (`npm run size`); Lighthouse (mobile preset) on the preview URL each release.
- **Throughput:** the old site ↔ old site (Render origin) against the new ↔ new, same devices and Wi-Fi; target ≥ 90%. Also N ↔ A2 for 500 MB.
- **Memory:** receive 2 GB on the OPFS path in Chrome (desktop and Android), Firefox and Safari; the tab stays under 300 MB.
- **Long transfers:** at least one transfer of 60 s or more in Chromium per release (the W-021 regression).

## 9. Security tests

- A fuzzing test peer (`tools/`, WT1.5) sends invalid JSON, wrong types, huge headers, sizes that don't match, bytes past the declared size, SVG and HTML thumbnails, a 10,000-file request and very slow streams. The site stays responsive and fails transfers cleanly.
- Malicious names (path tricks, direction overrides, 300-byte names) appear sanitized in the UI and in downloads.
- Received text with `javascript:` links or markup appears as plain text.
- Preview deployments return the headers in [SECURITY.md](SECURITY.md#headers); any CSP violation in the console fails the end-to-end run.
- Oversized and malformed link parameters are ignored.

## 10. What CI proves and what it doesn't

**CI proves:** types, lint, unit, protocol, migration and palette tests, bundle sizes, end-to-end runs in Chromium and Firefox against a local server (including I5 and I6), and axe checks.

**CI does not prove:** real networks (NAT, Wi-Fi speed), Safari and iOS, installed apps, the share target, notifications, the handover from the old worker, or interop with the apps and the old site. Those are §4–§6. A change that touches the network, storage, the service worker or migration isn't done until its rows have run on real browsers and are listed in the PR.
