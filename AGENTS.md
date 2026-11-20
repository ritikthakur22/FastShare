# AGENTS.md

**Start here.** This is the entry point for everyone working on the FastShare website. Read this file fully, then the documents your task needs (table below), before changing anything.

## What this is

The new FastShare website: the zero-install browser client of FastShare, at `https://fastshare.ritikthakur.com.np`. It sends files, text and links between devices with no account and no cloud storage; bytes go device to device over WebRTC.

- It is a **clean rewrite** that replaces the legacy client at the same domain.
- It **looks like the native app** and takes its design from it.
- It stays **wire-compatible** with the existing signaling server and with every other client: the new app, the old app 1.1.x and the old site.

Related code, all read-only from here:

| What | Where | Role |
|---|---|---|
| Native app 2.0 | `~/extra/fastshare-n` (GitHub `ritikthakur22/fastshare_native_app`) | design and product reference; its docs own the wire protocol |
| Old website and signaling server | `~/testing/websites-project/fastshare` (GitHub `ritikthakur22/FastShare`) | what is being replaced; the server keeps running from there. Holds the owner's uncommitted changes: never modify it |
| Old app 1.1.x | `~/testing/app/fastshare` | an interop peer; bundles its own copy of the old frontend |

Links to "app" docs in this repo are relative paths to `~/extra/fastshare-n/docs/`.

## Project status (update this line when it changes)

