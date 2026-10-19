# Shell S9: the three open rail tickets

Prompt-ID: P-2026-10-19-2050
Chat: C-2026-10-19-1610
Front: shell-ui
Lane: full (rail sheet, one NodeEditor style rule)
Status: eseguito 2026-10-19, lane P-2026-10-19-2050 (shell-ui-s9, de05729ed); visual check passed (chat, 3019, 1600x1000)
Depends: P-2026-10-19-1930
Request: Alfonso, 2026-10-19 20:48: «puoi sistemare i ticket in /lane auto ?» (the three tickets of `docs/log-inbox/shell-ui.md` from S6, S7 and S8).

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-shellui-s9`, branch `shell-ui-s9`, from the trunk commit that adds this prompt (S1 to S8 are on the trunk there). Before anything else: `pwd`, branch, `git log -1` and a clean `git status --short`; otherwise stop with `Outcome: blocked`.

## Lane discipline
Every reply opens with `[P-2026-10-19-2050 · session <id>]`. Every final message ends with `Outcome: done | hard-stop | question | blocked`. Questions carry `Recommended: <one line>`. Unattended (RC-21, RC-25) except the RC-26 list. Time limit: 90 minutes. Node: `~/.local/bin/node`. If you approach the context ceiling, write `~/.jjodel-lanes/P-2026-10-19-2050/handoff.md` and `handoff.diff` as S8 did, and stop with `Outcome: hard-stop`.

## Context (do not redo the analysis)
Read the three `**Ticket**` lines in `docs/log-inbox/shell-ui.md` (entries of P-2026-10-19-1742, P-2026-10-19-1830 and P-2026-10-19-1930), the rows R-SHELL-2 and R-SHELL-5 in `docs/decisions.md`, and the S8 block at the end of `frontend/src/components/editors/properties-with-tree-view.scss`. Before editing, write a short discovery report in `docs/discovery/discovery_2026-10-19_shell_rail_tickets.md` (files read, the rule that causes each ticket, the planned fix, risks); it goes in the code commit.

## COSA
1. **react-select inner input box** (ticket of P-2026-10-19-1742). In the rail, the B4 rule `.jj-field input:not([type=color]):not([type=checkbox])` in `properties-with-tree-view.scss` also matches `input.jj-select__input`, giving it 30 px height and a 1 px border: a small box visible left of the value in the Type field. Exclude react-select's input from that rule (for example `:not(.jj-select__input)`, or a reset scoped to `.jj-select__input` under the rail) so the inner input has no border, no background and no fixed height. The `.jj-select__control` geometry and the field row height must not change. Do not edit `JjSelect.tsx` or `buildStyles`.
2. **9 px anchor labels** (ticket of P-2026-10-19-1830). `span.anchor-viz__point-label` in the NODE section of NodeEditor renders at 9 px (17 elements), under the 11 px floor of R-SHELL-5. Find the rule that sets it (grep `anchor-viz`), and bring the label to `var(--shell-font-size-min)` (11 px) if the anchor visualisation is in the rail. If 11 px makes labels collide or clip in the visualisation, adjust only their position or the viz's own spacing inside that component's sheet, and report before/after rects. If the rule lives in a sheet outside DOVE, edit only that one rule and say so in the entry.
3. **23 px section headers** (ticket of P-2026-10-19-1930). `.tree-section__header` is 23 px (padding 4+4, 12 px label), so the 24 px hit boxes of consecutive toggles overlap by 1 px. Give the rail's section headers `min-height: var(--shell-row-height)` (26 Basic, 24 Advanced) with the label vertically centred, rail-scoped in PWT. This moves the tree by a few px per header: accepted by Alfonso's request. In the same pass, fix `.jj-contents-add` losing its top 2 px of hit box under `.jj-contents-group-header` (raise the button's hit box above the header with `position: relative; z-index: 1`, or equivalent), and the first tree toggle's box covered by `.tree-search` if a rail-scoped stacking fix exists without moving layout; if not, leave that one and say why.

## DOVE
`frontend/src/components/editors/properties-with-tree-view.scss`; the one sheet holding the `anchor-viz__point-label` rule (name it in the entry); `docs/discovery/discovery_2026-10-19_shell_rail_tickets.md` (new). Nothing else.

## Gates
typecheck at baseline (CLAUDE.md §17), vitest on `panelSections.test.ts`, `dataManagerSection.test.ts`, any test reading PWT or the anchor sheet, `npm run build` exit 0, `npm run smoke`. DOM measures at 1600x1000 on DemoPetri or an equivalent project, states metamodel, class, attribute, class with its node and NODE open, Basic and Advanced: rail rect `1200,91,400,877`, palette `1,51,200,916`, canvas `201,91,1398,876` unchanged; the Type field shows no inner box (computed `border-width` 0 and height auto on `input.jj-select__input`; control rect unchanged); no text under 11 px in the rail (anchor labels included); section headers at `--shell-row-height`; `elementFromPoint` misses on the integer 24x24 boxes, before and after, with the remaining ones explained; no new clipped text; console errors no more than `init_dash`. Report before/after numbers in the entry.

## Closure
Code commit (pathspec: the sheets and the discovery report). Write the log entry in `docs/log-inbox/shell-ui.md` and the `Status:` flip, uncommitted (RC-17). Start a dev server on port 3019 from this worktree (`npm start -- --port 3019`, detached), write its PID to `~/.jjodel-lanes/P-2026-10-19-2050/dev.pid`, leave it running, and exit with `Outcome: hard-stop` (visual check due). On the GO: one docs commit (entry and Status), stop the dev server, `check:docs`, `Outcome: done`.

## NON FARE
No change to `:root` or token files; no rule in `tree-view-sidebar.scss`; no change to `JjSelect.tsx`, `buildStyles` or NodeEditor's TSX; no file outside DOVE; no dev server on 3000, 3001 or 3003; no push, no merge.

## RIFERIMENTI
`CLAUDE.md` (naming checks, §5, §17); `docs/decisions.md` R-SHELL-2, R-SHELL-5, D-UI-11; `docs/log-inbox/shell-ui.md` (the three tickets and the S8 entry).
