# Code generation 3.3, slice G3 completion: gates, bench, commit, probe and crops of the generator tab

Prompt-ID: P-2026-10-24-0045
Chat: C-2026-10-23-2009
Front: codegen
Lane: full (completion of P-2026-10-24-0003, stopped at the context limit with its work uncommitted)
Depends: P-2026-10-24-0003
Status: eseguito 2026-10-24 · lane codegen · 8e598441f · bench 7/7 · crops in the lane folder
Corregge: P-2026-10-24-0003
Request: Alfonso, 2026-10-23 23:54, in the project chat (kept locally as `request.md`)

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 is done. P8 replaced: the chat runs the visual check on the crops (RC-23).

Worktree: `~/jjodel-w-cggen`, branch `cg-generators`, HEAD `510079134`, with the uncommitted G3 work in the tree
(10 files under `frontend/src/codegen/ui/`). Before anything else: `pwd`, branch, `git log -1`,
`git status --short`; the status must show exactly the G3 files listed in the handoff. Otherwise stop.

Model and tier: as `lane-run` assigns.

## Lane discipline

Every reply opens with `[P-2026-10-24-0045 · session <id>]`; every final message ends with
`Outcome: done | hard-stop | question | blocked`; every question carries `Recommended: <one line>`. Unattended
(RC-21, RC-25) except the RC-26 list. Time limit: 90 minutes. No subagents, no background tasks. **Context
discipline is the point of this lane**: the previous one died at the context limit. Never print a diff, a whole
file or a whole log; read ranges with `sed -n`, filter outputs with `tail`/`grep`, run gates through
`node scripts/run-quiet.mjs` when it exists. One probe run per tool call. Dev server: `npm start -- --port 3131
--strictPort`, stopped before the close.

## Read first, and only this

`~/.jjodel-lanes/P-2026-10-24-0003/handoff.md` (not the `.diff`). The prompt
`docs/prompts/claude_2026-10-24_0003_prompt_codegen_g3_generator_tab.md`, sections COSA 5-6, Gates, Close.
R-GEN-35 and R-GEN-40..41 in `docs/decisions.md`.

## COSA

1. **Commit first.** Run `npm run check:codegen-lazy -- --on` from `frontend/`; if green, commit the G3 work as
   `feat(codegen): generator tab, panel as launcher, two-way provenance (P-2026-10-24-0003)`. If red, fix within
   DOVE, then commit. Nothing else before this commit.
2. **One correction** to the handoff's choices: Run is enabled only when the generator's target is `js`, as Check
   (R-GEN-35: Run calls `main()` of the generator's `js` file; a `none` target produces text that is not a
   program). Add the test (kills: Run enabled on target `none`).
3. **Mutation bench** on the tests of `__tests__/generatorTabs.test.ts` (the five named in the G3 prompt, plus the
   one of item 2): apply each mutation by hand, run only that test file, revert; report killed/total.
4. **Probes.** Write `scripts/probe/codegen-generator-tab.ts` as the G3 prompt's COSA 5 describes. Update
   `scripts/probe/codegen-panel.ts` and `scripts/probe/codegen-check.ts`, which drive the old floating panel, so
   they drive the generator tab (same assertions, new path); if one of them cannot be ported within the time,
   leave it, and open a ticket with `lane-run ticket --front codegen --priority medium --found P-2026-10-24-0045`.
5. **Crops**: the seven of the G3 prompt's COSA 6, under `~/.jjodel-lanes/P-2026-10-24-0045/crops/`.
6. `TemplateEditor.tsx` with no importer: leave it, list it in the log entry as a cleanup candidate.

## DOVE

The G3 files under `frontend/src/codegen/ui/` and their tests; `frontend/scripts/probe/codegen-generator-tab.ts`
(new), `frontend/scripts/probe/codegen-panel.ts`, `frontend/scripts/probe/codegen-check.ts`;
`docs/log-inbox/codegen.md`; the `Status:` lines of this prompt and of P-2026-10-24-0003.

## Close

Commit the item 2 fix and the probes as `fix(codegen)` / `test(codegen)` commits, then one docs commit with the
log entry (covering both lanes) and the two `Status:` flips: on 0003 `eseguito 2026-10-24 · lane codegen ·
<feat sha> · completed by P-2026-10-24-0045`, on this prompt `eseguito 2026-10-24 · lane codegen · <last sha> ·
<bench k/n> · crops in the lane folder`. `Outcome: done`.

## NON FARE

No new feature beyond item 2. Nothing in the critical zone. No change to `EditorV2.tsx`. No new dependency. No
push, no merge.
