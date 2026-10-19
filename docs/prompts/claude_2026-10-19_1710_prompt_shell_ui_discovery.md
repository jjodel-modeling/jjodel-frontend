# Shell visual consolidation, Phase 1 discovery

Prompt-ID: P-2026-10-19-1710
Chat: C-2026-10-19-1610
Front: shell-ui
Lane: full (read-only discovery that plans a multi-lane implementation)
Status: da eseguire
Request: Alfonso, 2026-10-19 17:05, in the project chat: «si, procedi in automatico con /lane auto anche per l'implementazione», after the Linear-style shell pilot and the chat's recommendation to turn it into a front.

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P8 does not apply (no visual change in a read-only discovery).

Worktree: `~/jjodel-w-shellui-disc`, branch `shell-ui-disc`, created from the trunk head named in the launch commit. Before anything else: `pwd`, branch, `git log -1` and `git status --short` (clean) are as stated here. Otherwise stop with `Outcome: blocked`.

## Lane discipline
Every reply of this session opens with `[P-2026-10-19-1710 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.
Unattended (RC-21, RC-25) except the RC-26 list. Time limit: 90 minutes. Node: `~/.local/bin/node`.

## Context (do not redo the pilot)

The project chat ran a CSS-overlay pilot on the application shell (topbar, editor toolbar, left palette rail, right properties rail, status bar, menus), outside the repo, on http://localhost:3000 with project "DemoPetri copy" at 1600x1000. Its files are read-only input for this lane:

- `~/.jjodel-lanes/pilots/linear/baseline_2026-10-19.md`: measured state before.
- `~/.jjodel-lanes/pilots/linear/overlay_v1.css`, `overlay_v2.css`: the target expressed as per-class overrides (every selector there names a real shell class).
- `~/.jjodel-lanes/pilots/linear/after_v2_2026-10-19.md`: before/after on three screens (model, attribute, class selected) and the fragile points.

Findings that frame this discovery: the shell already uses Inter Variable, IBM Plex Mono, slate, no shadows in rails and 0.15 s transitions; the distance is variety (ten radii, three border widths, four weights, eight text colours in one rail, two spacing scales `--space-*`/`--spacing-*`, 495 custom properties on `:root`). The canvas reads `:root` tokens (for example `--color-inode-surface`), so the pilot never touched `:root`.

Target approved by Alfonso (2026-10-19), to be implemented in later lanes, not here:

1. Scale: radius 4 px for controls, 8 px for menus and popovers (circles and pills unchanged); borders 1 px `#e2e8f0` when neutral; text in three levels `#0f172a`, `#475569` and a third level darker than today's `#94a3b8` (about `#64748b`) because `#94a3b8` on white or `#f8fafc` is below 4.5:1; weights 400/500/600 only; no shell text under 11 px; Inter in the status bar (today `-apple-system`); menus radius 8, 1 px border, one light shadow.
2. Hit targets of 24 px for every shell control, without moving the layout.
3. Rails (left palette, right properties) on `#f8fafc` against the white canvas; fields stay white.
4. Right-rail section titles in sentence case, 12 px / 500, no tracking, fixed in the source strings (some are uppercase in the text itself: "GENERAL", "TYPE & BOUNDS"). The left palette keeps its uppercase category label.
5. Action icons muted (third text level), dark on hover or focus, in Advanced only; type icons of the tree keep their colour.
6. Density in Advanced only: tree rows 24 px (today 26), menu items 28 px (today 36). Basic unchanged.
7. Canvas, nodes, edges and the critical zone untouched.

## COSA

Read-only. Answer each point with `file:line` and a verbatim quote where it decides something.

