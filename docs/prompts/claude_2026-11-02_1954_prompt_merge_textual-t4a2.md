# Prompt: merge textual-t4a2 into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-02-1954
Chat: C-2026-11-02-1814
Request: https://claude.ai/code/session_01DQt9R3WnXdpNFMb7LmpgdD (merge of textual-t4a2 launched by chat C-2026-11-02-1814)
Lane: full (merge; zero conflicts measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-02-1954 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `e415cb932`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `textual-t4a2` into the trunk with one merge commit, `--no-ff`, of the explicit sha `718c11374`, in the shape of `8f14055bf` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `e5ad232c4`. The branch carries, on top of the base, 3 commits:

- `718c11374` docs: close T4a-2, Status flips and log entry (P-2026-11-02-1930)
- `bb620d93c` feat(codegen): store textual syntax annotations, show the language name (P-2026-11-02-1830)
- `e6bc99860` docs: add prompt P-2026-11-02-1930, close T4a-2 (RC-51)

The trunk carries, since the base, 21 commits:

- `e415cb932` docs: add prompt P-2026-11-02-1942, measure the textual notation for template models
- `e522cd48a` docs: tickets from the A0 probe (P-2026-11-02-1838)
- `f2be6cab2` docs: checkpoint of chat C-2026-11-02-1541, JjTL generic transformation
- `91d93fdb1` docs: Status flip and log entry for jjtl-generic-transformation merge (P-2026-11-02-1905)
- `a296fefcb` docs: R-FA ratified by Alfonso
- `8f14055bf` merge: jjtl-generic-transformation into alfonso-frontend-jjtl (P-2026-11-02-1905)
- `27398633c` docs: add prompt P-2026-11-02-1905, merge jjtl-generic-transformation into alfonso-frontend-jjtl
- `88dd98234` docs: R-JTG-6 and R-JTG-7 registered, log entry and status (P-2026-11-02-1838)
- `95c8c00dd` docs(jjtl): SPEC 5.3.2, the Open block becomes R-JTG-6 and R-JTG-7 (P-2026-11-02-1838)
- `083844b19` docs: add prompt P-2026-11-02-1838, A0 rulings and write-back probe
- `fc7b4b20c` docs: log entry, ticket and status for A0 (P-2026-11-02-1742)
- `aaf103671` docs: R-JTG-1..5 registered, answer in brief added to the JjTL report (P-2026-11-02-1742)
- `73f4655fe` docs(jjtl): SPEC 5.3 rewritten, gaps 1 and 5 updated (P-2026-11-02-1742)
- `39202fe67` feat(jjtl): report the three silent resolution fallbacks (P-2026-11-02-1742)
- `a43408ca2` feat(jjtl): bind resolved targets by identity, not by copy (P-2026-11-02-1742)
- `49c762328` docs: log entry and status for A0, stopped at the step 2 inventory (P-2026-11-02-1742)
- `d2e2c8574` test(jjtl): confirm a resolved target is copied on bind (P-2026-11-02-1742)
- `a1c40416b` docs: add prompt P-2026-11-02-1742, JjTL A0 bind by identity
- `a1ba9a2b4` Merge branch 'alfonso-frontend-jjtl' into jjtl-generic-transformation
- `79e532bb3` docs(discovery): JjTL generic transformation, Phase 1 (P-2026-11-02-1612)
- `e95485d0f` docs: add prompt P-2026-11-02-1612, write the JjTL generic transformation report

Measured by `lane-run merge` at 2026-11-02 19:54, trunk at `e415cb932`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 718c11374`: zero conflicts.
- Files changed since the base: 12 on the branch side, 17 on the trunk side; on both sides: none.
- `git diff --name-only e5ad232c4 718c11374 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-02_1930_prompt_textual_t4a2_close.md` (eseguito 2026-11-02 · lane fast · bb620d93c · verifica visiva passata 2026-11-02 (chat, unattended)).
- `git worktree list`: `textual-t4a2` in `/Users/alfonso/jjodel-w-textt4a2`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-11-02-1954/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `718c11374` is the tip of `textual-t4a2`; the prompt files of the branch read `Status: eseguito` at `718c11374`; `git worktree list` shows `textual-t4a2` only in `/Users/alfonso/jjodel-w-textt4a2`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 718c11374` (measured above: zero conflicts). `git diff --name-only e5ad232c4 718c11374 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only e5ad232c4 alfonso-frontend-jjtl` with `git diff --name-only e5ad232c4 718c11374` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-02 — feat(codegen): textual syntax annotations stored, language name shown (P-2026-11-02-1830, P-2026-11-02-1930)` once (branch).
   - `docs/decisions.md`: the heading `## R-JTG: one generic JjTL transformation, the order and frame of parts A to D (decisions 2026-11-02)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-02 — docs(jjtl): R-JTG-6 and R-JTG-7 registered, A0 write-back exercised in the running app (P-2026-11-02-1838)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-02 — feat(jjtl): A0, resolved targets bound by identity, fallbacks reported, SPEC 5.3, R-JTG (P-2026-11-02-1742)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-02 — ticket: two JjTL executor tests fail once the joiner import is mocked` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-02 — test(jjtl): A0 step 1, copy on bind confirmed; stopped at the step 2 inventory (P-2026-11-02-1742)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-02 — discovery: JjTL generic transformation, Phase 1 report (P-2026-11-02-1425, P-2026-11-02-1612)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-02 — merge: jjtl-generic-transformation into alfonso-frontend-jjtl (P-2026-11-02-1905)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-02 — ticket: JjTL nested creation drops name on a class without a declared name attribute` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-02 — ticket: JjTL re-run in the same tab executes a stale AST` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-02 — ticket: init_dash page error in the JjTL probe, untraced` once (trunk).
4. `git merge --no-ff --no-commit 718c11374`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: textual-t4a2 into alfonso-frontend-jjtl (P-2026-11-02-1954)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `718c11374` in `/Users/alfonso/jjodel-w-textt4a2`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-textt4a2`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard e415cb932` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only e415cb932 HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/codegen.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the textual-t4a2 merge (P-2026-11-02-1954)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-textt4a2`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
