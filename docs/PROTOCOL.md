# Protocol: what the site speaks

The wire contracts belong to the app repo and are the source of truth:
- signaling server API: app [API.md → Signaling server API](../../fastshare-n/docs/API.md#signaling-server-api)
- data-channel messages ("legacy web protocol v1"): app [TRANSFER_PROTOCOL.md → Online protocol](../../fastshare-n/docs/TRANSFER_PROTOCOL.md#online-protocol)

This doc does not repeat those specs. It owns:
- the site's entry points and links (the only part of the contract that is the website's own),
- what the site sends and what it accepts, with limits,
- where the deployed old site differs from the app's spec, and which side the site follows.

Decision: W-006. Security rules for parsing are in [SECURITY.md](SECURITY.md#input-validation).

## Rules

1. **Strict on send.** Send only the messages and fields in the tables below. Never send `ws-chunk` or any other WebSocket-fallback type, `lan-endpoint`, or `regenerate-room-secret`. Add nothing new to the wire (there is no capability exchange in v1).
2. **Tolerant on receive.** Ignore unknown fields and unknown message types (apps relay `lan-endpoint` to each other; the site may see it). Accept the deployed quirks listed in [Differences from the app spec](#differences-from-the-app-spec).
3. **Validate everything.** Every server message, data-channel message, link parameter and share-target item goes through a validator in `src/protocol`. Invalid input is dropped and counted in the debug log; it never throws into the UI.
4. **Control is JSON text, bytes are binary.** On the data channel, JSON control messages are text frames and file bytes are binary frames. The site ignores binary frames from the server.

## Entry points and links

The website's own contract. The first two rows are non-negotiable: the app's QR codes and every link the old site ever showed encode them.

| Parameter (on `/`) | Accepted | Action |
|---|---|---|
| `pair_key` | exactly 6 digits | join pairing with that key (`pair-device-join`) |
| `room_id` | 5 letters or digits, any case | join that public room (`join-public-room`, lowercased, `createIfInvalid: false`) |
| `init=pair` | literal | start pairing: show this device's code |
| `init=public_room` | literal | create a public room |
| `share_target=inbox` | literal | take the items the new service worker stored ([ARCHITECTURE.md](ARCHITECTURE.md#flows)) |
| `share_target=text` with `title`, `text`, `url` | strings, 64 KiB together at most | put the text in the send tray (redirect written by the old service worker) |
| `share_target=files` | literal | take files from the old `fastshare_store.share_target_files` store, then clear it ([MIGRATION.md](MIGRATION.md#data-migration)) |
| `base64text`, `base64zip`, `file_handler` | — | ignored (dropped pending owner approval, [MIGRATION.md](MIGRATION.md#feature-parity-with-the-old-site)) |

- **One action per visit.** Only the first parameter present is used, in this order: `pair_key`, `room_id`, `share_target`, `init`.
- **Strip first.** The site removes the parameters from the address bar with `history.replaceState` before acting, so a reload never repeats an action.
- **Wait for the server.** Actions that need the server wait until the server's `display-name` message arrives, for as long as the page is open (Render may need about a minute to wake).
- **Invalid values** show a short message and do nothing else.
- **Text from `share_target=text`:** use `url` alone when present; otherwise `title` and `text` joined by a line break.

**Links the site creates:** `<origin>/?pair_key=NNNNNN` and `<origin>/?room_id=xxxxx` (room code lowercase), where `<origin>` is the page's own origin. In production that is `https://fastshare.ritikthakur.com.np`, the only host the app's scanner accepts. Preview deployments create preview links, for testing only.

**Not handled:** the app's `fastshare://c?...` codes. They describe a LAN endpoint, which a browser can't use.

**Paths:** the site serves `/` plus its static pages (`/privacy`, `/terms`). Any other path answers with the app shell.

## Signaling connection

**URL.** The base comes from W-005 (`VITE_SIGNALING_URL`, or the user's server address). The site appends:

| Query parameter | Value |
|---|---|
| `webrtc_supported` | `true` (the site requires WebRTC, W-019) |
| `peer_id`, `peer_id_hash` | from sessionStorage keys of the same names, once this tab has had a `display-name`; the server keeps the id only if the hash matches |
| `device_icon` | `phone-iphone` for Device type Phone, `desktop-mac` for Computer; omitted for Automatic |

The server derives `deviceName` from the User-Agent; the site can't change it.

**Session.**
1. The server sends `ws-config`, then `display-name`.
2. On `ws-config`: keep the validated `rtcConfig` for new connections. Ignore `wsFallback`: the site has no fallback.
3. On `display-name`: store `peerId` and `peerIdHash` in sessionStorage; keep `displayName` (the default device name) and `deviceName`; add the peer id to localStorage `peer_ids_browser` (W-012). Then send, in order: `join-ip-room`; `room-secrets` with every stored pairing secret (if any); `join-public-room` with `createIfInvalid: true` if sessionStorage `public_room_id` is set. Then run the waiting link action.
4. On `ping`: send `pong` at once. The site runs no keep-alive timer of its own, so it works with the current 1 s / 5 s server timing and with the 25 s / 60 s timing of app D-010.
5. **Reconnect only after a real disconnect** (W-021): the socket's `close` or `error` event; the `online` event while the socket isn't open; the page becoming visible while the socket isn't open. Retry after 1, 2, 4, 8 and 16 s, then every 30 s; an `online` event retries at once. Don't try while `navigator.onLine` is false. Never listen to `navigator.connection`, and never close an open socket to refresh it. The tab keeps its peer id, so peers see `peer-left` (`disconnect: false`) and then `peer-joined`.
6. **Open WebRTC links are untouched by all of this:** a reconnect never closes, recreates or renegotiates them. After a reconnect, every room a device had is marked unconfirmed; the server's `peers` lists confirm them again. Rooms not confirmed within 10 s are dropped (this covers a server restart, after which every peer has a new id), and the device then follows the [no-room rule](#peers-and-connections).
7. On `pagehide`: send `disconnect`, close the socket, remove the peer id from `peer_ids_browser`. This is the only time the site sends `disconnect`.

The tab stays connected while hidden, so a desktop tab in the background can still receive.

### Server → site

| `type` | Validation | Site action |
|---|---|---|
| `ws-config` | `wsConfig.rtcConfig.iceServers`: array of at most 10; each `urls` a string or array of strings starting with `stun:`, `turn:` or `turns:`; strings at most 512 chars | use as ICE servers |
| `display-name` | `peerId` UUID; `peerIdHash` hex, at most 256 chars; names strings | session step 3 |
| `ping` | — | `pong` |
| `peers` | `peers` array (at most 500 used); `roomType` `ip`, `secret` or `public-id`; `roomId` string, at most 256 | add each peer with that room (or confirm the room); the site is the **caller** for each peer it has no open or connecting link to |
| `peer-joined` | `peer` as PeerInfo; room fields as above | add the peer with that room (or confirm it); if no link is open or connecting, wait for its offer |
| `peer-left` | `peerId` UUID; room fields; `disconnect` boolean | remove that room from the peer; never close a link here directly: the [no-room rule](#peers-and-connections) decides |
| `signal` | `sender.id` a known peer; `sdp` (`type` `offer` or `answer`, `sdp` string at most 256 KiB) or `ice` (candidate object, strings at most 4 KiB) | apply to that peer's connection |
| `pair-device-initiated` | `pairKey` 6 digits; `roomSecret` 64–256 ASCII chars | show the code and its QR link |
| `pair-device-joined` | `peerId` UUID; `roomSecret` as above | wait for that peer in that secret room, then store the pairing ([Pairing](#pairing-and-public-rooms)) |
| `pair-device-join-key-invalid` | — | say the code didn't work |
| `pair-device-canceled` | `pairKey` | say the shown code is no longer valid |
| `join-key-rate-limit` | — | say "Too many tries. Wait 10 seconds and try again." |
| `secret-room-deleted` | `roomSecret` | delete that pairing; remove the room from its peers |
| the "room secret replaced" message (its exact `type` is in the app's API.md, in the row shared with `secret-room-deleted`) | `oldRoomSecret`, `newRoomSecret`, each 64–256 ASCII | replace the stored secret; send `room-secrets` with the new one |
| `public-room-created` | `roomId` 5 chars | show the room code; store `public_room_id` |
| `public-room-id-invalid` | `publicRoomId` | say there is no room with that code; clear `public_room_id` if it matches |
| `public-room-left` | — | clear the room state and `public_room_id` |
| anything else | — | ignore |

**PeerInfo:** `id` a lowercase UUID; `name` an object whose `model`, `os`, `browser`, `type`, `deviceName` and `displayName` are optional strings (trimmed, at most 128 chars for display); `rtcSupported` boolean. Peers whose `rtcSupported` isn't `true` are ignored: they could only be reached through the server fallback, which is off (app D-010).

### Site → server

| `type` | Fields | When |
|---|---|---|
| `pong` | — | after each `ping` |
| `join-ip-room` | — | session step 3 |
| `room-secrets` | `roomSecrets: string[]` | session step 3; after the server replaced a room secret |
| `room-secrets-deleted` | `roomSecrets: string[]` | unpair; refusing a pairing with this browser's older tab |
| `pair-device-initiate` | — | Show my code, `?init=pair` |
| `pair-device-join` | `pairKey` | code typed, `?pair_key=` |
| `pair-device-cancel` | — | the code view closes |
| `create-public-room` | — | Create a room, `?init=public_room` |
| `join-public-room` | `publicRoomId` (lowercase), `createIfInvalid` | join (`false`) or rejoin after reconnect (`true`) |
| `leave-public-room` | — | Leave room |
| `signal` | `to`, `roomType`, `roomId`, plus `sdp` or `ice` | WebRTC setup; room fields copied from the first room the site shares with that peer |
| `disconnect` | — | `pagehide` |

## Peers and connections

- **One entry per peer id.** A device can be in several rooms at once (same network, paired, public room): one entry, one connection, one badge per room.
- **Caller rule** (app spec): a peer listed in `peers` is called by the site; a peer announced by `peer-joined` calls the site.
- **Caller:** creates the `RTCPeerConnection` with the ICE servers, the data channel `data-channel` with `{ ordered: true }`, and the offer. **Callee:** waits for the `datachannel` event.
- **Channel:** `binaryType = 'arraybuffer'`, `bufferedAmountLowThreshold` = 1 MiB.
- **On open:** send `display-name-changed` with this device's name. Other clients show the server-assigned name until they get it.
- **Connection code:** `cyrb53` of the caller's and callee's DTLS fingerprints, as defined in the app spec, padded to 16 digits and shown in groups of four (WF20).
- **Closed channel:** the caller opens a new connection if the device still has a room; the callee waits (the old site behaves the same). A transfer running on the closed channel fails.
- **No-room rule** (W-021). When a device has no room left (after `peer-left`, or rooms not confirmed after a reconnect):
  - a transfer is running on its channel: keep the channel and the device until the transfer ends, then close the channel and remove the device unless a room came back;
  - no transfer, `peer-left` said `disconnect: true`: close the channel and remove the device now;
  - no transfer otherwise: wait 30 s for the device to rejoin (a reconnecting peer sends `peer-left` and then `peer-joined`), then close and remove it.
- **Signaling reconnects** never touch links (session steps 5 and 6). A peer that resets its own socket (the old site does on network changes) keeps its side of the link open, so a running transfer to it continues.
- **Eager connections:** at most 20 (W-020).
- **This browser's older tabs** (their peer id is in `peer_ids_browser`): listed as "This browser, older tab"; never paired with, never auto-accepted.

## Data-channel messages

### Sent by the site

| Message | When | Rules |
|---|---|---|
| `display-name-changed` `{ displayName }` | channel opens; user renames | trimmed, at most 64 chars |
| `request` `{ header, totalSize, imagesOnly, thumbnailDataUrl }` | user sends files | `header`: 1–1000 entries `{ name, mime, size }` with the file's own name; `mime` from the file, else from its extension, else `application/octet-stream`; `totalSize` = sum of sizes; `imagesOnly` = every `mime` starts with `image/`; `thumbnailDataUrl` = JPEG data URL of the first file, at most 400 px wide and 256 KiB, if it is an image this browser can decode, else `""` |
| `header` `{ name, mime, size }` | before each file's bytes | same values as in `request` |
| binary | file bytes | at most 64,000 bytes per message |
| `partition` `{ offset }` | after each full 16 MiB of a file, never after its last chunk | `offset` = bytes of this file sent so far |
| `files-transfer-response` `{ accepted }` | answer to a `request` | adds `reason: "ios-memory-limit"` only when declining because the offer doesn't fit ([Receiving files](#receiving-files)) |
| `partition-received` `{ offset }` | everything before the partition is written | `offset` = the number received, or this file's received byte count if none was a number |
| `progress` `{ progress }` | while receiving, at most once per 0.5% | **overall** fraction 0–1 of all accepted bytes ([differences](#differences-from-the-app-spec)) |
| `file-transfer-complete` | each file stored (or discarded, if unticked) | — |
| `text` `{ text }` | user sends text | base64 of the UTF-8 bytes; at most 64 KiB of UTF-8; longer text is offered as a `.txt` file instead |
| `message-transfer-complete` | a received `text` is shown and stored | — |

### Accepted by the site

| Message | Validation and handling |
|---|---|
| `display-name-changed` | string; trimmed; control characters removed; at most 64 chars; empty keeps the current name |
| `request` | `header` array of 1–1000; each `name` a string of at most 1024 chars (sanitized before display and saving, [SECURITY.md](SECURITY.md#input-validation)); `mime` a string of at most 255 (anything else counts as `application/octet-stream`); `size` a safe integer ≥ 0; `totalSize` must equal the sum, else decline; `imagesOnly` used only for wording; `thumbnailDataUrl` shown only if it starts with `data:image/jpeg;base64,` or `data:image/png;base64,` and is at most 256 KiB |
| `files-transfer-response` | `accepted` boolean; optional `reason` string; only `ios-memory-limit` gets its own message |
| `header` | must match the next accepted file's `name` and `size` (`mime` may differ); otherwise abort |
| binary | only between a `header` and the end of that file; bytes past the declared size abort the transfer |
| `partition` | any shape; `offset` read only if it is a safe integer |
| `partition-received` | any `offset` value, including an object; counts as the acknowledgement of the outstanding partition |
| `progress` | ignored for the sender's own display (W-009) |
| `file-transfer-complete`, `message-transfer-complete` | no fields needed |
| `text` | base64 string of at most 1.4 MiB; decoded UTF-8 of at most 1 MiB; invalid base64 or UTF-8 is dropped |
| anything else | ignored |

## Sending files

1. **Skip empty files.** Old receivers wait forever for a 0-byte file ([differences](#differences-from-the-app-spec)). The send tray says so when it skips one.
2. Send `request`. One outstanding request per peer at a time: receivers decline a second one automatically.
3. Wait for `files-transfer-response`. There is no time limit while the channel is open; Cancel closes the channel. Declined: say so, with the memory-limit wording when `reason` is `ios-memory-limit`.
4. For each file, in `header` order: send `header`, then the bytes with flow control (W-009); after every 16 MiB send `partition` and wait up to 60 s for `partition-received`. After the last byte, wait up to 60 s for `file-transfer-complete` before the next file.
5. The transfer is done after the last `file-transfer-complete`.

**Failure:** if the channel closes or a wait times out, the transfer fails and the remaining files are not sent. There is no resume online (app D-007); the user can send again.

## Receiving files

1. A `request` arrives. If a request from the same peer is already waiting or running, answer `files-transfer-response { accepted: false }` (old-site rule). Invalid requests are declined the same way.
2. **Capacity:** if no storage sink can hold `totalSize` (W-008), decline with `reason: "ios-memory-limit"` and tell this user why. It is the only decline reason the old site and the old app explain to their user.
3. **Auto-accept** if the sender is paired and Auto download allows it (W-015). Otherwise show the incoming sheet; sheets from several peers queue, one at a time.
4. **Partial accept:** the protocol can't skip files, so unticked files still arrive and are discarded unwritten (the app does the same).
5. Answer `files-transfer-response { accepted: true }` or `{ accepted: false }`.
6. For each `header`: check it, open a sink, write the bytes, send `progress`, flush and answer each `partition`, and send `file-transfer-complete` when the byte count reaches `size`. A 0-byte `header` completes at once.
7. After the last file: the received sheet (Save, Share), or an automatic save (Settings → Save automatically).

**Mismatch or overflow:** close the channel, delete the temporary files, and say the files didn't match what was offered.

**Senders that never send `partition`** (the old site): the receiver can't slow them down, so it must keep up. It holds at most 64 MiB of unwritten data; beyond that it fails the transfer cleanly instead of growing memory.

## Text

- Encode: UTF-8 bytes, then base64. Decode: base64, then UTF-8.
- After a `text` arrives: show it as plain text with safe links ([SECURITY.md](SECURITY.md#input-validation)), add it to the clipboard history, send `message-transfer-complete`.
- The sender shows "Sent" when `message-transfer-complete` arrives, and says there was no confirmation after 30 s.

## Cancel

The protocol has no cancel message. Cancel, on either side, closes the data channel. The other side treats the close as a failed transfer (the old site also closes its request sheet). The caller then reconnects automatically.

## Pairing and public rooms

**Pairing with the server's key** (the only pairing a browser can do; LAN pairing is app-only):

```
Device A (shows the code)                Server                     Device B (types it, or opens ?pair_key=)
pair-device-initiate ────────────────►
◄──────── pair-device-initiated {pairKey, roomSecret}      (A is now in the secret room)
shows "123 456" and a QR of <origin>/?pair_key=123456
                                          ◄───────────────── pair-device-join {pairKey}
◄── pair-device-joined {peerId: B, roomSecret}   pair-device-joined {peerId: A, roomSecret} ──►
                                          (B joins the secret room: peers / peer-joined follow)
both: once the other peer appears in that secret room, store {secret, alias, deviceName, autoAccept: false}
```

- The code is valid while it is shown. Closing the code view sends `pair-device-cancel`.
- If the other peer turns out to be this browser's older tab, send `room-secrets-deleted` with that secret and say this browser can't pair with itself.
- The pairing's alias is the peer's name at that moment (from `display-name-changed` if already received, else the server name). Later `display-name-changed` messages from that peer update it.
- Unpair: delete locally, send `room-secrets-deleted`. The server tells the other device with `secret-room-deleted`, so both forget.

**Public rooms:**
- Create: `create-public-room` → `public-room-created { roomId }`. Show the code in capitals and a QR of `<origin>/?room_id=<lowercase code>`.
- Join: `join-public-room { publicRoomId, createIfInvalid: false }` → `peers` for the room, or `public-room-id-invalid`.
- Rejoin after reconnect: the same with `createIfInvalid: true`.
- Leave: `leave-public-room` → `public-room-left`. The server allows one public room per connection.
- The room id is kept in sessionStorage `public_room_id` (the old site's key: per tab, survives reloads).

## Differences from the app spec

Where the deployed old site (repo HEAD `65334e2`, checked 2026-11-14) differs from the app's spec, or the spec is silent. Deployed behaviour wins on receive.

| # | Topic | App spec | Deployed old site | The site |
|---|---|---|---|---|
| 1 | `progress` meaning | 0–1 for the current file | the receiver sends the fraction of `totalSize` received so far; the sender shows it as is | sends the overall fraction; ignores incoming `progress` (the app also ignores it) |
| 2 | `partition-received.offset` | the offset, a number | echoes the whole `partition` message object | accepts any value; sends a number |
| 3 | partitions from senders | sent every 16 MiB | the old sender never sends `partition` | sends them; as a receiver keeps up without them (64 MiB cap) |
| 4 | when a receiver acknowledges | after the previous partition is written | at once, on arrival | after writing |
| 5 | 0-byte files | not covered | the old receiver ignores empty frames and never completes an empty file; the old sender sends no bytes for one | never offers 0-byte files; completes a 0-byte `header` at once |
| 6 | text size | the app drops text over 64 KiB | no limit | sends at most 64 KiB (a file beyond that); accepts up to 1 MiB |
| 7 | thumbnail | JPEG data URL up to 400 px, or `""` | shows only `data:image/jpeg;base64` thumbnails | sends JPEG only; accepts JPEG or PNG up to 256 KiB |
| 8 | one request at a time | not covered | a second request from the same peer gets `accepted: false` | same rule in both directions |
| 9 | decline reason | `ios-memory-limit` from old iOS clients | sent by iOS Safari for offers of 200 MB or more | sent whenever the offer doesn't fit this browser |
| 10 | file check | files follow `request.header` order | checks name and size after the whole file arrived | checks at `header` time and aborts early |
| 11 | room codes | the app's parser accepts 5 of `[a-z0-9]` | accepts 5 letters; the server issues letters only | accepts letters and digits in any case; sends lowercase |
| 12 | name after connecting | not covered | sends `display-name-changed` when the channel opens and on rename; the app sends it on open | same as the old site |

Rows 1, 2 and 5 should also be written into the app's spec ([MIGRATION.md](MIGRATION.md#follow-ups-in-other-repos)).

## Fixtures

`src/protocol/fixtures/web-v1/*.json` holds message sequences recorded from the deployed old site, both directions, and from the app (task WT1.5): request and response, header, partitions with the object-valued acknowledgement, progress series, text, name changes, server room messages. Every validator must accept every recorded message, and the builders must produce messages identical in shape to what old clients send. The same files are offered to the app repo (W-007).

## Versioning

Protocol v1 has no version or capability exchange, so the site adds nothing to the wire. Old clients ignore unknown data-channel message types and the server drops unknown types instead of relaying them, so a future extension could start with a capability message on the data channel. That needs a decision in both repos first.
