# Prompt: viewpoint derivation Phase 2, a deterministic viewpoint from a metamodel (no Jjodie)

Prompt-ID: P-2026-09-29-0135
Chat: C-2026-09-28-1936
Lane: full (Phase 2, one new module, its test, one utility, one menu item; tests first). Tier: heavy.
Status: eseguito 2026-09-29 · lane viewpoint-derivation-p2 · 1eb916bba, 9511f745c, fead37b48 · non fuso: hard-stop, lane probe 32/32 on 3042 (light), crop in docs/discovery/harness/_tmp_viewgen_*.png (gitignored), verifica visiva alla chat

Worktree: `~/jjodel-w-viewgen2`, branch `viewpoint-derivation-p2` (cut by the chat from `alfonso-frontend-jjtl` at `174f6c58a`, `frontend/node_modules` symlinked as P14 allows), a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-viewgen2`, branch `viewpoint-derivation-p2`, `git log -1` is the docs commit that added this prompt; if any differs, stop with `Outcome: blocked` and say which.

## COSA

Implement the deterministic derivation planned by `docs/discovery/discovery_2026-09-29_viewpoint_derivation.md` (P-2026-09-29-0111, branch `viewpoint-derivation`; read it with `git show viewpoint-derivation:docs/discovery/discovery_2026-09-29_viewpoint_derivation.md`). A command creates a new viewpoint from a metamodel: one IR view document per concrete metaclass (vertices, and edges for the classes the structure or the simulation roles recognise as connections), filled deterministically from the structure and, when present, from the role binding. Jjodie is out of scope (Phase 3). Alfonso delegated the choices to the chat; the chat adopted:

1. No `priority` from depth: views are created deepest class first, and the resolver's own ranking does the rest (the discovery's recommendation).
2. Entry point: a «Derive viewpoint» item in the metamodel's context menu in the tree (`TreeViewContent.tsx`); the new viewpoint is not activated on creation, only its tab opens, as New Viewpoint does. The default viewpoint and every existing view are never touched.
3. No provenance key in this phase: the key would be permanent in saved IR, so its name and shape stay Alfonso's decision (the discovery's decision 1). The derivation runs once per command; regeneration is not part of this phase.
4. Fill of solid symbols (initial state, fork/join bar, Petri transition): the catalogue hex `#334155`, which keeps the Symbol Editor's catalogue match; the dark theme is dropped for now. Every other colour is a CSS token.
5. No change to `irTypes.ts` or any critical-zone file; the only optional change outside the four files is the export from `view.tsx` the discovery names, additive.

## DOVE

- `frontend/src/.../viewpoint/derive/viewpointDerivation.ts` (new) and its test (new): the pure derivation, metamodel (+ optional role bag) to a list of IR documents.
- `frontend/src/.../utils/deriveViewpoint.ts` (new): creates the viewpoint with `newVP` and one `new2` per view, the pattern of `irDemoFixture.ts`.
- `TreeViewContent.tsx`: the menu item.
- Optional: the additive export from `view.tsx`.
- Closure: `docs/log-inbox/views.md` and this prompt's Status.

Use the exact paths the discovery gives.

## COME

1. Read `CLAUDE.md` (§6, Rule 11, §21.2, critical zone, naming), `docs/PROTOCOL.md` P16, RC-20..RC-22, RC-33, R-MCID-1, R-MCID-2, the Symbol Editor rows, and the discovery end to end. Grep every new identifier before introducing it.
2. Tests first (red before, green after): the derivation on the four demo metamodels (`/Users/alfonso/jjodel-demo-exports/*.json`, read only) and on one ERD export with a hand-written view: every document passes the IR validator; the edge classes are edges with source and target; pins are set from the metaclass pointers; the solid symbols get `#334155`; the order is deepest class first; nothing touches an existing viewpoint.
3. Implement. Measure that the whole creation undoes in one step (the discovery inferred it); if it does not, make it one step or stop with `Outcome: question` and a `Recommended:` line.
4. Gates: `npm run typecheck` (14, the known set), the vitest of the touched folders green, the full vitest with 0 failed besides the 9 files red at import, `npm run build`, `check:docs`, `check:addonly`.
5. A lane probe on port 3042 (`lane-run probe`, never 3001), light theme: derive a viewpoint for DemoFlowB and DemoPetri, open its tab, crop the canvas of each at `sips -Z 600` under `docs/discovery/harness/_tmp_viewgen_*.png` (gitignored); then undo once and show the viewpoint is gone.
6. Commits: one per file group, then one docs commit with the log entry and this prompt's Status. Do not merge. Stop with `Outcome: hard-stop`, the shas, the diff stat, the counts, the undo measurement and the crop paths.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes in any other tree (the demo exports included), a critical-zone file, `irTypes.ts`, a call to an AI model, dark-theme work.

## RIFERIMENTI

- The discovery of P-2026-09-29-0111 (§0 and the Phase 2 plan); `irDemoFixture.ts`; R-MCID-1, R-MCID-2.
