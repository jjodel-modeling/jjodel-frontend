# Prompt: merge sim-derived (lane C2, derived state attributes) into the trunk

Prompt-ID: P-2026-09-27-0300
Chat: C-2026-09-26-1702
Lane: full (merge; zero conflicts measured; simulation-engine fast-forwarded at the end)
Status: eseguito 2026-09-27 · lane merge · fe4e3030b · verifica visiva passata 2026-09-27 (chat, unattended; Alfonso in the morning digest)

Worktree: `~/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-09-27-0300 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `1e32c3a50`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `sim-derived` into the trunk with one merge commit, `--no-ff`, of the explicit sha `2ce6e4dae`, in the shape of `24d8537fd` (read its body first). Merge base `64a910c8e` (the Status flip of the C1 merge; the branch was cut from `simulation-engine` at `8b5871f29` and took the trunk at `ca9880700`). The branch carries, on top of the base: the discovery prompt `4faa9de7a` (`P-2026-09-27-0140`), the report `655706bab`, the trunk merge `ca9880700`, the R-SIM-73..76 rows `0a8ad4270` (provisional, RC-25), the Phase 2 prompt `cfa5fdcdc` (`P-2026-09-27-0200`), the code `5060657c5` (codec `equation`, `derivedEvaluator.ts`, `netTypes` `SimState.derived` and the `DerivedOracle`, `netCompile` defects, `netStep` eager recomputation and the `derived`/`domain`/`read-only` halts, bridge oracle and texts) and `53c24b1fc` (the stored | derived select and the equation cell in the declarations table), the closure `2ce6e4dae` (probe 5/5 by the session and re-run by the chat on 3005).

Then fast-forward `simulation-engine` to the merge commit, as `P-2026-09-27-0135` did, from the tree that has it checked out: `cd ~/jjodel-sim && git status --short` must be empty, then `git merge --ff-only <merge sha>` there (step 7). That is the one write allowed outside `~/jjodel-release`; `git push . …` and `git branch -f` are not used.

No migration, no VersionFixer step, no critical-zone file.

**Behaviour brought into force on 3001:** a state attribute record may carry `equation` instead of `initial`; at Reset and after every fired step the derived values are recomputed on the new σ in dependency order; guards and actions read a derived attribute like a stored one; a failing or out-of-domain equation is a declaration defect at Reset and a halt after a step; an action targeting a derived attribute is a `read-only` defect and halt; cycles, `event` and `node` in a semantic equation are declaration defects; the declarations table offers stored | derived per row with an equation cell (rows 88 px), and no edit drops `equation`.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `2ce6e4dae` is the tip of `sim-derived`; the two prompt files of the branch (`claude_2026-09-27_0140_prompt_sim_derived_attributes_discovery.md`, `claude_2026-09-27_0200_fase2_sim_derived_attributes.md`) read `Status: eseguito` at `2ce6e4dae`; `git worktree list` shows `sim-derived` only in `~/jjodel-icons` and `simulation-engine` only in `~/jjodel-sim`; `simulation-engine` is at `64a910c8e` (an ancestor of the branch, so the fast-forward is possible).
2. Measure. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 2ce6e4dae` (measured from chat at 03:00: zero conflicts). `git diff --name-only 64a910c8e 2ce6e4dae -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. The branch's code files must not have changed on the trunk since the base: `git diff --name-only 64a910c8e alfonso-frontend-jjtl -- frontend/src/model/simulation frontend/src/components/editor-v2/sim` must be empty (measured: empty). Any conflict, or a code file changed on both sides: **stop** and report before merging.
3. Semantic probes on the merge-tree result: R-SIM-73, R-SIM-74, R-SIM-75, R-SIM-76 once each (control: R-SIM-77 none: the profiles rows live on `sim-profiles` and are not part of this merge); R-EDGE-1..3 and RC-25..30 once each; in `docs/log-inbox/simulation.md` the heading of `P-2026-09-27-0200` once and the C1 heading `P-2026-09-26-2340` once.
4. `git merge --no-ff --no-commit 2ce6e4dae`. No hand edit is expected; if git reports a conflict, stop.
5. Commit the merge. Subject within 72 characters, counted: `merge: derived state attributes, lane C2 (P-2026-09-27-0200)`. Body in the shape of `24d8537fd`: the shas of COSA; the trunk's commits since the base (the enum lane `189e8fc53`, `4e5dff7ad`, `90722c375`, `931943f29`, `70f4b1b90`, `5dc09a4ce`, `bda63a2b3`, the merge prompt `59d2f940f`, the merge `1b40eacd0`, the flip `1e32c3a50`, plus any docs commit that moved the tip); the measurement of step 2 (zero conflicts, files on both sides: none); the probes; the behaviour brought into force; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `2ce6e4dae` in `~/jjodel-icons`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests 255; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` 0 tracked hits.
7. Fast-forward `simulation-engine`: `cd ~/jjodel-sim`, `git status --short` empty and branch `simulation-engine`, `git merge --ff-only <merge sha>`; `git log -1 --format=%h` there equals the merge sha. If the tree is dirty or the fast-forward is refused, skip it, say so, and continue: the chat does it.
8. `Outcome: hard-stop`: 3001 runs from `~/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 (served `derivedEvaluator.ts` 200; the declarations table shows the stored | derived select) and Alfonso's confirmation goes in the morning digest.
9. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito 2026-09-27 · lane merge · <merge sha> · verifica visiva passata 2026-09-27 (chat, unattended; Alfonso in the morning digest)`, pathspec after `--`, subject `docs: Status flip for the lane C2 merge (P-2026-09-27-0300)`. No log entry for the merge. Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `~/jjodel-icons` and the `--ff-only` in `~/jjodel-sim`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P13, P14; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29, R-SIM-73..76.
- Precedents `24d8537fd` (merge), `64a910c8e` (Status flip), `1b40eacd0` (enum merge); prompts `claude_2026-09-27_0135_prompt_merge_sim_c1.md`, `claude_2026-09-27_0250_prompt_merge_enum_edge_guard.md`.
