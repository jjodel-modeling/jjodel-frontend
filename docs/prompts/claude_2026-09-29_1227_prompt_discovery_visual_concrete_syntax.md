# Prompt: discovery, how far the concrete syntax can improve visually (default notation and derived viewpoints)

Prompt-ID: P-2026-09-29-1227
Chat: C-2026-09-28-1936
Lane: discovery (read-only; the view IR, the renderer, the default notation, the derived viewpoints). Tier: heavy.
Status: da eseguire

Worktree: `~/jjodel-w-visual`, branch `visual-syntax-disc` (cut by the chat from `alfonso-frontend-jjtl` at `12ac29f74`, `frontend/node_modules` symlinked as P14 allows), a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-visual`, branch `visual-syntax-disc`, `git log -1` is the docs commit that added this prompt; if any differs, stop with `Outcome: blocked` and say which.

## COSA

Alfonso, 2026-09-29: «adesso voglio capire quanto possiamo migliorare la sintassi concreta da un punto di vista visuale». Today the derived Petri view reaches a textbook-like look (R-VP-15, R-VP-16); the other kinds (state machine, flowchart/activity, ESM) and the default notation (M2 class boxes, M1 object boxes) have not been looked at with the same eye.

Goal: a measured picture of where the visual quality stands and how far it can go, with a ranked list of improvements, each with its cost and whether it is additive (IR data only), a renderer change, or an IR change (critical zone or `irTypes.ts`). No code.

## DOVE (read-only)

- The view IR (`viewpoint/ir/`: types, compile, style, shape and marker registries), the renderer of nodes and edges (grep `UnifiedEdge`, `IRNodeContent`), the default notation for M2 and M1 (the views used when no viewpoint applies), the derivation (`viewpoint/derive/`), the Symbol Editor catalogue (`notationCatalog.ts`).
- The four demo scenes and their metamodels (DemoPEST/SM, DemoPetri, DemoESM, DemoFlowB; `/Users/alfonso/jjodel-demo-exports/`, read only).
- Report: `docs/discovery/discovery_2026-09-29_visual_concrete_syntax.md`, opening with `## 0. Answer in brief`, at most 60 lines; plus this prompt's Status and a log entry in `docs/log-inbox/views.md`.

## COME

1. Read `CLAUDE.md` (§6, the discovery rules, critical zone, design system: slate `#334155`, cyan accents `#0ea5e9`, 11 px labels, 8 px grid), `docs/PROTOCOL.md` P16, RC-20, RC-21, RC-33, R-VP-15, R-VP-16, R-MCID-1, R-MCID-2, the Symbol Editor rows, and the petri notation discovery (`discovery_2026-09-29_petri_notation.md`: reuse its trait-table method).
2. A lane probe on port 3053 (`lane-run probe`, never 3001), light theme, 1600×1000. For each of the four demo scenes: the default notation of the M2 and of the M1, and the derived viewpoint (Advanced, the Semantic type or Simulation toggle as the trunk requires, the preset, Apply, «Derive viewpoint»). Crops at `sips -Z 600` under `docs/discovery/harness/_tmp_visual_*.png` (gitignored), named per scene and view. Use `~/.jjodel-lanes/probe-kit/simgate/` for the setup.
3. Per kind, a trait table against the textbook notation (state machine: rounded states, initial filled dot, final bull's-eye, labelled arrows `event [guard] / action`; activity: rounded actions, diamond decisions, fork/join bars, initial/final nodes; ESM: as state machine with data; UML class boxes for M2: compartments, typography, multiplicities, association ends), scored today [M], and what each missing trait needs.
4. Cross-cutting: typography (families, sizes, weights against the 11 px rule), colours (tokens, contrast), edge routing and labels, arrowheads, spacing and alignment, label collisions, selection and hover states, consistency between M2, M1 and derived views.
5. `Recommended:` a ranked list (impact × cost), grouped in lanes that could run before the freeze (2026-10-01 evening) and after; name every point that is Alfonso's decision (new persisted vocabulary, IR changes, critical zone).
6. One docs commit. Stop with `Outcome: hard-stop`, the sha, §0 and the crop paths.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes outside this worktree, a critical-zone file, product code, dark-theme work.

## RIFERIMENTI

- R-VP-15, R-VP-16; the petri notation and viewpoint derivation discoveries; the design system in the project instructions.
