# Design System (website)

**Status: Proposed**, together with app D-018. It becomes Approved when the owner signs off a visual mock of the screens below in both themes (tasks WT1.3, WT2.3).

The app's [DESIGN_SYSTEM.md](../../fastshare-n/docs/DESIGN_SYSTEM.md) owns the direction ("Quiet Signal"), its principles, the accent presets and the copy voice. The colour **values** come from the app's code, `src/ui/tokens.ts` (W-007). This doc owns the web adaptation: CSS tokens, the web type scale, layouts per screen size, components and screens.

## Principles

1. **The radar is the signature, and the transfer lives on it** (app). Devices sit on rings around this device; a transfer is a ring filling around the receiving device.
2. **Quiet surfaces, one signal** (app). Near-monochrome surfaces; the accent means "live": a primary action, a running transfer, a fresh completion.
3. **An app, not a page.** The site opens straight into Nearby. System fonts, the OS theme, no marketing hero, no hover-only actions.
4. **Motion means something** (app). Rings mean "looking" (server connected), a spring means "found", a filling ring means "sending". Nothing moves for decoration.
5. **Honest, calm copy** (app).

**Not this.** The generic template looks are out: cream or beige backgrounds with terracotta accents, neon colours on black, glows and coloured shadows, gradient text, glass blur (the old site's sidebar), emoji labels, uppercase tracked labels, decorative blobs, stock illustrations. Only two gradients exist: the brand mark's fixed blue (it is the logo) and the radar sweep fading to transparent (it shows "looking" and stops otherwise).

## Colour

The user picks a mode (System, Light, Dark) and an accent: one of six presets, or Custom (18 hue swatches every 20°, or a typed hex code). `buildPalette(choice, mode)` and the contrast helpers are copied from the app's `src/ui/tokens.ts` into `src/ui/palette.ts`, so the same choice gives the same colours in both products.

- Presets and their light/dark values: app [DESIGN_SYSTEM.md → Accent presets](../../fastshare-n/docs/DESIGN_SYSTEM.md#accent-presets).
- Custom colour behaviour (hue lightness search, hex correction to 4.5:1, the "shown as" note): app [DESIGN_SYSTEM.md → Custom colour](../../fastshare-n/docs/DESIGN_SYSTEM.md#custom-colour).
- Neutrals: from `tokens.ts`. The app doc's table of dark neutrals differs from `tokens.ts`; the code wins ([MIGRATION.md](MIGRATION.md#follow-ups-in-other-repos)).

**CSS variables**

| Token (app) | CSS variable | Use |
|---|---|---|
| `bg` | `--fs-bg` | page background, segmented-control track |
| `surface` | `--fs-surface` | cards, rows, sheets, tab bar |
| `surfaceRaised` | `--fs-surface-raised` | send tray, menus, selected segment |
| `separator` | `--fs-separator` | 1 px lines and borders |
| `textPrimary` | `--fs-text` | titles, names, body |
| `textSecondary` | `--fs-text-2` | subtitles, metadata |
| `textTertiary` | `--fs-text-3` | large text and icons only (3:1) |
| `accent` | `--fs-accent` | live state, primary buttons, progress, selected tab |
| `onAccent` | `--fs-on-accent` | text and icons on the accent |
| `accentTint` | `--fs-accent-tint` | selected-tab capsule, progress fill behind rows |
| `danger` | `--fs-danger` | destructive actions, failures |
| `warning` | `--fs-warning` | waiting, paused |
| `scrim` | `--fs-scrim` | page dimming behind dialogs, same in both modes |
| `shadowRaised` | `--fs-shadow` | raised elements, light mode only |

**How it is applied.** `palette.ts` computes the variables; `settings` writes them to `fs.palette` and sets them on `<html>` through `style.setProperty`; `/theme.js` re-applies them before the first paint on the next load (W-018). The stylesheet also contains the default palette for both modes under `prefers-color-scheme`, so the page is right without JavaScript. `color-scheme` follows the mode, and `<meta name="theme-color">` follows `--fs-bg`.

**Rules**
- Contrast is enforced by a test ported from the app's `tokens.test.ts`: every preset, every custom hue and typed extremes (white, black, grey, neon yellow, navy) in both modes; body text, secondary text, accent, on-accent, danger and warning at 4.5:1 or better; tertiary at 3:1; the focus ring at 3:1 against both `--fs-bg` and `--fs-surface`.
- Status is never shown by colour alone: always an icon and text too. The selected swatch carries a check.
- QR codes are black on white in both modes, with a 4-module quiet zone.

## Brand mark and icons

- **Brand mark:** the blue "F" from the app (`src/ui/BrandMark.tsx`), as an SVG file with the same paths and fixed gradient. Never tinted with the accent. Used top-left of Nearby (compact) or in the header (expanded), as the favicon (SVG with PNG fallbacks), and as a one-colour silhouette for the notification badge.
- **Install icon:** the app's `assets/icon.png`, exported as 192 and 512 px "any" icons with transparent corners, and as maskable icons with the blue background extended to the full square. The source PNG has black corners: crop carefully or use the source artwork (WT4.1).
- **UI icons:** Material Symbols Rounded (Apache-2.0), weight 400, as an inline SVG sprite holding only the icons in use, drawn through one `<Icon name>` component. SF Symbols are licensed for Apple platforms only, so the site uses one family everywhere.

| Semantic name | Material Symbol | Semantic name | Material Symbol |
|---|---|---|---|
| `phone` | `smartphone` | `send` | `send` |
| `tablet` | `tablet_android` | `received` | `download` |
| `desktop` | `laptop` | `link` | `link` |
| `browser` | `language` | `qr` | `qr_code_2` |
| `sameNetwork` | `wifi` | `refresh` | `refresh` |
| `internet` | `public` | `settings` | `settings` |
| `paired` | `verified` | `activity` | `history` |
| `room` | `meeting_room` | `nearby` | `radar` |
| `edit` | `edit` | `clipboard` | `content_paste` |
| `check` | `check` | `copy` | `content_copy` |
| `close` | `close` | `share` | `share` |
| `failed` | `error` | `trash` | `delete` |
| `info` | `info` | `install` | `install_mobile` |
| `signal` | `wifi_tethering` | `folder` | `folder` |

## Typography

System fonts only: `system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", Ubuntu, Cantarell, "Helvetica Neue", Arial, sans-serif`, then the platform emoji fonts. No web fonts. Sizes are in `rem`, so browser zoom and text-size settings work. Every number that changes during a transfer uses `font-variant-numeric: tabular-nums`.

| Token | Size / line height | Weight | Use |
|---|---|---|---|
| `largeTitle` | 2rem / 2.5rem | 800 | view titles ("Nearby") |
| `title` | 1.375rem / 1.75rem | 600 | sheet and dialog titles |
| `headline` | 1rem / 1.5rem | 600 | device names, row titles |
| `body` | 1rem / 1.5rem | 400 | body text |
| `callout` | 0.875rem / 1.25rem | 400 | secondary lines |
| `footnote` | 0.75rem / 1rem | 400 (500 in the tab bar) | metadata, badges |
| `mono` | 0.875rem / 1.25rem | 500, tabular | connection codes |
| `code` | 2rem / 2.5rem | 700, tabular, letter-spacing 0.1em | pairing key, room code |

The wordmark "FastShare" next to the brand mark: 1.125rem, weight 800, letter-spacing −0.02em.

## Spacing, shape and elevation

- **Spacing** (4 px grid): `--fs-space-xs` 4 · `sm` 8 · `md` 12 · `lg` 16 · `xl` 24 · `xxl` 32 · `xxxl` 48. Page side padding: 16 px compact, 24 px medium and expanded.
- **Radii:** control 10 px · row 14 px · sheet 24 px · tab bar 28 px · pill 999 px.
- **Targets:** at least 44 × 44 px, 48 × 48 px on coarse pointers.
- **Elevation:** light mode puts `--fs-shadow` (`0 4px 16px rgba(17,18,20,0.08)`) on raised elements; dark mode uses `--fs-surface-raised` plus a 1 px `--fs-separator` border. No other shadows.
- **Width:** single-column content at most 720 px, centred.

## Motion

| Token | Value | Use |
|---|---|---|
| `fast` | 120 ms, ease-out | press feedback, toggles |
| `base` | 220 ms, ease-in-out | rows in and out, tray show and hide |
| `slow` | 320 ms | content next to sheets |
| `spring` | a CSS `linear()` curve matching the app's spring (damping 18, stiffness 220); fallback `cubic-bezier(0.2, 0.9, 0.3, 1.15)` | devices springing in, the tray |

- **Radar:** three pulse rings with a 3.6 s period, a third apart; the sweep turns once per 4.5 s. Both run only while the server is connected.
- **Devices:** spring in when they appear; fade out over `base` when they leave.
- **Progress ring:** the stroke offset follows progress over 300 ms, linear; on completion a check badge fades in and the ring fades over 1.2 s.
- Animate only `transform` and `opacity` (plus the ring's stroke offset).
- **Reduced motion** (`prefers-reduced-motion: reduce`): no sweep, no pulses; devices fade in; other changes are 120 ms cross-fades; progress moves without interpolation.
- **Haptics:** not used on the web (no Vibration API on iOS, unreliable elsewhere).

## Layouts

Size classes follow the viewport width; components adapt inside with container queries (W-011).

| Size class | Width | Navigation | Nearby |
|---|---|---|---|
| compact | < 600 px | floating pill tab bar: Nearby · Activity · Settings | radar, device card, Send and Receive |
| medium | 600–1023 px | floating pill tab bar, at most 560 px wide, centred | larger radar; content at most 720 px |
| expanded | ≥ 1024 px | header: brand, Link devices, Refresh, Settings; no tab bar | two panes: radar (main) and Activity (360–400 px column) |

**Compact radar:** when the radar would not fit (viewport under 560 px high, landscape phones, text zoomed 130% or more, or more devices than slots), Nearby shows a small radar on top and the devices as a list (app rule).

**Compact (phone)**

```
┌──────────────────────────────────┐
│ [F] FastShare                    │
│ Nearby                (⛓) (↻)    │  link devices, refresh
│ Devices on this network, paired  │
│ devices and rooms                │
│            ·  ·  ·  ·            │  rings (hairlines), sweep while looking
│      (ph)            (web)       │  devices on slots, nearest arc first
│     Teal Fox        Studio PC    │
│      42%           Same network  │  status line: percent while sending
│              ((●))               │  this device
│ ┌──────────────────────────────┐ │
│ │ [▢] Ritik's phone         ✎  │ │  device card, rename
│ │     Visible to 2 devices     │ │
│ └──────────────────────────────┘ │
│ [ ➤ Send ]        [ ↓ Receive ]  │
│ ╭──────────────────────────────╮ │
│ │ (Nearby)  Activity  Settings │ │  floating pill, selected in a tint capsule
│ ╰──────────────────────────────╯ │
└──────────────────────────────────┘
```

**Expanded (desktop)**

```
┌────────────────────────────────────────────────────────────────────────────────────┐
│ [F] FastShare                                       (⛓ Link devices) (↻) (⚙)       │
├─────────────────────────────────────────────────────────┬──────────────────────────┤
│ Nearby                                                  │ Activity                 │
│ Devices on this network, paired devices and rooms       │ In progress              │
│                    ·        ·        ·                  │ ┌──────────────────────┐ │
│          (phone)                       (laptop)         │ │ ▣ trip.mp4 → Teal Fox│ │
│          Teal Fox                      Studio PC        │ │ 1.2 of 2.1 GB · 9 MB/s│ │
│                          ((●))                          │ └──────────────────────┘ │
│                     Ritik's laptop                      │ Today                    │
│                                                         │  notes.txt    Received   │
│  ┌───────────────────────────────────────────────────┐  │  3 photos     Sent       │
│  │ Drop files here or on a device                    │  │                          │
│  └───────────────────────────────────────────────────┘  │ Clipboard history  ›     │
│  [ ➤ Send files ]   [ ✎ Send text ]                     │                          │
└─────────────────────────────────────────────────────────┴──────────────────────────┘
```

**Why two panes on desktop** (W-011):
1. After dropping files, people watch them go. Devices (the drop targets) and progress (Activity) are visible at once.
2. Mouse users drag files onto a device; the radar must stay on screen during the drag.
3. Settings are rare, so they open as a side sheet instead of taking a tab.
4. A bottom tab bar is a touch idiom; on a wide screen it sits far from the content and wastes height.
5. The identity holds: the same radar, cards, pill buttons and accent capsules.

**Viewport and safe areas.** `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`, never `maximum-scale` or `user-scalable=no` (WCAG 1.4.4; the owner's uncommitted copy of the old site adds that lock, the live site doesn't have it). Installed apps pad for `env(safe-area-inset-*)`. Heights use `dvh`, so mobile browser toolbars never cover the tab bar. `scroll-padding-bottom` equals the tab bar plus the tray, so neither covers a focused element.

## Components

All live in `src/ui/`, styled only with the tokens above. There is no component gallery: components are checked on the real screens, in both themes, in the size classes above.

| Component | Anatomy | Notes |
|---|---|---|
| `BrandMark` | the "F" as SVG | fixed brand colours |
| `FloatingTabBar` | rounded pill floating 8 px above the bottom safe area; three items with icon and label; the selected one in an accent-tint capsule with accent icon and bold label; soft shadow (light) or hairline (dark) | `<nav aria-label="Main">`; items are links with `aria-current="page"` |
| `IconButton` | 42 px round surface button with a 1 px border, 44 px hit area | header actions |
| `Button` | primary (accent), secondary (surface with border), danger, text; 52 px pills for main actions, control radius inside dialogs | one primary per view |
| `Chip` | pill toggle | Activity filters |
| `Segmented` | `--fs-bg` track, raised selected segment | theme, Link devices tabs |
| `Switch` | a native checkbox, styled, label first | settings rows |
| `TextField` | label above, 48 px field | names, server address |
| `CodeInput` | one field, `inputmode="numeric"`, `autocomplete="one-time-code"`, accepts paste, large tabular digits; a letters variant for room codes, shown in capitals | never six separate boxes (better for paste and screen readers) |
| `CodeDisplay` | large tabular digits in groups of three, or five capitals | with "Copy link" |
| `QrCode` | inline SVG, black on white, quiet zone, 176–220 px | labelled for screen readers; clicking it copies the link (old-site behaviour) |
| `AccentPicker` | six preset swatches plus Custom (18 hue swatches and a hex field); check on the selected swatch | opened from a one-line "Colour" row, as in the app |
| `Radar` | SVG rings in accent at low opacity, the sweep wedge, pulses | `aria-hidden`; devices are separate buttons |
| `PeerAvatar` | 56 px glyph disc inside a 68 px progress ring, link badge at the lower right, name (2 lines at most), status line | a `<button>` |
| `DeviceRow` | 44 px glyph tile, name, link line, trailing state, progress fill behind the row | the device list (overflow, compact radar) |
| `SendTray` | accent send disc, title ("3 items ready to send"), detail line, Clear (Done after a first send); optional full-width "Send to all 3 devices" | floats above the tab bar (compact) or at the foot of the radar pane (expanded); polite live region |
| `TransferRow` | file-type tile in its type's colour, name, "1.2 of 2.1 GB · 8.4 MB/s · 24 s left", actions | Activity |
| `Sheet` | bottom sheet with grabber (compact), centred dialog (medium), right side sheet (expanded) | built on `<dialog>` with `showModal()` |
| `ConfirmDialog`, `PromptDialog` | themed card on the scrim: icon disc, title, one or two sentences, Cancel and the action (danger colour when destructive); the prompt adds one field | never `alert()`, `confirm()` or `prompt()`: they ignore the theme |
| `Toast` | dark pill with icon and text at the top, 2.2 s | `role="status"`; never takes focus |
| `Banner` | inline icon, text and action | notification permission, server problems |
| `EmptyState` | icon in an accent disc, title, one sentence | no illustrations |
| `Skeleton` | grey blocks with a soft pulse | Activity while loading |
| `DropOverlay` | full-window frame in accent tint, "Drop to add to the send tray" | only while files are dragged over the window |
| `LinkBadge` | icon and text: "Same network", "Paired", "Room ABCDE" | avatars and rows |

## Screens

Tabs Nearby · Activity · Settings (compact, medium) or two panes (expanded), plus sheets: Send menu, Send text, Incoming request, Received, Device details, Link devices. Clipboard history is a screen reached from Activity and Settings.

### Nearby

- **Header:** brand row; title "Nearby" with the subtitle "Devices on this network, paired devices and rooms"; icon buttons Link devices and Refresh (Refresh reconnects to the server and its devices). An Install button appears here while the browser offers installation.
- **Stage:** this device in the centre (accent disc, `signal` glyph); devices on their slots ([Radar rule](#radar-rule-and-slots)).
- **Device card:** device-type tile, name in bold, status line ("Visible to 2 devices", or the server state), pencil to rename (PromptDialog: "Device name", "Devices you share with see this name.").
- **Buttons:** Send (primary: opens the file picker; picked items go to the tray) and Receive (secondary: a toast "Ready to receive. Devices on this network can see you."). Expanded: Send files and Send text, plus the drop area.
- **States:**
  - looking (server connected, no devices): pulses, "Looking for devices", "Open FastShare on another device on this network, or pair one.";
  - server waking or unreachable: rings still, status line "Connecting to the FastShare server. It can take a minute to wake up.", later "Can't reach the FastShare server. Check your connection.";
  - offline: "You're offline. A browser needs the internet to find devices."

### Tapping a device

- **With items in the tray:** send them. The tray stays: "Sent to 1 device. Tap another, or Done", and offers "Send to the other 2" when more devices wait (as in the app).
- **Without:** the Send menu: Files; Photos and videos (phones); Text or link; Clipboard (only where the browser lets a page read it after a tap). Right-click or long-press opens Text directly. "Details" opens Device details: name, device line, rooms, connection code, Unpair for paired devices.

### Drag and drop, paste

- Dragging files over the window shows `DropOverlay`. Dropping on empty space adds to the tray; dropping on a device sends to it.
- Pasting outside a text field: files go to the tray; text goes to the tray, or to the review dialog when "Review text before sending" is on.

### Send text (sheet)

Title "Send to Teal Fox". A multi-line field with focus. Send, or Ctrl/Cmd+Enter. Near the 64 KiB limit a counter appears; over it, "Too long for a message" and a "Send as a text file" button.

### Incoming request (sheet)

```
┌──────────────────────────────────────────┐
│ ▔▔▔                                      │
│ Teal Fox                                 │  title
│ wants to send 3 photos · 12.4 MB         │
│ [ thumbnail ]                            │
│ ▸ Show files (choose which to keep)      │  partial accept
│ Same network · Code 1234 5678 9012 3456  │  tap explains the code
│                                          │
│ [ Decline ]                 [  Accept  ] │  Esc / Enter
│ ☐ Always accept from this device         │  paired devices only
└──────────────────────────────────────────┘
```

### Received (sheet)

"Received 3 photos from Teal Fox". Preview of the first image, audio or video; the file list with sizes; Save (primary; "Save as zip" when there are several and the setting is on) and Share (phones, when the browser allows sharing files); a "Saved" state; Done. A received **text** shows the text with links, Copy (also Ctrl/Cmd+C when nothing is selected), Open link (when the text is one link) and Close.

### Activity

Title "Activity". Chips All, Sent, Received. "In progress" on top with live rows; history grouped by day below. Text rows copy on tap; file rows offer Save while their temporary file exists. Header buttons: Clipboard history, Clear history (confirm). Empty state: "Nothing sent yet". Skeleton rows hold the layout while history loads.

### Clipboard history

Texts sent and received, newest first, each with Copy, Share (where available) and Delete; Clear all (confirm). Empty state: "No texts yet".

### Settings

Grouped like the app:
- **This device:** name; device type (Automatic, Phone, Computer).
- **Appearance:** theme (System, Light, Dark); colour (presets and Custom).
- **Receiving:** Auto download from paired devices; Save automatically; Save several files as one zip; Notifications (with the permission state); Sound.
- **Sending:** Review text before sending.
- **Paired devices:** opens Link devices on Pair.
- **Storage:** space used by temporary files, Clear (confirm); Clipboard history; Keep text in history; Remove all FastShare data from this browser (danger, confirm; WF26).
- **Connection:** status; Advanced → Server address (with Reset); Restart.
- **Install FastShare** (while the browser offers it).
- **About:** version, source code, licences (GPL-3.0 and third party), privacy, terms, developer (Ritik Thakur, GitHub `ritikthakur22`), Copy debug info.

### Link devices (sheet)

A segmented control: **Pair** | **Public room**. There is no "Direct QR": the LAN protocol is app-only.
- **Pair:** "Show my code" gives the 6-digit code in two groups, its QR and "Copy link"; below, "or enter the code from the other device" with a `CodeInput` and Pair. Errors appear inline. Then the paired devices: name, device line, "Auto-accept" switch, Unpair (confirm: "Unpair Teal Fox?", "Both devices forget each other. You can pair again later.").
- **Public room:** "Create a room" gives the room code, its QR, "Copy link" and Leave room (danger); or join with a code.
- While the server isn't connected, one line explains why the actions are disabled.

### Other screens

- **Another tab is active:** brand mark, "FastShare is open in another tab.", button "Use here".
- **Unsupported browser:** brand mark and the message from W-019; nothing else loads.
- **Privacy and terms pages:** the same tokens in a readable column, the brand row and a link back to FastShare.

## Radar rule and slots

- Every avatar on the radar is a real device the server announced. No decorative dots and no sample devices, ever (app rule).
- **Slots:** compact uses the app's six slots on three arcs (the same angles as the app's Nearby screen), nearest arc first. Expanded adds a fourth arc, up to ten slots. Slots are spaced so two avatars never overlap at the smallest stage of each size class.
- More devices than slots, short screens or zoomed text: the compact radar plus the device list.
- **Avatar states:** idle (link label); connecting (dimmed, small spinner, not tappable); can't connect (muted, with details); waiting for an answer (spinning arc); transferring (ring and percent); done (check badge); failed (error badge); this browser's older tab (muted, "This browser").
- The sweep and pulses run only while the server is connected. Otherwise the rings stand still and the status line says why.

## Platform adaptation

| Situation | Behaviour |
|---|---|
| Back button or gesture | closes the open sheet or dialog first (each open sheet adds a history entry); on Activity or Settings, back goes to Nearby |
| Keyboard | tab order follows the visual order; Esc closes sheets (and declines an incoming request); Enter accepts an incoming request; Ctrl/Cmd+Enter sends text; Ctrl/Cmd+C copies a received text when nothing is selected |
| Mouse | hover only as feedback; nothing needs hover; right-click on a device opens Text |
| Touch | long-press on a device opens Text; no double-tap actions |
| Installed app | standalone display, safe-area padding, `theme-color` from `--fs-bg` |
| Safari on iOS | no share target; notifications only for home-screen apps (WS-4); Share where `navigator.share` accepts files |
| Form controls | `color-scheme` makes native controls and scrollbars follow the theme |

## Accessibility checklist

WCAG 2.2 AA, on every screen:
- **Semantics:** landmarks (`header`, `nav`, `main`); one `h1` per view; real buttons, links, inputs and `<dialog>`. The radar drawing is `aria-hidden`; its devices are a list of buttons, nearest arc first.
- **Names:** every control has a visible label or an `aria-label`. An avatar reads like "Teal Fox, phone, same network, paired, button".
- **Keyboard:** everything works with a keyboard; a visible focus ring (2 px accent outline, 2 px offset); focus is trapped only inside modal dialogs and returns to where it came from.
- **Focus not obscured** (2.4.11): the tab bar and the tray never cover the focused element.
- **Dragging** (2.5.7): every drag has a button alternative (Send, Send text).
- **Target size** (2.5.8): 24 px is the floor; the design uses 44 px.
- **Contrast:** enforced by the palette test; `--fs-text-3` only on large text and icons.
- **Resize and reflow** (1.4.4, 1.4.10): zoom is never blocked; works at 200% and at 320 CSS px wide without horizontal scrolling.
- **Status messages** (4.1.3): toasts and the tray are polite live regions; progress is announced at every 25%; errors that need action are assertive.
- **Motion:** the reduced-motion rules above; nothing flashes.
- **Language:** `lang="en"`; no text in images.
- **Accessible authentication** (3.3.8): codes can be pasted; no puzzles.
- **Checked** with axe in CI and by hand with VoiceOver (macOS, iOS), NVDA (Windows) and TalkBack (Android) ([TESTING.md](TESTING.md#7-accessibility-tests)).

## Copy voice

The app's [copy voice](../../fastshare-n/docs/DESIGN_SYSTEM.md#copy-voice) applies: say what is happening, never blame the user, no exclamation marks. Every string is written fresh (W-001) and lives in `src/strings.ts` (W-016). "Teal Fox" in these docs stands for a server-assigned default name.

| Do | Don't |
|---|---|
| "Waiting for Teal Fox to accept" | "Pending…" |
| "Couldn't connect directly to Teal Fox. Try the same Wi-Fi, or pair the devices." | "ICE failed" |
| "Connecting to the FastShare server. It can take a minute to wake up." | "WebSocket closed" |
| "This browser can't store that much at once. Send fewer or smaller files." | "Quota exceeded" |
| "Saved 3 photos" | "Success!" |
| "That code didn't work. Check it and try again." | "Invalid key" |
