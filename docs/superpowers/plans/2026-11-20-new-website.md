# FastShare New Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the new FastShare website client in `/home/crdy/extra/fastsharewebn` on git branch `feature/new-website`, matching the new native app ("Quiet Signal") design system, the desktop/tablet UI showcase (`FastShare App UI Showcase.png`), and preserving 100% wire-compatibility with the deployed signaling server and peer clients.

**Architecture:** A lightweight, reactive web application built with Vite, Preact, TypeScript, and CSS Custom Properties. The codebase is organized into strict layers: `src/protocol` (pure TypeScript protocol validators and serializers), `src/core` (framework-free reactive stores and WebRTC/WebSocket managers), `src/ui` (accessible components, design tokens, and SVG icons), and `src/screens` (responsive 3-pane desktop layout and floating tab mobile layout).

**Tech Stack:** Vite, Preact, TypeScript (strict), Vitest, Playwright, CSS Custom Properties, `uqr` (SVG QR generation), `client-zip` (streaming zip sink).

**Spec:** [docs/PRD.md](../../PRD.md), [docs/DESIGN_SYSTEM.md](../../DESIGN_SYSTEM.md), [docs/ARCHITECTURE.md](../../ARCHITECTURE.md), [docs/PROTOCOL.md](../../PROTOCOL.md), and [FastShare App UI Showcase.png](../../FastShare%20App%20UI%20Showcase.png).

## Global Constraints

- Wire compatibility: Exact JSON structures and data-channel framing matching [PROTOCOL.md](../../PROTOCOL.md) and the deployed signaling server (`wss://fastshare-ja1a.onrender.com/server`).
- Clean room: Zero code, CSS, or strings copied from PairDrop or the old frontend; all code and copy are written fresh or ported from the native app `fastshare-n` (GPL-3.0-or-later).
- Strict layer rules: `src/protocol` must have zero DOM/network imports; `src/core` must not import Preact or UI components; `src/ui` must not import core networking.
- Design fidelity: Match `FastShare App UI Showcase.png` with 3-pane desktop layout (sidebar, radar canvas, drop-zone/recent activity) and floating pill tab bar on mobile/tablet. Both Light mode and Dark mode (deep navy `#0B0F19` with cyan/teal neon accents) must meet WCAG 2.2 AA contrast standards.
- Browser support: Evergreen Chromium, Firefox, Safari (16.4+).

## Review Focus

- Signaling disconnects during active transfers must NOT drop WebRTC data channels or ongoing transfers (W-021).
- Unsanitized device names or messages must never be rendered as raw HTML (XSS prevention).
- Large file transfers must stream chunks without holding multi-gigabyte blobs in memory (OPFS or streaming chunks).
- First paint must not flash the wrong theme (render-blocking `/theme.js`).
- URL compatibility: `/?pair_key=NNNNNN` and `/?room_id=xxxxx` must properly trigger pairing/room join after signaling connection opens.

---

### Task 1: Repository Setup, Git Branch, and Project Scaffolding

**Files:**
- Create: `.gitignore`
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `vercel.json`
- Create: `LICENSE`
- Create: `src/main.tsx`

**Interfaces:**
- Produces: Project build system, TypeScript config, dev server on port 5173, and test runner.

- [ ] **Step 1: Initialize Git and branch `feature/new-website`**

Initialize git repository in `/home/crdy/extra/fastsharewebn` (if not already initialized), configure branch `feature/new-website`, and set remote to `https://github.com/ritikthakur22/FastShare.git`.

- [ ] **Step 2: Create `.gitignore`**

Ignore `node_modules`, `dist`, `.env.local`, `old-website-source`, coverage, and temporary test artifacts.

- [ ] **Step 3: Create `package.json` with dependencies and scripts**

Dependencies:
`preact`: `^10.25.4`
`uqr`: `^0.1.2`
`client-zip`: `^2.4.5`
DevDependencies:
`vite`, `typescript`, `@types/node`, `vitest`, `@testing-library/preact`, `jsdom`.
Scripts: `dev`, `build`, `preview`, `typecheck`, `test`.

- [ ] **Step 4: Create `tsconfig.json` and `vite.config.ts`**

Configure strict TypeScript with JSX factory `h` and fragment `Fragment` from `preact`, alias `@` to `src`, and Vitest config.

- [ ] **Step 5: Create `index.html` with CSP, viewport, and theme boot script**

Set viewport `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`, title `FastShare - Simple, Fast, Secure File Sharing`, and root mount element `#app`.

