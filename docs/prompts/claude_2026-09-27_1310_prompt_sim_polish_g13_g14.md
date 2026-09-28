# Prompt: two polish gaps of the second readiness report: the ε of the choice header (G13), the clipped Profile select (G14)

Prompt-ID: P-2026-09-27-1310
Chat: C-2026-09-27-1140
Lane: fast (two style fixes in the panel; a probe screenshot replaces the visual check, the chat looks at the pixels)
Status: eseguito 2026-09-27 · lane sim-polish-g13-g14 · 5739b950f

Worktree: `~/jjodel-gate`, branch `sim-polish-g13-g14` (cut by the chat from `alfonso-frontend-jjtl` at `72177a866`, the trunk with R3 merged), a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-gate`, branch `sim-polish-g13-g14`, `git log -1` is the commit that adds this file (its parent `72177a866`), `git status` empty apart from gitignored `frontend/scripts/smoke/_tmp_*`. Otherwise stop with `Outcome: blocked`. Every reply opens with `[P-2026-09-27-1310 · session <id>]` and ends with a bare `Outcome:` line, the shas on the line above. Run gates in the foreground.

## COSA

Two gaps measured by `docs/discovery/discovery_2026-09-27_sim_demo_readiness_2.md` §5 (G13, G14), both cosmetic, both on screen in the MODELS demo (every Petri conflict; the ESM preset). Chat decision, unattended (RC-25): fixed before the freeze because both are visible in the demo and neither changes what the demo shows.

1. **G13, the ε of the choice header.** `.sim-panel__section` has `text-transform: uppercase` (`simulation-panel.scss:188`), so the header «Choose a transition (ε)» paints `(Ε)`, U+0395, which reads as a Latin E. Fix: the input part of the header is rendered in its own `<span className="sim-panel__section-input">` (name check first) with `text-transform: none`, so the header paints «CHOOSE A TRANSITION (ε)» and, for an event, «CHOOSE A TRANSITION (coin)» with the event's name in its own case. Nothing else in the section style changes.

2. **G14, the clipped Profile select.** At 1600×1000 the Profile select paints «Extended state machin»: the reader said the text fits (`textW 125` against a 137 px content box) because it ignored the native arrow; the pixel says it does not. Fix: measure first (the select's client width, its content box, the width of the longest option «Extended state machine» plus the arrow, in the M2 face of the panel at 1600×1000 and at 1280×800), then give `.sim-panel__profile .sim-panel__select` the room it needs, taking it from the Apply button or the label gap, so that every option of `PANEL_PROFILES` paints whole at both sizes. The option texts do not change (the names are the ratified catalogue, R-SIM-47..55); no row grows in height; the row's total width stays the panel's.

## DOVE

- `frontend/src/components/editor-v2/sim/SimulationPanel.tsx`: the choice header line (`Choose a transition (${pending.input})`, around line 1000 after R3) gains the span; nothing else.
- `frontend/src/components/editor-v2/sim/simulation-panel.scss`: the `&__section-input` rule; the `&__profile` select and Apply widths.
- Tests: none required for a style change; if `SimulationPanel` has a render test that asserts the header text, keep it green.
- `docs/log-inbox/simulation.md`: one entry. This prompt's Status flip.

Out of scope: `simBridge.ts`, every engine file, `simProfiles.ts`, `roleCatalog.ts`, `docs/decisions.md`, the first and second readiness reports.

## COME

1. Baseline from `frontend/`: vitest on `src/components/editor-v2/sim` count, 0 failed; typecheck 14.
2. Measure G14 before editing: a probe copied read-only from `~/jjodel-sim/frontend/scripts/smoke/_tmp_demo2_esm.ts` and its common file as `_tmp_g14_*`, dev server from this tree on port 3012 (never 3001-3006), reading `getBoundingClientRect` and `scrollWidth` of the select and the painted text of its option, at 1600×1000 and 1280×800; put the numbers in the commit body.
3. The two edits, minimal diffs, no rename.
4. Re-run the probe after the edit and read: the select's option «Extended state machine» painted whole at both sizes (`scrollWidth <= clientWidth` and a screenshot crop of the row); the Petri conflict header painted «CHOOSE A TRANSITION (ε)» with code point U+03B5 (the Petri probe `_tmp_demo2_petri.ts` copied as `_tmp_g13_petri.ts`, reading the header's text and the code point of its last letter inside the parentheses). Screenshots to `~/.jjodel-lanes/shots_polish/`, never into the tree: `g13_header.png` (crop of the panel with the list open) and `g14_profile_row.png` (crop of the Profile row, both sizes). Stop the server.
5. Gates: typecheck 14; vitest green, same count; build exit 0; `check:docs` 4/4; `check:scripts` PASS.
6. Two commits, pathspec after `--`: code, subject `fix(sim): the ε of the choice header, the Profile select fits its options (P-2026-09-27-1310)` or, if over 72 once the Prompt-ID is dropped, `fix(sim): choice header ε, Profile select width (P-2026-09-27-1310)`, body with G13/G14, the measurements before and after, `Model:` trailer; docs, the inbox entry (`Smoke visivo: probe readings and two crops for the chat`) and the Status flip `eseguito 2026-09-27 · lane sim-polish-g13-g14 · <code sha>`, subject `docs: close the G13 and G14 polish (P-2026-09-27-1310)`.
7. `Outcome: done`, shas on the line above, and below it the two readings (code point; select widths at both sizes).

Stop with `Outcome: question` and a `Recommended:` line if the select cannot fit «Extended state machine» at 1280×800 without shrinking Apply below its icon-less minimum (say the number), or if the header text is asserted by a test outside the sim folder.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, an engine file, push, any other tree except the read-only copy of the `_tmp_demo2_*` probes from `~/jjodel-sim`.

## RIFERIMENTI

- `docs/discovery/discovery_2026-09-27_sim_demo_readiness_2.md` §5 G13, G14; §4 the ESM and Petri readings; `~/.jjodel-lanes/shots_readiness2/petri_3_choice_open_panel.png`, `esm_1_after_apply_panel.png`.
- `docs/decisions.md` R-SIM-47..55 (the preset names), R-SIM-65, R-SIM-79 (the Profile row); lane M3 (`48ab676df`) for the row, R3 (`766b9643c`) for the header's position.
- `docs/PROTOCOL.md` P13, P16; RC-17, RC-25, RC-26.
