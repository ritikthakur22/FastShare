# Code Style (website)

Conventions for everyone writing code here. The folder layout and layer rules are in [ARCHITECTURE.md](ARCHITECTURE.md#layer-rules) and are not repeated. The app's [CODE_STYLE.md](../../fastshare-n/docs/CODE_STYLE.md) is the model; this file holds what differs on the web.

## General

- **Write the smallest complete change.** Reuse a `src/ui` component, a `src/core` store or a `src/protocol` validator before adding anything.
- **No speculative code:** no options, abstractions or "for later" hooks nobody asked for.
- **No new dependency** without a reason in the PR ([SECURITY.md](SECURITY.md#dependency-policy)).
- **Comments explain why**, in one line. Known shortcuts get `// shortcut: <the limit>, <when to upgrade>`.
- **Clean room (W-001):** never paste code, CSS, strings, translations, sounds or images from the old site, PairDrop or Snapdrop. Files copied from the app start with a provenance line (W-007).

## TypeScript

- `strict: true`, `noUncheckedIndexedAccess: true`. `any` only at a validated boundary, with a comment.
- **Untrusted data** (network messages, link parameters, share-target items, stored records, legacy data) passes a validator in `src/protocol` before use. Never cast it with `as`.
- String literal unions instead of enums. `type` for data, `interface` for contracts.
- Errors carry a code from [ARCHITECTURE.md → Error handling](ARCHITECTURE.md#error-handling). UI copy maps from the code, never from `error.message`. Never swallow an error silently.
- `async`/`await`; no floating promises; cancel with `AbortController`.
- Path aliases `@/protocol`, `@/core`, `@/ui`, `@/screens`. No deep relative chains.
- Prettier defaults (2 spaces, single quotes, trailing commas, width 100).

## Preact and the DOM

- Function components and hooks only. No `preact/compat`.
- Screens stay thin: they read stores through the one store hook (W-003) and compose `src/ui` components.
- **Never build HTML from strings:** no `dangerouslySetInnerHTML`, `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, `eval` or `new Function`. A lint rule bans them ([SECURITY.md](SECURITY.md#input-validation)).
- Use real elements: `<button>`, `<a>`, `<input>`, `<dialog>`. Every control has a visible label or an `aria-label` ([DESIGN_SYSTEM.md](DESIGN_SYSTEM.md#accessibility-checklist)).
- Every UI string comes from `src/strings.ts` (W-016). No string literals for visible text in components.
- Progress updates reach the DOM at most 10 times a second; animate with CSS, never with state changes per frame.

## CSS

- One file per component next to it, plus `src/ui/tokens.css`. Class names are prefixed with the component name.
- **Tokens only:** colours, spacing, radii and durations come from the custom properties in [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md#colour). Colour literals are allowed only in `tokens.css` and `palette.ts`; the lint script fails on any other.
- No inline `style` attributes in markup. Dynamic values go through `style.setProperty` (W-018).
- Animate only `transform` and `opacity`. Respect `prefers-reduced-motion`.
- Sizes in `rem` for type, `px` for hairlines and radii. Never block zoom.

## Service worker and workers

- Keep them small and free of UI imports. They may import `src/protocol` only.
- The worker file name and scope are fixed by W-010. Don't rename `/service-worker.js` or `/manifest.json`.

## Logging

- `log.debug|info|warn|error(tag, code, data?)` from `src/core/log.ts`, into a capped in-memory buffer used by "Copy debug info". No `console.log` in committed code.
- **Never log:** room secrets, pairing keys, room codes, file names, text bodies, IP addresses, or full peer ids (first 8 characters at most).

## Git

- `main` is always deployable. Work happens on `feat/<topic>`, `fix/<topic>`, `docs/<topic>`.
- Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`), one logical change each. No tool or assistant attribution lines in commits or PRs.
- PRs say what changed and why, which decisions (W-…) they touch, how it was tested (which rows of which matrix, on which browsers), and carry screenshots in both themes for UI changes.
- Changing a decision updates [DECISIONS.md](DECISIONS.md) in the same PR.
- Never commit `dist/`, `.env.local`, or anything fetched from the old repo.

## Definition of done

1. Typecheck, lint, unit and end-to-end tests pass locally and in CI; the size budget holds.
2. New non-trivial logic has a test ([TESTING.md](TESTING.md) says which kind).
3. Changes touching the network, storage, the service worker or migration have run their matrix rows in real browsers, listed in the PR.
4. The doc that owns the changed behaviour is updated, and only that doc (index in [AGENTS.md](../AGENTS.md)).