- [ ] **Step 6: Install dependencies and verify build**

Run: `npm install && npm run typecheck && npm run build`
Expected: Build succeeds with output in `dist/`.

- [ ] **Step 7: Commit Task 1**

```bash
git add .
git commit -m "chore: scaffold vite preact typescript foundation on feature/new-website"
```

---

### Task 2: Design Tokens, CSS Custom Properties, and Theme System

**Files:**
- Create: `src/ui/tokens.css`
- Create: `src/ui/palette.ts`
- Create: `public/theme.js`
- Test: `src/ui/palette.test.ts`

**Interfaces:**
- Produces: `buildPalette(accent: string, mode: 'light' | 'dark')`, CSS variables `--fs-bg`, `--fs-surface`, `--fs-accent`, etc., and `/theme.js` for zero-flash first paint.

- [ ] **Step 1: Write failing contrast and palette tests**

Test `palette.test.ts` verifying contrast ratios for all presets (`signal`, `cobalt`, `violet`, `ember`, `rose`, `graphite`) and custom hex values against WCAG 4.5:1.

- [ ] **Step 2: Implement `src/ui/palette.ts`**

Port color functions (`luminance`, `contrast`, `rgb`, `hex`, `hsl`, `buildPalette`) from native app `fastshare-n/src/ui/tokens.ts` without React Native dependencies.

- [ ] **Step 3: Implement `src/ui/tokens.css`**

Define CSS custom properties matching the design system and showcase:
- Light mode tokens (clean soft whites, subtle borders)
- Dark mode tokens (deep navy background `#0B0F19`, dark slate surfaces `#131927`, elevated surfaces `#1A2234`, neon teal/cyan accents `#00D2B4` / `#45D19E`)
- Typography scale, spacing tokens, and motion curves.

- [ ] **Step 4: Implement `public/theme.js`**

A tiny synchronous script in `public/theme.js` that reads `fs.theme` and `fs.accent` from `localStorage` and applies the tokens to `document.documentElement` before rendering.

- [ ] **Step 5: Run tests and verify theme passes**

Run: `npm test src/ui/palette.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit Task 2**

```bash
git add src/ui/ public/theme.js
git commit -m "feat(ui): design tokens, palette calculation, and theme system"
```

---

### Task 3: Protocol Module & Shared Codecs (Pure TypeScript)

**Files:**
- Create: `src/protocol/server.ts`
- Create: `src/protocol/channel.ts`
- Create: `src/protocol/webText.ts`
- Create: `src/protocol/fileName.ts`
- Create: `src/protocol/format.ts`
- Create: `src/protocol/connectionCode.ts`
- Create: `src/protocol/links.ts`
- Test: `src/protocol/protocol.test.ts`

**Interfaces:**
- Produces: Type-safe validators `parseServerMessage`, `parseChannelMessage`, `serializeServerMessage`, `serializeChannelMessage`, `parseEntryLink`, `generateConnectionCode`, `sanitizeFileName`, `formatBytes`.

- [ ] **Step 1: Write tests for protocol validation and link parsing**

Test parsing of `peer-joined`, `peer-left`, `signal`, `header`, `progress`, `partition`, `partition-received`, `text`, `display-name-changed`, and link parsing (`?pair_key=123456`, `?room_id=testroom`).

- [ ] **Step 2: Implement `src/protocol/server.ts`**

Implement signaling message types and strict validators. Ensure tolerance for optional server fields.

- [ ] **Step 3: Implement `src/protocol/channel.ts`**

Implement WebRTC data-channel message types, serializers, and validators.

- [ ] **Step 4: Implement utilities (`webText.ts`, `fileName.ts`, `format.ts`, `connectionCode.ts`, `links.ts`)**

Port safe UTF-8 text chunking, file name sanitization (stripping traversal characters and control chars), byte size formatting, and Cyrb53-based connection code generation.

- [ ] **Step 5: Run tests to verify protocol correctness**

Run: `npm test src/protocol/protocol.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit Task 3**

```bash
git add src/protocol/
git commit -m "feat(protocol): pure wire protocol types, parsers, and codecs"
```

---

### Task 4: Framework-Free Reactive Stores & Core Logic

**Files:**
- Create: `src/core/store.ts`
- Create: `src/core/settings.ts`
- Create: `src/core/peers.ts`
- Create: `src/core/signaling.ts`
- Create: `src/core/rtc.ts`
- Create: `src/core/transfers.ts`
- Create: `src/core/useStore.ts`
- Test: `src/core/store.test.ts`

