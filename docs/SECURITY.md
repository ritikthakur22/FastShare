# Security and Privacy (website)

Requirements every change must keep. Decisions: W-015 (auto download), W-017 (no third parties), W-018 (CSP). Wire details: [PROTOCOL.md](PROTOCOL.md). The app's rules are in app [SECURITY.md](../../fastshare-n/docs/SECURITY.md); this doc covers the browser client.

## Principles

1. **Files never touch a FastShare server.** Bytes travel over WebRTC data channels, encrypted with DTLS. Signaling uses WSS. A future TURN relay (app D-012) would carry only encrypted bytes.
2. **Nothing is accepted without consent.** Every incoming transfer needs Accept, except from a paired device whose auto-accept is on (W-015).
3. **No accounts, analytics, trackers, cookies or third-party requests** (W-017).
4. **Least privilege.** Notification permission is asked only after a tap. No camera, microphone or location.
5. **Assume hostile input.** Every network message, link parameter, shared item and stored record is validated; nothing from the network is ever turned into HTML.

## Threat model

| Threat | Mitigation |
|---|---|
| A stranger behind the same public IP (office, campus, carrier NAT) sends unwanted files | Accept prompt; auto download only for paired devices (W-015); one request per peer; requests queue; the sheet shows the link badge and connection code |
| Malicious file names (path tricks, control or direction-override characters, very long names) | sanitized before display and before use as a download name ([Input validation](#input-validation)); never used as a path |
| Malicious file contents | the site never opens or runs received files; previews only for images (not SVG), audio and video, through browser media elements; everything else is only saved |
| Malicious text (markup, phishing links) | shown as text nodes; only `http:` and `https:` URLs become links, showing the exact URL; links never open by themselves |
| Thumbnail abuse | only JPEG or PNG data URLs up to 256 KiB, in an `<img>` |
| Oversized or endless data (memory or disk exhaustion) | byte counts checked against the offer, abort on overflow; caps: 1000 files, 64 MiB unwritten buffer, 1 MiB text, message size limits ([PROTOCOL.md](PROTOCOL.md#accepted-by-the-site)); storage checked before accepting |
| A device pretending to be someone ("Mum's phone") | names are labels, not identity; the Paired badge comes only from a shared secret room; the connection code lets two people check a connection out of band |
| Guessing a pairing code | 6 digits, valid only while shown; the server allows 10 tries per 10 s per connection; pairing completes only when the peer appears in the secret room |
| Theft of room secrets | stored only in IndexedDB at this origin; never logged, never in URLs; CSP blocks injected script; unpair deletes the secret on both sides through the server |
| Script injection | CSP without inline script or eval ([Headers](#headers)); no HTML-string APIs (lint rule, [CODE_STYLE.md](CODE_STYLE.md)); no third-party scripts; few dependencies |
| Hostile links (`?pair_key=`, `?room_id=` and others) | strict formats; one action per visit; nothing is ever sent because of a link; shared items still need a device tap |
| Clickjacking | `frame-ancestors 'none'` and `X-Frame-Options: DENY` |
| Signaling server operator | sees IP addresses, peer ids, names, room membership, room secrets in transit (inside WSS) and SDP/ICE data (including local and public IPs); never file names or contents, which travel inside DTLS. Stated on the privacy page |
| A malicious signaling server swapping DTLS fingerprints (man in the middle) | possible by design of the protocol; the connection code (WF20), compared out of band, detects it; same model as the old site and the app |
| STUN server | the STUN server named by the signaling server (Google's by default) sees the public IP when a connection is set up. Stated on the privacy page |
| This browser's older tabs | marked, never paired with, never auto-accepted (W-013) |
| Stale code after a security fix | network-first page loads and `no-cache` on the page and the service worker (W-010) |
| Supply chain | lockfile, `npm ci`, the [dependency policy](#dependency-policy), audit in CI |

## Headers

Served by Vercel from `vercel.json` (W-004) on every response. This block is the source of truth for their values.

```
Content-Security-Policy: default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:;
  media-src 'self' blob:; font-src 'self'; connect-src 'self' wss:; worker-src 'self'; manifest-src 'self';
  form-action 'self'; base-uri 'none'; frame-ancestors 'none'; object-src 'none'; upgrade-insecure-requests
Referrer-Policy: no-referrer
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Permissions-Policy: camera=(), microphone=(), geolocation=(), display-capture=(), usb=(), payment=()
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
Strict-Transport-Security: max-age=63072000
```

(The CSP is one line in `vercel.json`; it is wrapped here for reading.)

- `connect-src 'self' wss:` allows any secure WebSocket host, for the custom server address and the move in app D-011 (W-018).
- `img-src data:` is for received thumbnails; `blob:` for previews of received files.
- `worker-src 'self'` covers the service worker and the OPFS writer worker. No blob workers.
- Downloads use `<a download>` links to object URLs; CSP doesn't restrict them.
- Colours set through the CSSOM (`style.setProperty`) are allowed by `style-src 'self'`; the build emits no inline styles or scripts.
- HSTS is already sent by Vercel on the live site; keep it.
- The development server has no CSP. Every preview deployment is checked: headers present, and no CSP violation in the browser console during the end-to-end tests (WT1.6, [TESTING.md](TESTING.md#9-security-tests)).
- Later hardening: `require-trusted-types-for 'script'`, once the built site is shown to run clean with it in Chromium.

## Input validation

Everything from the network, link parameters, share-target items and stored data read back is untrusted.

- **Messages:** validated in `src/protocol` with hand-written type guards: types, lengths, enums, integer ranges (sizes are safe integers ≥ 0). Limits per message: [PROTOCOL.md](PROTOCOL.md#accepted-by-the-site). No `as` casts on untrusted data.
- **File names** (the app's rules, plus one): take the base name; remove control characters, `/ \ : * ? " < > |` and leading dots; **remove direction-override and isolate characters (U+202A–U+202E, U+2066–U+2069)** so a name can't disguise its extension; NFC-normalise; at most 200 bytes of UTF-8, keeping the extension; `file` if empty; duplicates within one transfer become `name (1).ext`. The extra rule should be ported back to the app's sanitizer (W-007).
- **Device names from peers and the server:** text only; control and direction characters removed; at most 64 characters (128 for the server's device line).
- **Text:** shown with text nodes. Link detection takes `http://` or `https://` followed by non-space characters, parses it with `URL`, and allows only those two schemes. A link is an `<a>` with `rel="noopener noreferrer"` and `target="_blank"`, showing the URL itself. No other markup is ever interpreted.
- **Thumbnails:** `data:image/jpeg;base64,` or `data:image/png;base64,` only, at most 256 KiB, in an `<img>`.
- **Previews of received files:** `image/*` except `image/svg+xml`, `audio/*`, `video/*`, from object URLs that are revoked when the sheet closes.
- **Link parameters:** exact formats from [PROTOCOL.md](PROTOCOL.md#entry-points-and-links); anything else is ignored.
- **Stored data read back:** settings, pairings, history and legacy records are validated on read; invalid records are skipped, never trusted.

## Local data and secrets

- **Room secrets** live in IndexedDB `pairings` (browsers give pages no better secret store). They never appear in logs, URLs or the debug report.
- **Unpair** deletes the secret locally and sends `room-secrets-deleted`, so the other device forgets it too.
- **Remove all FastShare data** (Settings → Storage, WF26): unpairs every device as above, then deletes `fastshare_web`, the `fs.*` keys and the temporary files, and reloads. Useful on shared computers. It never touches the old site's `fastshare_store` (W-012).
- **Temporary files** in OPFS are deleted after saving, after 24 hours, or with Settings → Storage → Clear.

## Privacy

What leaves the browser:

| To | What |
|---|---|
| Signaling server | IP address, User-Agent (the server turns it into a device line), the server-assigned name and peer id, room membership, pairing secrets in `room-secrets`, SDP and ICE data (which contain IP addresses) |
| STUN/TURN servers named by the signaling server | the IP address |
| The other device | this device's name, file names, sizes and types, a thumbnail of the first image, the files and texts sent |

- **Stored in the browser:** [ARCHITECTURE.md → Local data](ARCHITECTURE.md#local-data). No cookies.
- **Debug report** (About → Copy debug info, WF24): version, browser, size class, server state, number of devices, and the last 200 events as codes with timestamps. Never included: room secrets, pairing keys, room codes, file names, text bodies, IP addresses, full peer ids (first 8 characters at most). The user copies it themselves; nothing is uploaded.
- **Privacy page** (if hosted here, PRD question 6) must state: no data collection by FastShare; what the signaling server processes, in memory only; that the STUN server sees the IP address; that files and texts go directly between devices; what is stored in the browser and how to remove it.

## Dependency policy

- Runtime dependencies are only those named in W-002. Adding one needs a reason in the PR: a platform API or a few lines of code must not be able to do the job.
- Everything is served from the site's own origin: no CDN, no remote fonts.
- The lockfile is committed; CI installs with `npm ci` and runs `npm audit --omit=dev` (report only); lockfile diffs are reviewed.

## Known issues inherited

These are in the old site, not the new code.

| Severity | Issue | Action |
|---|---|---|
| High | Resets the server connection on `navigator.connection` changes, which loses running transfers | fixed by design (W-021); optional fix in the old site ([MIGRATION.md](MIGRATION.md#follow-ups-in-other-repos)) |
| Medium | Received files are held in memory; large files crash tabs | W-008 |
| Medium | The cache-first worker keeps users on stale versions | W-010 |
| Medium | The old repo ships GPL-derived code without a `LICENSE` file | old-repo task (app D-019) |
| Low | Received text is turned into links by building HTML strings | the new site builds DOM nodes ([Input validation](#input-validation)) |
| Low | The About section shows a personal e-mail address | not carried over (PRD question 5) |
| Low | Server keep-alive pings every second | app D-010 |

## Reporting vulnerabilities

Report privately through GitHub security advisories on the website repository, not in public issues. Target: acknowledge within 7 days.
