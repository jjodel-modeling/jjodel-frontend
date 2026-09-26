# Prompt: merge simulation-engine (guard outcomes, Petri else, panel lines) into the trunk

Prompt-ID: P-2026-09-26-1615
Chat: C-2026-09-26-1100
Lane: full (merge)
Status: da eseguire

Worktree: `~/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session (`/clear`). Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop. The only other tree this lane may touch is `~/jjodel-sim`, in step 9, for a fast-forward, and only after Alfonso's explicit OK. Do not touch any other tree.

Single phase, hard stops at steps 2, 7 and 9. A merge: no file is edited by hand. Every reply of this session opens with `[P-2026-09-26-1615 · session <id>]`.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), another session is working here, or the trunk tip is not the commit that adds this file (its parent `cb2209b44`), stop and say what you see.

## COSA

Bring `simulation-engine` into the trunk with one merge commit, `--no-ff`, of the explicit sha `172f408c1`, in the shape of `4b70b5634` (read its body first). Merge base `6aeda5de4`. The branch carries, on top of it:

- `P-2026-09-26-1315`, guard outcomes in the panel: prompt `d15cef944`, discovery `7abb57eaa`, ratification R-SIM-57..63 and Phase 2 prompt `5fdd3da6a`, code `fa56c14de`, closure `5a398eaee` (visual check passed on 3002).
- `P-2026-09-26-1535`, `else` on Petri transitions and panel lines: ratification R-SIM-64..65 and prompt `470c07ee7`, code `b76d75cc9` and `f58456c63` (R-SIM-66), closure `172f408c1` (visual check passed on 3002, step 5 verified by the session only).

No migration, no VersionFixer step, no critical-zone file.

**Behaviour brought into force on 3001:** in `Deadlock` the status row says why each input has no candidate (`Deadlock · ε: t1 false`), with the list per input on click; an enabled button without a candidate says why in its tooltip; the guard compile defects join the defects line at Reset; the discard text names the blocked transition; an `else` on a Petri transition is the complement of its siblings; the lines that appear (defects, halt, run warning) sit above the buttons, and one slot below them holds «Last step», the interruption or a refused Reset.

## COME

1. Preconditions, each a stop if false: `git status` empty here and in `~/jjodel-sim` (the three untracked, gitignored `frontend/scripts/smoke/_tmp_b2_*` files there do not count); `MERGE_HEAD` absent; `172f408c1` is the tip of `simulation-engine`; the prompt files of the branch (`claude_2026-09-26_1315_prompt_sim_guard_outcomes_discovery.md`, `claude_2026-09-26_1315_fase2_sim_guard_outcomes.md`, `claude_2026-09-26_1535_prompt_sim_petri_else_panel_lines.md`) read `Status: eseguito` on `172f408c1`; `git worktree list` shows `alfonso-frontend-jjtl` only here and `simulation-engine` only in `~/jjodel-sim`.
2. Measure. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 172f408c1` (measured from chat at 16:14: no conflict). `git diff --name-only 6aeda5de4 172f408c1 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md` must be empty. The trunk changed since the base `frontend/vite.config.ts`, `frontend/src/common/U.tsx`, `frontend/src/common/navigateReload.ts` and its test (lanes 1335 and 1905), none of which the branch touches. Any conflict, or a code file changed on both sides: **stop** and report before merging.
3. Semantic probes, read-only: on the merged tree exactly one heading per R-SIM number from 38 to 66 (controls: 37 once, 67 none); `docs/log-inbox/simulation.md` holds the trunk's content plus the branch's two new entries (1315, 1535), each once.
4. `git merge --no-ff --no-commit 172f408c1`.
5. Nothing to resolve if step 2 held. Show `git diff --cached --stat` in the report.
6. Commit the merge. Subject within 72 characters, counted: `merge: guard outcomes, Petri else, panel lines (P-2026-09-26-1535)`. Body in the shape of `4b70b5634`: the shas of COSA; the trunk's commits since the base (the 1335 and 1905 lanes, their merges `ef6fb6da0` and `ad49c86e2`, the Status flip `cb2209b44`, the orchestrated lanes memo `3825e41a0` and `61df6a2ab`); the probes; the behaviour brought into force; `Model:` and `Co-Authored-By` trailers.
7. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus 14 (the branch went from 4818 at `6aeda5de4` to 4832 at `f58456c63`), 0 failed, same 9 files red at import; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` 0 tracked hits. Then **visual check, hard stop**: 3001 runs from this tree (do not restart it unless it is down). Ask Alfonso to hard-refresh `http://localhost:3001/` and check, on a copy of a project: (a) a healthy project opens and the Bootstrap icons render (lane 1335); (b) a model without `.[x]` guards simulates as before to its end; (c) paste `~/jjodel-sim/frontend/scripts/smoke/_tmp_sim3b_scenarios.js` and then `~/jjodel-sim/frontend/scripts/smoke/_tmp_b2_scenario.js` into the console (read them, do not copy them here), open `b2net`, Reset, Step twice: the status row reads `Deadlock · ε: t1 false`, a click opens the list, the Step button does not move. Wait.
8. After his OK, one docs commit: this prompt's Status flipped to `eseguito 2026-09-26 · lane merge · <merge sha> · verifica visiva passata 2026-09-26`, pathspec after `--`, subject `docs: Status flip for the simulation-engine merge (P-2026-09-26-1615)`. No log entry for the merge.
9. **Hard stop before touching `~/jjodel-sim`.** Ask Alfonso whether any session is working in `~/jjodel-sim`. Only on his explicit OK: assert `pwd`, branch `simulation-engine`, `git status` empty (the three `_tmp_b2_*` files do not count), then `git merge --ff-only <the Status commit sha>`. A refusal: stop, never a non-ff merge.
10. Closing report: merge sha, probes, gates, visual result, the fast-forward, push state (do not push).

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry.

## RIFERIMENTI

- `docs/PROTOCOL.md` P13, P14; `docs/decisions.md` RC-13, RC-14, RC-17, R-SIM-57..66.
- Precedents `4b70b5634` (merge), `6aeda5de4` (Status flip); prompt `claude_2026-09-26_1240_prompt_merge_sim_b2.md`.