**Interfaces:**
- Produces: Observable stores (`settingsStore`, `peersStore`, `signalingStore`, `transfersStore`) and `useStore` hook for Preact components.

- [ ] **Step 1: Write store and core logic tests**

Test store subscriptions, settings persistence, peer updates, and transfer queue additions.

- [ ] **Step 2: Implement `src/core/store.ts` and `src/core/useStore.ts`**

A minimal, zero-dependency observable store pattern (`createStore<T>`, `get`, `set`, `subscribe`) and a custom hook `useStore(store)`.

- [ ] **Step 3: Implement `src/core/settings.ts`**

Manages theme (`system` | `light` | `dark`), accent color, device name (default from platform/random), device type (`auto` | `phone` | `desktop`), auto-download, and server address with `localStorage` syncing.

- [ ] **Step 4: Implement `src/core/peers.ts`**

Stores list of discovered peers, their connection state (`connecting`, `connected`, `failed`), device details, and room affiliations.

- [ ] **Step 5: Implement `src/core/signaling.ts`**

WebSocket client connecting to `VITE_SIGNALING_URL`. Handles `join`, `pong` keepalive, queueing of link actions until connected, reconnect backoff, and ensures reconnects reuse peer ID (W-021).

- [ ] **Step 6: Implement `src/core/rtc.ts` and `src/core/transfers.ts`**

Manages WebRTC `RTCPeerConnection`s and data channels with the polite-peer pattern. Manages file and text transfer lifecycle.

- [ ] **Step 7: Run tests to verify core logic**

Run: `npm test src/core/store.test.ts`
Expected: PASS.

- [ ] **Step 8: Commit Task 4**

```bash
git add src/core/
git commit -m "feat(core): reactive stores, signaling, and webrtc lifecycle"
```

---

### Task 5: UI Components and Icon System

**Files:**
- Create: `src/ui/Icon.tsx`
- Create: `src/ui/BrandMark.tsx`
- Create: `src/ui/Button.tsx`
- Create: `src/ui/IconButton.tsx`
- Create: `src/ui/Chip.tsx`
- Create: `src/ui/Switch.tsx`
- Create: `src/ui/Segmented.tsx`
- Create: `src/ui/TextField.tsx`
- Create: `src/ui/Sheet.tsx`
- Create: `src/ui/QrCode.tsx`
- Test: `src/ui/components.test.tsx`

**Interfaces:**
- Produces: Reusable UI primitives conforming to the Design System and UI Showcase.

- [ ] **Step 1: Implement `src/ui/Icon.tsx`**

Material Symbols Rounded inline SVG sprite component supporting all icons required: `radar`, `history`, `settings`, `send`, `download`, `refresh`, `link`, `edit`, `check`, `close`, `delete`, `info`, `smartphone`, `laptop`, `wifi`, `public`, `shield`, etc.

- [ ] **Step 2: Implement `src/ui/BrandMark.tsx`**

Vector SVG brand mark "F" with the brand gradient.

- [ ] **Step 3: Implement Buttons, Chips, Switch, Segmented, TextField**

Accessible components styled strictly via CSS custom properties with focus indicators, active press states, and keyboard accessibility.

- [ ] **Step 4: Implement `src/ui/Sheet.tsx`**

Modal dialog and slide-out sheet component built on HTML5 `<dialog>` with backdrop scrim, keyboard `Escape` closing, and focus trap.

- [ ] **Step 5: Implement `src/ui/QrCode.tsx`**

Inline SVG QR code generator utilizing `uqr` with 4-module quiet zone, black-on-white high contrast.

- [ ] **Step 6: Verify components with tests**

Run: `npm test src/ui/components.test.tsx`
Expected: PASS.

- [ ] **Step 7: Commit Task 5**

```bash
git add src/ui/
git commit -m "feat(ui): design system components, svg icons, and modal sheets"
```

---

### Task 6: Application Shell & Desktop/Tablet/Mobile Layouts

**Files:**
- Create: `src/ui/Sidebar.tsx`
- Create: `src/ui/TopBar.tsx`
- Create: `src/ui/FloatingTabBar.tsx`
- Create: `src/screens/NearbyScreen.tsx`
- Create: `src/screens/Radar.tsx`
- Create: `src/screens/PeerNode.tsx`
- Create: `src/screens/DropZone.tsx`
- Create: `src/screens/RecentActivityPanel.tsx`
- Create: `src/App.tsx`
- Create: `src/App.css`

