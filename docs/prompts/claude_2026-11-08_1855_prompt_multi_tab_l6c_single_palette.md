# Multi-tab, lane L6c: one Instances palette for a split, at the window's left edge

Prompt-ID: P-2026-11-08-1855
Chat: C-2026-11-08-1855
Front: multi-tab
Status: eseguito 2026-11-08 · lane full · d10579948 · finished by P-2026-11-08-2025 · gates green (typecheck 0, build, check:docs, vitest 177 passed) · log entry in docs/log-inbox/multi-tab.md · Alfonso's visual GO pending
Lane: full (TSX in editor-v2 and Navbar.tsx, SCSS; no critical zone, no core)
Depends: P-2026-11-08-1729 (branch multi-tab-l6b at 4fb6549cb, not merged: rail at the window's right edge, no width cap, toolbar icons, app bar lists the beside tab); R-MT-26
Worktree: ~/jjodel-w-mtl6b, branch multi-tab-l6b, at this prompt's commit (node_modules by the P14 symlink, re-created by you, removed at the end)
Request: https://claude.ai/code/session_01DQt9R3ryTKXDLzoripnbo6 (Alfonso 2026-11-08 18:43 on the split at localhost:3061: «la barra a sinistra del modello a destra non è in posizione bellissima»; 18:49: «va bene la prima [one palette for the whole editor area, following the focused pane], per le altre cose decidi tu»)
Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. No subagents, no background tasks. A dev server is allowed on a free port (lsof first; never 3000, 3001, 3003, 3061, 4700), stopped before exit (stop only processes you started, by PID). Port 3061 serves this worktree for Alfonso: restart your own server after every source edit (trap of P-2026-11-08-1608: a second module instance of DockManager). Every reply opens with [P-2026-11-08-1855 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Every question with a recommendation carries it in one line: `Recommended: <one line>`. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; never cat a probe, test or gate log; one probe run per tool call. Run `uptime` as its own command before each probe run and wait while the 1-minute load is above 40. Probes only in `~/.jjodel-lanes/P-2026-11-08-1855/`, copied from `~/.jjodel-lanes/P-2026-11-08-1729/` (gesture.mjs, scenes `beside`, `single`, `refactor`), never edited in place. CSS classes are internal API: never rename or remove one; grep before adding a class name or a custom event. Commit as soon as the gates are green; one commit per numbered item; if the context runs short, commit what is done and stop with a handoff in the lane folder.

## The finding

In a split of the same model with two viewpoints, each pane is a full editor with its own Instances palette (`components/editor-v2/panels/PalettePanel.tsx`, mounted by `EditorV2.tsx`). The right pane's palette therefore stands in the middle of the window, between the two canvases, and reads as part of the left canvas. The hint block (drag, right-click, dbl-click) and «Select an element to see available operations» appear twice. After a fit, nodes of the left canvas sit under its palette or past its left edge (ExhaustFan, the Bathroom label). Both app bar tabs read «Apartment», so the user cannot tell which is which.

## Decisions (taken by the chat, Alfonso delegated them)

D1. In a split, one palette for the whole dock area, at the window's left edge, where a single tab has it. It shows the palette of the active pane: the pane that last received a pointerdown or focus inside its canvas or toolbar. Its header reads `INSTANCES · <viewpoint name>` of the active pane. The two canvases are adjacent, separated only by the dock divider; the rail stays at the right edge as 1729 left it.
D2. The active pane is marked by a 2 px top border in the cyan accent (`#0ea5e9`) on its toolbar; the inactive pane has none. No other visual change to the panes.
D3. A drag from the palette creates only in the active pane. Over the inactive canvas the drop is refused (no-drop cursor, nothing created). The selection stays shared as R-MT decided; selecting in a pane makes it active.
D4. One hint block and one «Select an element» line, in the single palette.
D5. When two tabs show the same model, each app bar tab reads `<model> · <viewpoint>`; otherwise the label is unchanged. Truncation with the full text as tooltip.
D6. The fit of each canvas uses its own visible rectangle (palette and rail excluded), so after a fit no node box intersects the palette or leaves the canvas.
D7. A single tab and the Refactoring split look exactly as today.

## COSA

(1) Discovery note, committed alone, short: `docs/discovery/discovery_2026-11-08_l6c_single_palette.md` (path `docs/discovery/`, naming `discovery_<data>_<descrizione>.md`). Where the palette is mounted and what it reads from its editor (viewpoint, model, drop target, hint block); where the active pane can be held (the dock container in `EditorV2.tsx` or `DockManager.tsx`, no global store unless one already holds per-dock state); where the fit reads its viewport; where Navbar builds a tab label. For each of D1..D6 the smallest change and its files. If D1 or D3 needs a file outside `components/editor-v2/`, `DockManager.tsx`, `pages/components/Navbar.tsx` and SCSS, or any critical-zone file or `src/model/`, do not stop: implement the fallback instead (the right pane's palette moves to the window's outer edge, right of the rail, by SCSS only, and the hint block shows only in the left palette), write why in the note, and continue with D2, D4 (as far as it applies), D5, D6.
(2) D1, D3, D4: one commit. (3) D2: one commit. (4) D5: one commit. (5) D6: one commit; if it needs `viewportInset.ts` or a critical-zone file, skip it, record it in the note as open, and continue.
(6) Gates: typecheck (print its exit status), build, check:docs; vitest on the files you touched, the five L6 test files, and a new unit test for the active-pane rule (pointerdown switches, drop on inactive refused) if the logic sits in a plain function.
(7) App check, demo project «Smart building», model «Apartment» on «Control wiring», «Open beside ▸ Floor plan», at 1600 and 1280 px, two runs each: exactly one element matching the palette root in the DOM; the palette's right edge is at most the left canvas's left edge; the left canvas's right edge equals the divider's left edge and the right canvas's left edge the divider's right edge (±1 px); after a fit no node box of either canvas intersects the palette or the rail; click in the right canvas: header shows `Floor plan`, palette lists the Floor plan types, cyan border on the right toolbar; drag «Room» onto the right canvas creates one Room, onto the left canvas creates nothing; app bar tabs read `Apartment · Control wiring` and `Apartment · Floor plan`. Then once each: a single tab, the Refactoring split, the 1730 two-model demo (labels unchanged there, models differ).
(8) Crops in light theme, at most three (the split at 1600 with the right pane active, the split at 1280, a single tab). Closure, one docs commit: the tables appended to the note; the L6 log entry in `docs/log-inbox/multi-tab.md` extended with this lane; the Status flip of this prompt. Exit with Outcome: hard-stop (visual check due).

## DOVE

`frontend/src/components/editor-v2/**` (TSX, SCSS, tests), `frontend/src/components/dock/DockManager.tsx` or wherever `DockManager.tsx` lives, `frontend/src/pages/components/Navbar.tsx`, SCSS files already touched by the branch, the note, the inbox, this prompt.

## HARD STOP

After (8). Any file outside DOVE is a stop with Outcome: question and a `Recommended:` line, except the fallback path of (1). No critical-zone file. Remove the node_modules symlink and stop your dev servers first. No push, no merge.

## RIFERIMENTI

`docs/discovery/discovery_2026-11-08_l6b_beside_layout.md` (1608, 1633, 1729 tables); `~/.jjodel-lanes/P-2026-11-08-1729/` (probe, crops); Alfonso's screenshot of the split on 3061, described in «The finding».
