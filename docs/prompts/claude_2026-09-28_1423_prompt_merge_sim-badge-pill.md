# Prompt: merge sim-badge-pill into alfonso-frontend-jjtl

Prompt-ID: P-2026-09-28-1423
Chat: —
Lane: full (merge; 1 conflict: `docs/log-inbox/simulation.md` measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-09-28-1423 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `cf39cdbcb`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `sim-badge-pill` into the trunk with one merge commit, `--no-ff`, of the explicit sha `c111dd403`, in the shape of `c4bb0e0af` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `d861cc922`. The branch carries, on top of the base, 5 commits:

- `c111dd403` docs: visual check passed for the badge pill (P-2026-09-28-0140)
- `b65793bee` docs(sim): log and Status for the badge-pill lane (P-2026-09-28-0140)
- `67659beb4` fix(sim): panel badge and dialog pill share one verdict (P-2026-09-28-0140)
- `b08201f27` docs(sim): discovery badge vs pill (P-2026-09-28-0140)
- `0e1454831` docs: add prompt P-2026-09-28-0140, panel badge and dialog pill share one verdict

The trunk carries, since the base, 91 commits:

- `cf39cdbcb` docs: Status flip and log entry for the demo-prep merge (P-2026-09-28-1236)
- `8ed55759d` docs: Status flip and log entry for the harness-trace merge (P-2026-09-28-1324)
- `eae2cf8bb` docs: Status flip and log entry for the simulation-engine merge (P-2026-09-28-1300)
- `c4bb0e0af` merge: harness-trace into alfonso-frontend-jjtl (P-2026-09-28-1324)
- `4e611dc16` docs: add prompt P-2026-09-28-1324, merge harness-trace into alfonso-frontend-jjtl
- `3e141466d` merge: simulation-engine into alfonso-frontend-jjtl (P-2026-09-28-1300)
- `8609ec3e0` docs: add prompt P-2026-09-28-1300, merge simulation-engine into alfonso-frontend-jjtl
- `e2448cf61` docs: restore two log entries spliced by the staging merge 447e4239b
- `559eb82c5` docs: rotate the prompt log at 40 (RC-12)
- `63a80f62b` merge: demo-prep into alfonso-frontend-jjtl (P-2026-09-28-1236)
- `5038c7cd2` docs: flip Status of P-2026-09-27-1030, trace monitor discovery (P-2026-09-27-1030)
- `a51973abf` docs: add prompt P-2026-09-28-1236, merge demo-prep into alfonso-frontend-jjtl
- `55c24d570` docs: session checkpoint 2026-09-28 (second, handover to a new chat)
- `65eb5475b` docs: the log Outcome field is not the RC-20 closing line (P-2026-09-28-1120)
- `f6f438495` docs: discovery on the lane-run Outcome parser and Outcome: completed (P-2026-09-28-1120)
- `e913101fb` docs: close P-2026-09-28-1015, four demo projects exported (P-2026-09-28-1015)
- `9a95c484c` docs: discovery, 3001 demo prep cannot write into Alfonso's own instance (P-2026-09-28-1015)
- `1a3425531` docs: add prompt P-2026-09-28-1015, prepare the four demo projects on 3001
- `447e4239b` Merge branch 'staging' into alfonso-frontend-jjtl
- `888ea9a9d` docs: session checkpoint 2026-09-28 (night AUTO MODE run)
- `06d0956ca` docs: Status flip for the harness-lane-efficiency merge (P-2026-09-28-0252)
- `bf0e2f3a2` merge: harness-lane-efficiency into alfonso-frontend-jjtl (P-2026-09-28-0252)
- `5aa713a5c` docs: add prompt P-2026-09-28-0252, merge harness-lane-efficiency into alfonso-frontend-jjtl
- `49cafa191` docs: Status flip for the sim-decision-probe merge (P-2026-09-28-0240)
- `3b6f6f491` merge: sim-decision-probe into alfonso-frontend-jjtl (P-2026-09-28-0240)
- `86b06f039` docs: add prompt P-2026-09-28-0240, merge sim-decision-probe into alfonso-frontend-jjtl
- `5c062b72f` docs: Status flip for the freeze-readiness merge (P-2026-09-28-0227)
- `d68c0e761` merge: freeze-readiness into alfonso-frontend-jjtl (P-2026-09-28-0227)
- `cbc063850` docs: add prompt P-2026-09-28-0227, merge freeze-readiness into alfonso-frontend-jjtl
- `6f81de7b9` docs: Status flip for the sim-bridge-off-else merge (P-2026-09-28-0209)
- `56134751e` merge: sim-bridge-off-else into alfonso-frontend-jjtl (P-2026-09-28-0209)
- `1faba92b8` docs: add prompt P-2026-09-28-0209, merge sim-bridge-off-else into alfonso-frontend-jjtl
- `3720df681` docs: Status flip for the small-cleanups merge (P-2026-09-28-0149)
- `43113104b` merge: small-cleanups into alfonso-frontend-jjtl (P-2026-09-28-0149)
- `ffd284bc0` docs: add prompt P-2026-09-28-0149, merge small-cleanups into alfonso-frontend-jjtl
- `2511c3fff` docs: Status flip for the demo-polish merge (P-2026-09-28-0130)
- `32aafe1c6` docs: close the lane efficiency lane (P-2026-09-27-2330)
- `0bdfa1f94` docs: P16 lane-run v3, HARNESS-DOCS 1.7, RC-32 model by activity (P-2026-09-27-2330)
- `c9b506d9f` feat(harness): lane-run status flags a report brief over 40 lines (P-2026-09-27-2330)
- `6045ebc82` docs: R-SIM-86, log entry, Status for roles off and else (P-2026-09-28-0100)
- and 51 more: `git log --oneline d861cc922..cf39cdbcb`

Measured by `lane-run merge` at 2026-09-28 14:23, trunk at `cf39cdbcb`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl c111dd403`: 1 conflict: `docs/log-inbox/simulation.md`.
- Files changed since the base: 11 on the branch side, 70 on the trunk side; on both sides: `docs/log-inbox/simulation.md`.
- `git diff --name-only d861cc922 c111dd403 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-09-28_0140_prompt_sim_badge_pill.md` (eseguito 2026-09-28 · lane sim-badge-pill · 67659beb4 · verifica visiva passata 2026-09-28 (Alfonso, crops ~/.jjodel-lanes/shots_badge/warn_after/)).
- `git worktree list`: `sim-badge-pill` in `/Users/alfonso/jjodel-w-badge`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-09-28-1423/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `c111dd403` is the tip of `sim-badge-pill`; the prompt files of the branch read `Status: eseguito` at `c111dd403`; `git worktree list` shows `sim-badge-pill` only in `/Users/alfonso/jjodel-w-badge`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl c111dd403` (measured above: 1 conflict: `docs/log-inbox/simulation.md`). `git diff --name-only d861cc922 c111dd403 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only d861cc922 alfonso-frontend-jjtl` with `git diff --name-only d861cc922 c111dd403` (measured above: `docs/log-inbox/simulation.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `RC-32` (trunk), `R-SIM-85` (trunk), `R-SIM-86` (trunk); control: `- **R-SIM-87**` none.
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-28 — fix: panel badge and dialog pill share one verdict (P-2026-09-28-0140)` once (branch).
   - `docs/decisions.md`: the heading `### Decisione 2026-09-28: the model follows the activity (RC-32)` once (trunk).
   - `docs/decisions.md`: the heading `### Decisioni 2026-09-28: il run salta i ruoli off (R-SIM-86)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-09-28 — fix: bordr line, probe theme helper, R-SIM-85 header (P-2026-09-28-0055)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-09-28 — feat: lane-run direct merges, one closure commit, chains, model tier, report briefs (P-2026-09-27-2330)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-09-28 — ticket: HARNESS-DOCS §4.2 and the discovery-report skill do not state the brief rule` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-09-28 — ticket: the log-entry skill commits the inbox alone, against the one closure commit` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-09-28 — ticket: docs:digest stops on the wrapped header of R-SIM-85` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-09-28 — ticket: a prose condition in a branch prompt is invisible to merge --direct` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-09-28 — merge: harness-trace into alfonso-frontend-jjtl (P-2026-09-28-1324)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-28 — fix: roles that are off are skipped by the run; else with no sibling waits for Alfonso (P-2026-09-28-0100)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-28 — task: the four demo projects built headless and exported for Alfonso's own Import (P-2026-09-28-1015)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-27 — discovery: the simulator backlog cut into parallel lanes (P-2026-09-27-1625)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-28 — merge: simulation-engine into alfonso-frontend-jjtl (P-2026-09-28-1300)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-28 — merge: demo-prep into alfonso-frontend-jjtl (P-2026-09-28-1236)` once (trunk).
4. `git merge --no-ff --no-commit c111dd403`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: sim-badge-pill into alfonso-frontend-jjtl (P-2026-09-28-1423)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `c111dd403` in `/Users/alfonso/jjodel-w-badge`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/simulation.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the sim-badge-pill merge (P-2026-09-28-1423)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-badge`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
