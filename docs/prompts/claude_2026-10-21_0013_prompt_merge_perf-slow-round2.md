# Prompt: merge perf-slow-round2 into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-21-0013
Chat: —
Request: none (rendered by lane-run, no chat URL known for no --chat)
Lane: full (merge; zero conflicts measured)
Status: eseguito 2026-10-21 · lane merge · 5c462acac · verifica visiva passata 2026-10-21 (docs and probe only, no product code; merge gates green)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-21-0013 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `37b4150b8`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `perf-slow-round2` into the trunk with one merge commit, `--no-ff`, of the explicit sha `e9bc60d16`, in the shape of `2aa86bb19` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `fb35595fa`. The branch carries, on top of the base, 2 commits:

- `e9bc60d16` docs: large-model slowness round 2 discovery report (P-2026-10-20-2305)
- `08963f451` chore(probe): interaction steps, LModel.name counter, save bench (P-2026-10-20-2305)

The trunk carries, since the base, 16 commits:

- `37b4150b8` docs: Status flip and log entry for the jjel-bitvector merge (P-2026-10-21-0002)
- `2aa86bb19` merge: jjel-bitvector into alfonso-frontend-jjtl (P-2026-10-21-0002)
- `57443ad50` docs: add prompt P-2026-10-21-0002, merge jjel-bitvector into alfonso-frontend-jjtl
- `0e8d7e31a` docs: close JjEL bit-vector S1, R-BV-1..6 amended (P-2026-10-20-2350)
- `de0ce082c` feat(jjel): bit-vector values in the evaluator (P-2026-10-20-2331)
- `182fbb7e7` docs: prompt P-2026-10-20-2350 (S1 closure after the context ceiling)
- `ba083c6b9` merge: oi-s1 into alfonso-frontend-jjtl (P-2026-10-20-2010)
- `cfa2ba0bf` docs: R-BV-7 header parses (reversible: trunk)
- `ed49038fb` docs: R-BV-7 header in the register vocabulary; P-2026-10-20-2331 asks for verified: none
- `24675cb93` docs: prompt P-2026-10-20-2330 renamed P-2026-10-20-2331 (ID collision)
- `2ab464150` docs: R-BV-7, R-REL-2, prompt P-2026-10-20-2330
- `e4d3348fc` docs: prompt P-2026-10-20-2330, Status of P-2026-10-20-2005 and -2010
- `b88ec7927` docs: log entry for S1 binding codec, reader and check (P-2026-10-20-2010)
- `73d68cea6` feat(onto): conformance in the binding reader (P-2026-10-20-2010)
- `319b16865` docs: discovery of JjEL bit-vector values (P-2026-10-20-2055)
- `bd633a5e0` feat(onto): binding codec, reader and check (P-2026-10-20-2010)

Measured by `lane-run merge` at 2026-10-21 00:13, trunk at `37b4150b8`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl e9bc60d16`: zero conflicts.
- Files changed since the base: 2 on the branch side, 25 on the trunk side; on both sides: none.
- `git diff --name-only fb35595fa e9bc60d16 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: none.
- `git worktree list`: `perf-slow-round2` in `/Users/alfonso/jjodel-w-perfslow`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-10-21-0013/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `e9bc60d16` is the tip of `perf-slow-round2`; the prompt files of the branch read `Status: eseguito` at `e9bc60d16`; `git worktree list` shows `perf-slow-round2` only in `/Users/alfonso/jjodel-w-perfslow`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl e9bc60d16` (measured above: zero conflicts). `git diff --name-only fb35595fa e9bc60d16 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only fb35595fa alfonso-frontend-jjtl` with `git diff --name-only fb35595fa e9bc60d16` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-REL-2` (trunk), `R-BV-1` (trunk), `R-BV-2` (trunk), `R-BV-3` (trunk), `R-BV-4` (trunk), `R-BV-5` (trunk), `R-BV-6` (trunk), `R-BV-7` (trunk); control: `- **R-BV-8**` none.
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-10-20 — feat: S1 binding codec, reader and check (P-2026-10-20-2010)` once (trunk).
   - `docs/log-inbox/jjel-bitvector.md`: the heading `## 2026-10-20 — feat: JjEL bit-vector values, discovery and slice S1` once (trunk).
   - `docs/log-inbox/jjel-bitvector.md`: the heading `## 2026-10-21 — merge: jjel-bitvector into alfonso-frontend-jjtl (P-2026-10-21-0002)` once (trunk).
4. `git merge --no-ff --no-commit e9bc60d16`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: perf-slow-round2 into alfonso-frontend-jjtl (P-2026-10-21-0013)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `e9bc60d16` in `/Users/alfonso/jjodel-w-perfslow`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-perfslow`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 37b4150b8` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only 37b4150b8 HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of the `docs/log-inbox/` file of this branch's front (the branch adds headings to none), both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the perf-slow-round2 merge (P-2026-10-21-0013)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-perfslow`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