**2026-11-15: planning only.** These documents exist; there is no code and no repository yet.
- **Done:** audit of the old site, decisions W-001 to W-021 (all Proposed), protocol differences, migration and handover plan, backlog.
- **Next:** the owner answers the open questions ([PRD.md](docs/PRD.md#open-questions-for-the-owner)); then Phase W0 spikes ([TASKS.md](docs/TASKS.md)).
- Details that depend on a spike (WS-1 to WS-5 in [ROADMAP.md](docs/ROADMAP.md#spikes)) must not be built on until the spike's result is written into its decision.

## Document index

| Doc | Owns (single source of truth for) | Read before you… |
|---|---|---|
| [docs/DECISIONS.md](docs/DECISIONS.md) | every website decision, its status and rationale (`W-001`…) | change anything structural |
| [docs/PRD.md](docs/PRD.md) | users, goals, features (`WF1`…), priorities, user flows, open questions for the owner | build or change a feature |
| [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) | web tokens, type scale, layouts per screen size, components, screens, accessibility checklist, copy examples | touch UI |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | stack, folder layout, layer rules, modules, flows, the data path in the browser, local data, hosting, performance budget | add a file, a module or a flow |
| [docs/PROTOCOL.md](docs/PROTOCOL.md) | entry-point links, what the site sends and accepts, differences between the deployed old site and the app's spec | touch anything that sends or parses network data or links |
| [docs/SECURITY.md](docs/SECURITY.md) | threat model, response headers and CSP, input validation, privacy, dependency policy | touch networking, storage, rendering of received data, headers or dependencies |
| [docs/MIGRATION.md](docs/MIGRATION.md) | audit of the old site, feature parity, legacy data formats, data import, service-worker handover, cut-over and rollback, follow-ups in other repos | touch storage, the service worker, the manifest or the release |
| [docs/TESTING.md](docs/TESTING.md) | test layers, integration cases, interop and browser matrices, migration tests | finish any change |
| [docs/ROADMAP.md](docs/ROADMAP.md) | phases, spikes (`WS-1`…), exit criteria, dependencies | plan a phase |
| [docs/TASKS.md](docs/TASKS.md) | the ordered backlog (`WT…`), task status, what "done" means per task | pick the next task |
| [docs/SETUP.md](docs/SETUP.md) | toolchain, commands, configuration, local signaling server, Vercel, CI, release checklist | build, test or deploy |
| [docs/CODE_STYLE.md](docs/CODE_STYLE.md) | coding conventions, git, definition of done | write any code |

**Rule:** each fact lives in exactly one doc. Other docs link to it instead of repeating it. If you change behaviour, update the doc that owns it (column 2) in the same change.

**Not owned here:** the wire protocol and the design direction. They live in the app repo: [API.md](../fastshare-n/docs/API.md#signaling-server-api), [TRANSFER_PROTOCOL.md](../fastshare-n/docs/TRANSFER_PROTOCOL.md#online-protocol), [DESIGN_SYSTEM.md](../fastshare-n/docs/DESIGN_SYSTEM.md), [DECISIONS.md](../fastshare-n/docs/DECISIONS.md) (cited here as "app D-0xx").

## Picking up work

1. Read the status line above, then [docs/TASKS.md](docs/TASKS.md). Take the first `todo` task whose dependencies are done and whose owner questions are answered.
2. Read the docs in that task's **Read** column.
3. Build it the way the layers say: wire parsing only in `src/protocol`, logic only in `src/core`, UI only from `src/ui` components and tokens.
4. Check: `npm run typecheck && npm run lint && npm test && npm run test:e2e && npm run size`. For anything touching the network, storage, the service worker or migration, run the matching rows in [docs/TESTING.md](docs/TESTING.md) in real browsers.
5. Update the task status, the owning doc of any behaviour you changed, and the status line here. Commit with a Conventional Commit message and no attribution lines.

**What developers cannot do alone:** approve the look (owner sign-off, app D-018), answer the open questions in the PRD, deploy to the production domain or change the Vercel project, change or deploy the signaling server (app D-010), edit the app repo or the old website repo, test on an iPhone.

## Reading order by task

| Task | Read |
|---|---|
| First time here | this file → DECISIONS → PRD → ARCHITECTURE → ROADMAP → TASKS |
| UI work | DESIGN_SYSTEM → app DESIGN_SYSTEM → PRD (flows) → CODE_STYLE |
| Signaling, WebRTC, transfers | PROTOCOL → app API and TRANSFER_PROTOCOL → SECURITY → TESTING |
| Storage, import of old data | MIGRATION → ARCHITECTURE (local data) → SECURITY |
| Service worker, manifest, release | MIGRATION (handover, cut-over) → SETUP → SECURITY (headers) |

## Non-negotiable rules

1. **Wire compatibility** (W-006). Speak the deployed signaling API and data-channel protocol exactly: strict on send, tolerant on receive. Add nothing to the wire.
2. **URL compatibility.** `/?pair_key=NNNNNN` and `/?room_id=xxxxx` keep working, always: the app's QR codes encode them ([PROTOCOL.md](docs/PROTOCOL.md#entry-points-and-links)).
3. **Clean room** (W-001). No code, CSS, strings, translations, sounds or images from the legacy site. Don't quote legacy code in docs either. Never modify the old repo.
4. **Feature parity** with the old site ([MIGRATION.md](docs/MIGRATION.md#feature-parity-with-the-old-site)). Nothing is dropped or changed in meaning without the owner agreeing.
5. **Transfers survive the network** (W-021). Never reset the signaling connection or a WebRTC link because of network-quality signals; reconnect only after a real disconnect; open links survive a signaling reconnect.
6. **Files never touch a server; no analytics, trackers or third-party requests** (W-017).
7. **Validate every input:** network messages, link parameters, shared items, stored and legacy records ([SECURITY.md](docs/SECURITY.md#input-validation)). Never build HTML from received data.
8. **Never upgrade, restructure or create the old `fastshare_store` database** (W-012). Old data is copied once, read-only.
9. **`/service-worker.js` and `/manifest.json` stay at those URLs** (W-010).
10. **No sample data.** The radar shows only devices the server announced; Activity shows only real history.
11. **No new dependencies** without a reason in the PR ([CODE_STYLE.md](docs/CODE_STYLE.md)).
12. **Done means browser-tested** for anything touching the network, storage, the service worker or migration ([TESTING.md](docs/TESTING.md#10-what-ci-proves-and-what-it-doesnt)).

## Things that will confuse you

- **The site can't use the LAN protocol.** Browsers can't open sockets or trust self-signed peers. "Nearby" on the web means: devices behind the same public IP (through the server), paired devices, and devices in a public room. The app's Direct QR (`fastshare://c?...`) means nothing to a browser.
- **Two names per device.** The server assigns a random name and derives a device line from the User-Agent. The user's own name arrives later, over the data channel (`display-name-changed`).
- **Who calls whom** is decided by the server's messages: a device listed in `peers` is called by you; one announced by `peer-joined` calls you.
- **The deployed old site differs from the app's spec** in a few places (overall `progress`, an object in `partition-received`, empty files). The table is in [PROTOCOL.md](docs/PROTOCOL.md#differences-from-the-app-spec).
- **The old site lives on in three places** after cut-over: in old tabs not yet reloaded, at the Render origin (`https://fastshare-ja1a.onrender.com/`), and inside the old app, which bundles its own copy.
- **Tabs share storage.** That is why only one tab is active (W-013) and why old tabs are marked.
- **The signaling server sleeps** (Render free tier). The first connection can take about a minute; link actions wait for it.
- **Signaling and transfers are separate lifetimes.** A dropped server connection must not touch a running transfer (W-021).
- **Previews are different origins.** Each has its own storage and service worker, and the app's scanner rejects their links.

## Commands

Valid once the repo is scaffolded (WT1.1); details in [docs/SETUP.md](docs/SETUP.md).

```bash
npm ci
npm run dev
npm run typecheck && npm run lint && npm test && npm run test:e2e && npm run size
npm run build && npm run preview
```

## Commit style

Conventional Commits (`feat:`, `fix:`, `docs:` …), one logical change per commit. Reference decision and feature IDs in PR descriptions. No attribution lines.
