# Prompt: merge simulation-engine (profiles genre fix, state operator B2) into the trunk

Prompt-ID: P-2026-09-26-1240
Chat: C-2026-09-26-1100
Lane: full (merge, docs resolution)
Status: da eseguire

Worktree: `~/jjodel-release`, branch `alfonso-frontend-jjtl`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop. The only other tree this lane may touch is `~/jjodel-sim`, in step 9, for a fast-forward, and only after Alfonso's explicit OK. Do not touch `~/jjodel`, `~/jjodel-open`, `~/jjodel-gate`, or any other tree.

Single phase, hard stops at steps 2, 7 and 9. A merge: no source file is edited by hand; one docs file is resolved as step 5 says.

**Other chats.** `C-2026-09-25-1353` runs `P-2026-09-25-1905` (cancelled navigation) on `navigate-cancel` in `~/jjodel-open`, port 3003, and will merge it into this trunk too. Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `5433451fd`), stop and say what you see.

## COSA

Bring `simulation-engine` into the trunk with one merge commit, `--no-ff`, of the explicit sha `61c5b98a0`, in the shape of `2537f9e85` (read its body first). Merge base `2537f9e85`. The branch carries, on top of it:

- `P-2026-09-25-1840` (chat `C-2026-09-25-1759`), profiles genre fix, pure module: ratification R-SIM-56 and prompt `fcc012cc8`, fix `a27e46e8d`, closure `89faeef25`. No visual check (nothing wired).
- `P-2026-09-26-1105`, wave B2 of the `.[x]` state operator: prompt `c32603067`, code `81373fab0` (guards read σ through `toJjelStateAccess`, `marked`/`tokens` on places only; strict guard parse; pure `actionEvaluator.ts`, not wired: the run keeps `NO_SIM_ACTIONS`), closure `61c5b98a0` (visual check passed on 3002, 2026-09-26).

No migration, no VersionFixer step, no critical-zone file.

**Behaviour brought into force on 3001:** a guard can read `x.[marked]` and `x.[tokens]` of a place and follows the marking; any other `x.[a]` in a guard is a defect (nothing is declared until lane C); a guard that does not parse strictly (`a b`) is a defect. Known gap, ticketed on the branch: the panel does not show why a guard is false or defective.

## COME

1. Preconditions, each a stop if false: `git status` empty here and in `~/jjodel-sim`; `MERGE_HEAD` absent; `61c5b98a0` is the tip of `simulation-engine`; the two prompt files of the branch (`claude_2026-09-25_1840_prompt_sim_profiles_genre_fix.md`, `claude_2026-09-26_1105_fase2_state_operator_b2.md`) read `Status: eseguito` on `61c5b98a0`; `git worktree list` shows `alfonso-frontend-jjtl` only here and `simulation-engine` only in `~/jjodel-sim`.
2. Measure. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 61c5b98a0` (measured from chat at 12:37: one conflict, `docs/log-inbox/simulation.md`). `git diff --name-only 2537f9e85 61c5b98a0 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md` must be empty. The trunk changed one code file since the base, `frontend/vite.config.ts` (1820), which the branch does not touch. Any other conflict, or a code file changed on both sides: **stop** and report before merging.
3. Semantic probes, read-only:
   - Numbering: on the merged result exactly one heading per R-SIM number from 38 to 56 (`grep -c` per number = 1).
   - The inbox: the trunk's fold `02f16c829` moved the branch's older entries into `docs/claude-code-log.md` and emptied the inbox, while the branch kept them and appended new ones. On `61c5b98a0` the file holds, in order: the entries of B1, 1500 and its tickets, the Vite ticket, A, 1805 (all dated 2026-09-25, all folded), then the 1840 entry (`## 2026-09-25 — fix: profile closure separates shape and genre (P-2026-09-25-1840)`), the B2 entry and the B2 ticket (both 2026-09-26). For every entry above the 1840 one, check that its text is in `docs/claude-code-log.md` on the trunk tip **verbatim** (a script that compares entry by entry; report the count). A single entry that is not there verbatim: **stop**.
4. `git merge --no-ff --no-commit 61c5b98a0`.
5. Resolve `docs/log-inbox/simulation.md` (RC-14 exception, text only): the trunk's file (the header alone), followed by the three entries not yet folded, verbatim and in branch order: the 1840 entry, the B2 entry, the B2 ticket. Nothing else: the folded entries must not come back. No line of any entry changed. Show `git diff --cached -- docs/log-inbox/simulation.md` in the report as a summary (header kept, three entries added), then `check:docs` (the "entries waiting to be folded" warning for the simulation lane is expected).
6. Commit the merge. Subject within 72 characters, counted: `merge: profiles genre fix and state operator B2 (P-2026-09-26-1105)`. Body in the shape of `2537f9e85`: the shas of COSA; the trunk's commits since the base (the 1835 Status flip, the pre-R-SIM-38 ticket, the fold and rotation, the 1905 discovery prompt, the 1820 lane and its merge, the session checkpoint); the probes and the entry count of step 3; the inbox resolution declared (RC-14 exception); the behaviour brought into force; `Model:` and `Co-Authored-By` trailers.
7. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus 51 (the branch went from 4767 at `fcc012cc8` to 4818 at `81373fab0`), 0 failed, same 9 files red at import; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` 0 tracked hits. Then **visual check, hard stop**: 3001 runs from this tree (do not restart it unless it is down). Ask Alfonso to hard-refresh `http://localhost:3001/` and check, **on a copy of a project**: (a) a healthy project opens and a hash change opens a second one; (b) a model without `.[x]` guards simulates as before (Reset, Step to the end); (c) paste `~/jjodel-sim/frontend/scripts/smoke/_tmp_sim3b_scenarios.js` and then `~/jjodel-sim/frontend/scripts/smoke/_tmp_b2_scenario.js` into the devtools console (read those two files, do not copy them into this tree), open `b2net`, Reset, Step twice: `Deadlock` with `p1` still marked. Wait.
8. After his OK, one docs commit: this prompt's Status flipped to `eseguito 2026-09-26 · lane merge · <merge sha> · verifica visiva passata 2026-09-26`, pathspec after `--`, subject `docs: Status flip for the simulation-engine merge (P-2026-09-26-1240)`. No log entry for the merge.
9. **Hard stop before touching `~/jjodel-sim`.** Ask Alfonso whether any session is working in `~/jjodel-sim`. Only on his explicit OK: assert `pwd`, branch `simulation-engine`, `git status` empty (the three untracked, gitignored `_tmp_b2_*` files do not count), then `git merge --ff-only <the Status commit sha>`. A refusal: stop, never a non-ff merge.
10. Closing report opening with `[P-2026-09-26-1240 · session <id>]`: merge sha, probes and entry count, the inbox resolution, gates, visual result, the fast-forward, push state (do not push).

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry.

## RIFERIMENTI

- `docs/PROTOCOL.md` P13, P14; `docs/decisions.md` RC-12, RC-13, RC-14, RC-17, R-SIM-38..56.
- Precedents `2537f9e85` (merge), `a44917a8e` (Status flip); prompt `claude_2026-09-25_1835_prompt_merge_simulation_engine.md`; fold `02f16c829`.
