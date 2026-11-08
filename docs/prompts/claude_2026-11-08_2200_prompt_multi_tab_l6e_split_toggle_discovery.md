# Multi-tab, lane L6e, Phase 1: the split as a toggle of the tab (discovery), plus the L6d closure

Prompt-ID: P-2026-11-08-2200
Chat: C-2026-11-08-1855
Front: multi-tab
Status: eseguito 2026-11-08 · lane full · 82ca58b64
Lane: full (discovery, read-only on source; one docs commit for the L6d closure)
Depends: P-2026-11-08-2045 (L6d, F1..F3 at efcda31f1, Alfonso's visual GO 2026-11-08 21:55; its docs closure is item (0) here, from `~/.jjodel-lanes/P-2026-11-08-2045/handoff.md`)
Worktree: ~/jjodel-w-mtl6b, branch multi-tab-l6b, at this prompt's commit
Request: https://claude.ai/code/session_01DQt9R3ryTKXDLzoripnbo6 (Alfonso 2026-11-08 21:34, 21:47, 21:55; words in `~/.jjodel-lanes/P-2026-11-08-2200/request.md`)
Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. No subagents, no background tasks, no source edits in this phase. A dev server is allowed on a free port for reading the app (lsof first; never 3000, 3001, 3003, 3061, 4700), stopped before exit. Every reply opens with [P-2026-11-08-2200 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs; never cat a log. Keep context lean: grep and read the regions you need, not whole files; this phase must end well inside the context ceiling.

## The target behaviour (Alfonso's decisions, R-MT-27 provisional until the Phase 2 GO)

S1. A model or metamodel open in a tab shows a split icon at the left of its toolbar. Clicking it divides the canvas in two; clicking it again closes the split and keeps the active pane. Each pane header also has a close cross. Two panes at most.
S2. The new right pane opens the same model and becomes active. Its viewpoint is chosen automatically: another graphical viewpoint of the model, different from the left pane's; if there is none, the model's textual syntax, if one exists; only otherwise the same viewpoint (layout shared, R-MT).
S3. Each pane has a viewpoint selector that lists the graphical viewpoints and, after a separator at the end, the textual syntax when one exists, and a model selector listing the models open in the project's tabs (selected or not), metamodels included. Dropping an app bar tab onto a pane puts that model in the pane.
S4. The split belongs to the tab: switching tab and back restores panes, viewpoints, sizes and the active pane. The app bar shows one entry for a split tab, with a small split mark; the separate beside entry of L6b goes.
S5. A textual pane: when active, the single palette collapses (the graphical canvas gains the width); when inactive, the editor is read-only (scroll and select-to-copy allowed), and the first click only activates it (F3 rule). Text edits reach the model only when the text parses; until then the graphical pane keeps the last valid model and the textual pane header shows a parse warning. A diagram edit rewrites the text unless the textual pane holds unparsed edits.
S6. «Open beside ▸ viewpoint» and the 1730 two-model view become shortcuts of the same mechanism.
S7. Leftovers to fold in: the rail filter follows the active pane's viewpoint; the right minimap must not cover nodes after a fit; the left fit's very low zoom (about 10%) after E1; the four layout writes without a tab key in `EditorV2.tsx` (about :1379, :4863, :4867, :4914, read by 2025, not measured).

## COSA

(0) L6d closure, one docs commit: what `handoff.md` of P-2026-11-08-2045 lists under remaining checks (note tables under an L6d heading, the L6 inbox entry extended, the Status flip of P-2026-11-08-2045 with «Alfonso's visual GO 2026-11-08 21:55»), then `check:docs`.
(1) Discovery note, committed alone: `docs/discovery/discovery_2026-11-08_l6e_split_toggle.md` (path `docs/discovery/`, naming `discovery_<data>_<descrizione>.md`). For S1..S7: where today's split is created and torn down (DockManager, the beside path of L6b, the 1730 path), where the tab and app bar state live and whether a pane layout can be stored per tab, where the textual editor lives (the textual tab of P-2026-11-08-0859), how it parses and writes back to the model, whether it can be mounted in a dock pane and set read-only, and whether it keeps an element-to-text-range map (for a later shared selection; report only). For each S item: the files to change, the smallest design, exported interfaces touched, critical-zone files touched (name them; none may be edited without a go-ahead), and a size estimate in commits. Then a proposed cut into Phase 2 lanes that each fit one session (at most about five commits each), in order, with what each delivers visibly. List open questions with a `Recommended:` line each.
(2) Hard stop. Remove nothing, stop your dev server. Outcome: hard-stop.

## DOVE

Read anywhere under `frontend/src/`. Write only the note, the L6d closure files (note, inbox, the 2045 prompt), this prompt's Status at the end.

## HARD STOP

After (2). No source edit. No push, no merge.
