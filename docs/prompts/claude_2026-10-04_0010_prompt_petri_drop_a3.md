# Prompt: petri-ink-ports without A3 (handles stay as on the trunk), ready to merge before the MODELS demo

Prompt-ID: P-2026-10-04-0010
Chat: C-2026-10-03-1610
Lane: light-weight full (revert of one commit on a finished branch, gates, probe; no new design). Tier: heavy (RC-32: the revert touches critical-zone files `handlePosition.ts`, `DynamicHandles.tsx`, `viewpoint/ir/`). Model: the default of `.claude/settings.json`, no deviation. Critical-zone go-ahead: RC-30, given by the chat at launch (`--critical-zone-goahead P-2026-10-04-0010`) on Alfonso's «decidi tu ma non portare problemi con la demo» (2026-10-04 00:05); the change only returns those files to their trunk behaviour.
Status: eseguito 2026-10-04 · lane petri-ink-ports · trunk taken 00de5a681, revert of A3 04c13e039 (irLabelAnchors.test.ts:77 added by the chat's GO option 1) · non fuso: hard-stop · R-VP-58 and R-VP-59 ratified, R-VP-60 withdrawn until after Málaga · gates: typecheck 14 (the §17 set), build exit 0, vitest full re-run after the commits (closing report) · probe on 3080 64/64: A1 16.3:1 light, 12.59:1 dark; A2 no outside label within 4 px of an arrowhead (rest, Auto layout, DOWN; min 17.52 px); handles 34 of 68 ends off after Auto layout, the trunk's ends and figures; the four default panes identical to the trunk-code run (8/8, crops byte for byte 16/16) · crops in ~/.jjodel-lanes/P-2026-10-04-0010/crops/

Worktree: `~/jjodel-w-petriports`, branch `petri-ink-ports` at `17969f5d7` (closure of P-2026-10-03-1920), `frontend/node_modules` symlinked as P14 allows; a fresh session started by `lane-run`. Before anything else: `pwd`, branch and `git log -1` (the docs commit that added this prompt, on top of `17969f5d7`); if any differs, stop with `Outcome: blocked`.

## COSA

Alfonso's decision on the three amendments of P-2026-10-03-1920, taken by the chat on his delegation with one constraint, nothing that can hurt the MODELS demo (freeze 2026-10-07):

- **A1 (R-VP-58), kept.** Petri bars and the Flowchart initial disc in the name ink. Pure colour, contrast measured in both themes.
- **A2 (R-VP-59), kept.** An outside label takes a side no edge end holds. It removes a defect the demo shows (DemoPetri names on arrowheads).
- **A3 (R-VP-60), dropped for now.** Handles pinned to ELK-routed ends (`6756eddd2`). It touches the handle code in the critical zone, its gain is under a few pixels and only after an Auto layout, and `DynamicHandles` keys were involved in the «Maximum update depth» loop of 2026-10-01. It comes back after Málaga (2026-10-09) as its own lane.

Remove A3 from the branch and leave A1 and A2 working exactly as measured.

## DOVE

On the branch: `git revert 6756eddd2` (one revert commit). Expected conflicts in `frontend/src/components/editor-v2/viewpoint/ir/irEdgeViews.ts`, which A2 (`679d68710`) also changed: keep every A2 hunk (`irLabelAnchors`, end counting per side), remove every A3 hunk (`irSourcePin`, `irTargetPin`, route sides). `handlePosition.ts` and `DynamicHandles.tsx` must end byte-identical to the trunk (`git diff alfonso-frontend-jjtl -- <file>` empty for both). `irElkPorts.test.ts` goes with A3. The probe `frontend/scripts/probe/petri-ink-ports.ts` (or the name of P-2026-10-03-1920's probe): adjust only its A3 expectations (handles) to report, not assert. `docs/decisions.md`: R-VP-58 and R-VP-59 ratified by Alfonso on 2026-10-04 (delegated to the chat), R-VP-60 marked «withdrawn 2026-10-04, after Málaga» with one line of reason; never renumber. Plus the closure docs: this prompt's Status and `docs/log-inbox/views.md`. Nothing else; a file outside this list: stop with `Outcome: question`.

## COME

1. Read `CLAUDE.md` (sections 3, 5, 6, 17, 21.2), RC-14, RC-21, RC-30, the report `docs/discovery/discovery_2026-10-03_petri_ink_ports.md` §0 and §10, and the three commits named above.
2. Take the trunk first if it moved since `ad776870f` (RC-14, `lane-run merge --trunk-into` style, merge commit, no rebase).
3. Revert A3 as DOVE says. Then grep the tree for `irSourcePin`, `irTargetPin` and any other identifier A3 introduced: zero occurrences left under `frontend/src`.
4. Gates in the foreground: `npm run typecheck` (the §17 baseline of 14), the full vitest suite (run with the go-ahead variable unset for `criticalZone.test.ts`, or report it as the known ticket), `npm run build` exit 0. Mutation bench not needed for a revert; the A1 and A2 tests must stay green and untouched.
5. Rerun the probe of P-2026-10-03-1920 through `lane-run probe <worktree> <probe.ts> --port 3080` (never 3000, 3001 or 3003), 1600×1000, light and dark, the four demo scenes: A1 contrast still at least 3:1 in both themes, A2 still no name within 4 px of an arrowhead (at rest, after Auto layout, profile turned top-to-bottom), handles equal to the trunk's (report the off-by figures, expected back to the trunk's 34 of 68 after Auto layout), the default viewpoint of the four scenes byte-identical to the trunk. Crops in `~/.jjodel-lanes/P-2026-10-04-0010/` (Petri classic at rest, light and dark; Flowchart and Activity after Auto layout, dark).
6. Commits: the revert (`revert:` subject naming A3 and R-VP-60), probe adjustment (`probe:`), decisions and closure docs (`docs:`, Status flip with lane, shas, gates and probe outcome; inbox entry); stage by explicit path. Report closes with «Decisions taken (unattended)» and «Decisions awaiting Alfonso». Stop with `Outcome: hard-stop`. Do not merge.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes outside this worktree and `~/.jjodel-lanes/P-2026-10-04-0010/` (no `/tmp`: gate logs and scratch go under the worktree's gitignored `frontend/scripts/smoke/_tmp_*` or the lane directory), a file outside DOVE, removing the `frontend/node_modules` link.

## RIFERIMENTI

P-2026-10-03-1920 (discovery `86f72070f`, A1 `7bc8a6f3b`, A3 `6756eddd2`, A2 `679d68710`, probe `dc893ce3c`, trunk take `ad776870f`, closure `17969f5d7`); R-VP-15/24, R-VP-49, R-VP-53, R-VP-58..60; P-2026-10-01-1655 (the «Maximum update depth» loop, `DynamicHandles` memo).