1. **Where the shell styles live.** For every selector in `overlay_v1.css` and `overlay_v2.css`, the SCSS file and line that defines it, and whether the value is a literal or a token. Group by surface (topbar, toolbar, palette, properties rail, status bar, menus). Say which files are shared with non-shell components.
2. **Token inventory.** Which `:root` custom properties the canvas and the node renderers read (grep under the editor-v2 canvas, the IR renderer and the node components), which only the shell reads, and which nobody reads. Count consumers of `--space-*` against `--spacing-*`. Propose a shell-scoped token set applied on a shell root element (names checked unused by a global grep, per CLAUDE.md), and say on which element it can live so that the five surfaces and the menus (which render inside `.context-menu`) inherit it while the canvas does not.
3. **Basic/Advanced.** Where the mode lives (store, hook, component of `.appbar-mode-switch`), and the smallest change that exposes it as a `data-mode` attribute on a root element. Today it is not in the DOM: the pilot detected it with `:has()` on the active last option of the switch.
4. **Uppercase source strings.** Every right-rail section title written uppercase in source, with `file:line`; whether a translation layer exists; whether any test or probe matches those strings.
5. **Unstable selectors.** How the react-select control in the properties rail is styled today (class `css-…-control` in the DOM): `styles` prop, `classNamePrefix`, or nothing. Which component owns the CSS-module class `_toggleXs_*`.
6. **Small targets.** The component files of: `.tree-node__toggle` (14 x 14), `.tree-row__action` (20 x 20), `.rail-focusbar__step` and `__back` (22 px), `.sb-rz__jjodie` and `.sb-rz__bell`, `.appbar-mode-switch__opt` (20 px tall), `_toggleXs_` switches (24 x 14). For each, whether 24 px can be reached without moving the layout (negative margin, pseudo-element, padding inside a fixed box).
7. **Contrast.** Every shell use of `#94a3b8` (or its token) as a text colour, with a count per surface.
8. **Risks.** Files of the critical zone (CLAUDE.md §3.2) that any of the above would touch (expected: none). Smoke assertions affected (canvas width, status bar intersection, clipping). Open branches or lanes that touch the same files today: at least check `P-2026-10-19-1650` (File › New menu) and `P-2026-10-19-1651`, and whether they are merged. Tests that assert on class names, sizes or the uppercase strings.
9. **Slicing.** Propose the implementation as a sequence of lanes, one surface or one concern per lane, each with: files, expected diff size, whether it is fast or full, gates, and the DOM measures for its visual check (reuse the pilot's measures: region rects and canvas unchanged, text under 11 px, targets under 24 px, clipped text, console errors, border widths, radii, weights). The first lane should be the shell token layer plus `data-mode`, because every later lane depends on it. Say which lanes can run in parallel without touching the same files.

Write the report to `docs/discovery/discovery_2026-10-19_shell_visual_consolidation.md` (P4: hypothesis, goal, files read with full paths, findings with `file:line` and verbatim quotes, dependencies and risks, open questions). Questions for Alfonso go at the end, each with `Recommended:`.

## DOVE

- Read: `frontend/src/**` (styles, components of the five surfaces, the mode switch), `frontend/scripts/smoke/**`, tests that match shell classes, `CLAUDE.md`, `docs/decisions.md` (design rows), the pilot folder above.
- Write: only the report, and the log entry in `docs/log-inbox/shell-ui.md` (P9).

## HARD STOP

After the report and the log entry are committed (docs only, pathspec, one commit) and the `Status:` line of this prompt is flipped per P13, stop with `Outcome: hard-stop`. Do not start any implementation.

## NON FARE

- No change to any file under `frontend/src`, no change to `:root` tokens, no new dependency.
- No dev server on 3000, 3001 or 3003; if you need a page, use a free port and stop it before exiting.
- No push, no merge.

## Gates

`npm run check:docs` (from `frontend/`) green before the commit.

## RIFERIMENTI

`CLAUDE.md` (§3.2 critical zone, naming checks), `docs/PROTOCOL.md` (P4, P9, P13), `docs/HARNESS-DOCS.md` §4.2, the pilot folder `~/.jjodel-lanes/pilots/linear/`.
