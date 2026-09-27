# Prompt: merge sim-profiles (M3, the profiles reach the panel) into the trunk

Prompt-ID: P-2026-09-27-0345
Chat: C-2026-09-26-1702
Lane: full (merge; zero conflicts expected, the branch already holds the trunk; simulation-engine fast-forwarded at the end)
Status: da eseguire

Worktree: `~/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-09-27-0345 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `cdb46a7ee`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `sim-profiles` into the trunk with one merge commit, `--no-ff`, of the explicit sha `939adb668`, in the shape of `fe4e3030b` (the C2 merge; read its body first). Merge base `cdb46a7ee`: the branch took the trunk at `93e62abbb` (`P-2026-09-27-0325`, both panel files auto-merged, `docs/decisions.md` and `docs/log-inbox/simulation.md` resolved by union there), so this merge should be conflict-free. The branch carries: the discovery prompt `6cb857874` (`P-2026-09-27-0150`), the report `1dddb15ae`, the earlier trunk merge `3b7770708`, the R-SIM-77..79 rows `5a9727e01` (provisional, RC-25), the Phase 2 prompt `927648820` (`P-2026-09-27-0225`), the code `48ab676df` (`profileBinder.ts`, `metamodelSketch.ts`, `profileSummary` and the Apply patch builder in `simRoleStatus.ts`, 39 tests, 6/6 mutants killed) and `d1d1bba2b` (the Profile row, Apply, Configure…, the body `max-height`), the closure `481768fcc` (M3 checklist 1-8 by the session and re-run by the chat on 3006), the 0325 prompt `794ddb555`, the trunk merge `93e62abbb`, its Status flip `939adb668` (the two probes re-run by the chat on the merged branch: C2 on 3005, M3 on 3006).

Then fast-forward `simulation-engine`: `cd ~/jjodel-sim && git status --short` must be empty (branch `simulation-engine`, at `fe4e3030b`), then `git merge --ff-only <merge sha>` there (step 7). That is the one write allowed outside `~/jjodel-release`.

No migration, no VersionFixer step, no critical-zone file.

**Behaviour brought into force on 3001:** on a metamodel the Simulation panel has a «Profile» row with four presets (Petri net, Flowchart / Activity, State machine, Extended state machine), a summary line (`Checkable` / `Not checkable`, the missing items, the proposals before Apply, `Set but off: …`), Apply writing one `state` assignment (bound values of unset keys plus `simProfile`, one undo step), «Configure…» folding and unfolding the groups, and a body `max-height` with scroll; «Custom» is shown, not offered; a live M1 run is interrupted by an Apply on its metamodel.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `939adb668` is the tip of `sim-profiles`; the prompt files `claude_2026-09-27_0150_prompt_sim_profiles_panel_discovery.md`, `claude_2026-09-27_0225_fase2_sim_profiles_panel_m3.md` and `claude_2026-09-27_0325_prompt_sim_profiles_take_trunk.md` read `Status: eseguito` at `939adb668`; `git worktree list` shows `sim-profiles` only in `~/jjodel-gate` and `simulation-engine` only in `~/jjodel-sim`; `simulation-engine` is at `fe4e3030b`, an ancestor of the branch.
2. Measure. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 939adb668` (measured from chat at 03:40 against `93e62abbb`: zero conflicts, 14 files, all on the branch side only). `git diff --name-only cdb46a7ee 939adb668 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No trunk commit since `cdb46a7ee` may touch `frontend/src/components/editor-v2/sim` or `frontend/src/model/simulation`: `git diff --name-only cdb46a7ee alfonso-frontend-jjtl -- frontend/src/components/editor-v2/sim frontend/src/model/simulation` empty. Any conflict, or a code file changed on both sides: **stop** and report before merging.
3. Semantic probes on the merge-tree result: R-SIM-73..76 once each, R-SIM-77, R-SIM-78, R-SIM-79 once each (control: R-SIM-80 none); the two «Decisioni 2026-09-27» headings once each; in `docs/log-inbox/simulation.md` the headings of `P-2026-09-26-2340`, `P-2026-09-27-0200` and `P-2026-09-27-0225` once each; RC-25..30 once each.
4. `git merge --no-ff --no-commit 939adb668`. No hand edit is expected; if git reports a conflict, stop.
5. Commit the merge. Subject within 72 characters, counted: `merge: simulation profiles in the panel, M3 (P-2026-09-27-0225)`. Body in the shape of `fe4e3030b`: the shas of COSA; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the behaviour brought into force; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0 (this tree holds no `_tmp_*` probe; if it does, say which and check the tracked files alone as `P-2026-09-27-0325` did); vitest: state the expected total first, the trunk tip's count (measure before step 4) plus 39, 0 failed, the same files red at import; hook tests 255; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS.
7. Fast-forward `simulation-engine` as in COSA. If the tree is dirty or the fast-forward is refused, skip it, say so, and continue: the chat does it.
8. `Outcome: hard-stop`: 3001 runs from `~/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 (served `profileBinder.ts` 200; the served `SimulationPanel.tsx` carries the Profile row) and Alfonso's confirmation goes in the morning digest.
9. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito 2026-09-27 · lane merge · <merge sha> · verifica visiva passata 2026-09-27 (chat, unattended; Alfonso in the morning digest)`, pathspec after `--`, subject `docs: Status flip for the profiles panel merge (P-2026-09-27-0345)`. No log entry for the merge. Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the `--ff-only` in `~/jjodel-sim`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P13, P14; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29, R-SIM-77..79.
- Precedents `fe4e3030b` (C2 merge), `cdb46a7ee` (Status flip), `93e62abbb` (the branch's trunk merge); prompts `claude_2026-09-27_0300_prompt_merge_sim_derived.md`, `claude_2026-09-27_0325_prompt_sim_profiles_take_trunk.md`.