**Interfaces:**
- Produces: Complete responsive UI matching `FastShare App UI Showcase.png`.

- [ ] **Step 1: Implement `src/ui/Sidebar.tsx`**

Desktop left navigation sidebar:
- Top: FastShare logo with BrandMark + title
- Nav items: `Nearby` (with active indicator), `Transfers / Activity`, `Settings`
- Bottom: Promotional decorative card with laptop/phone graphic and "Share faster, across all your devices."

- [ ] **Step 2: Implement `src/ui/TopBar.tsx`**

Header bar:
- Status indicator: Green live dot + "Online | Device: [Name] [Edit icon]"
- Action buttons: Refresh `↻`, Connection/Link `⛓`, Profile/Avatar circle with dropdown.

- [ ] **Step 3: Implement `src/screens/Radar.tsx` and `src/screens/PeerNode.tsx`**

Concentric pulse rings around central beacon `((•))`. Dynamic placement of discovered peers with device icons, status, and interactive popover card showing device details and a primary `Send` action button.

- [ ] **Step 4: Implement `src/screens/DropZone.tsx` and `src/screens/RecentActivityPanel.tsx`**

Right-hand panel:
- "Send files" drag-and-drop target zone
- "Send files" primary button and "Send message" secondary button
- "Recent Activity" list with thumbnail/icon, filename, transfer direction, size, time ago, and status badge with "View all →" link.

- [ ] **Step 5: Implement `src/ui/FloatingTabBar.tsx` and mobile responsiveness**

Responsive CSS switching between desktop 3-pane view and mobile floating bottom tab bar (`Nearby`, `Activity`, `Settings`) when viewport width is below 1024px.

- [ ] **Step 6: Assemble `src/App.tsx` and verify layout**

Wire up state and verify screen renders properly in light and dark mode.

- [ ] **Step 7: Commit Task 6**

```bash
git add src/
git commit -m "feat(screens): 3-pane desktop layout, radar canvas, drop zone, and responsive shell"
```

---

### Task 7: Activity Screen, Settings Modals, and End-to-End Local Verification

**Files:**
- Create: `src/screens/ActivityScreen.tsx`
- Create: `src/screens/SettingsModal.tsx`
- Create: `src/screens/ReceivingModal.tsx`
- Create: `src/screens/StorageModal.tsx`
- Create: `src/screens/AboutModal.tsx`
- Create: `src/screens/SendMessageModal.tsx`
- Create: `src/screens/LinkDevicesModal.tsx`

**Interfaces:**
- Produces: Complete interactive modals and sub-screens matching the UI showcase.

- [ ] **Step 1: Implement `src/screens/ActivityScreen.tsx`**

Full transfer history screen with:
- Filter chips: `All`, `Sent`, `Received`
- Time period dropdown ("Last 30 days")
- Transfer rows with icons, filenames, metadata, and status indicators.

- [ ] **Step 2: Implement `src/screens/SettingsModal.tsx`**

Settings view matching showcase:
- Appearance: System, Light, Dark
- Color swatches + Custom hex picker (`#6C3AED`)
- Connection toggle ("Use the internet when it is available...")
- Device name edit, Device type dropdown, Visibility dropdown
- Navigation to Link devices, Receiving, Storage, and About.

- [ ] **Step 3: Implement `ReceivingModal.tsx`, `StorageModal.tsx`, and `AboutModal.tsx`**

- Receiving settings: Save to gallery, Auto download, Save several as zip, Notifications, Sound.
- Storage settings: Download folder display, Temporary cache clear button.
- About: FastShare version, description, links to Privacy Policy, Terms of Use, Website.

- [ ] **Step 4: Implement `SendMessageModal.tsx` and `LinkDevicesModal.tsx`**

Send text/message modal with 64 KiB character counter. Link devices modal with 6-digit pair key display and QR code.

- [ ] **Step 5: Run full verification suite**

Run: `npm run typecheck && npm test && npm run build`
Verify all unit tests pass, TypeScript compiles strictly without errors, and production bundle builds cleanly.

- [ ] **Step 6: Start local server and test in browser**

Run: `npm run preview` (or `npm run dev`) and verify:
- Desktop 3-pane layout displays cleanly matching the showcase.
- Dark mode navy theme switches cleanly.
- Modals open and close smoothly with Escape key and backdrop clicks.
- Radar pulses animate correctly.

- [ ] **Step 7: Commit Task 7**

```bash
git add src/
git commit -m "feat(screens): activity screen, settings sheets, dialogs, and local verification"
```
