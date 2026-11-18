# Prompt: merge jjtl-collection-jjel-only into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-03-1053
Chat: C-2026-11-02-1319
Request: https://claude.ai/code/session_01DQt9R4VAKm7quiJen8TK1D (merge of jjtl-collection-jjel-only launched by chat C-2026-11-02-1319)
Lane: full (merge; 1 conflict: `docs/log-inbox/maintenance.md` measured)
Status: eseguito 2026-11-03 · merge d8773e4cd (direct, docs only) · worker blocked on one load-sensitive test, closed by the chat

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-03-1053 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `4fada5b42`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `jjtl-collection-jjel-only` into the trunk with one merge commit, `--no-ff`, of the explicit sha `3ff702d7a`, in the shape of `16c38c9e0` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `6b4f96183`. The branch carries, on top of the base, 3 commits:

- `3ff702d7a` docs: Status flip and log entry, Phase 1 only (P-2026-11-03-1016)
- `1300be2cc` docs: discovery, JjTL forall collection under JjEL only (P-2026-11-03-1016)
- `9ee5da178` docs: add prompt P-2026-11-03-1016, JjTL collection parsed by JjEL only

The trunk carries, since the base, 17 commits:

- `4fada5b42` docs: Status flip and log entry for the jjscript-forall-summary merge (P-2026-11-03-1041)
- `16c38c9e0` merge: jjscript-forall-summary into alfonso-frontend-jjtl (P-2026-11-03-1041)
- `79241bb32` docs: add prompt P-2026-11-03-1041, merge jjscript-forall-summary into alfonso-frontend-jjtl
- `7fd560341` docs: correct the shas in the Status of P-2026-11-03-1015
- `fa9e886cb` docs: R-TXT-31, add prompt P-2026-11-03-1045, textual refs outside the text
- `4b9d3d0f3` docs: Status flip of P-2026-11-03-1015
- `c5b3e30ff` docs: add prompt P-2026-11-03-1028, merge jjtl-writeback-time into alfonso-frontend-jjtl
- `d04a598b6` merge: jjtl-writeback-time into alfonso-frontend-jjtl (P-2026-11-03-1021)
- `e1660eff3` docs: add prompt P-2026-11-03-1021, merge jjtl-writeback-time into alfonso-frontend-jjtl
- `53731ec92` docs: log entry for the forall summary and Info package fixes (P-2026-11-03-1015)
- `72d1b3cf2` fix(editors): Info.tsx passes DPackage.new the type of its father (P-2026-11-03-1015)
- `9373d1fa7` fix(jjscript): forall summary counts the leaf commands of nested foralls (P-2026-11-03-1015)
- `53d543df6` docs: ticket 5,119 attribute race, log entry, Status flips (P-2026-11-03-1014)
- `f88a79bd8` docs(discovery): where the JjTL write-back time goes (P-2026-11-03-1014)
- `e3fedc41f` docs: add prompt P-2026-11-03-1015, forall summary and Info package
- `f986a1ff4` docs: add prompt P-2026-11-03-1014, report on the JjTL write-back time
- `eb452ec79` docs: add prompt P-2026-11-03-0703, measure the JjTL write-back time

Measured by `lane-run merge` at 2026-11-03 10:53, trunk at `4fada5b42`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 3ff702d7a`: 1 conflict: `docs/log-inbox/maintenance.md`.
- Files changed since the base: 3 on the branch side, 14 on the trunk side; on both sides: `docs/log-inbox/maintenance.md`.
- `git diff --name-only 6b4f96183 3ff702d7a -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-03_1016_prompt_jjtl_collection_jjel_only.md` (eseguito 2026-11-03 · lane jjtl-collection-jjel-only · branch jjtl-collection-jjel-only · 1300be2cc (Phase 1; Phase 2 not started, question to the chat)).
- `git worktree list`: `jjtl-collection-jjel-only` in `/Users/alfonso/jjodel-w-jjtlonly`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-11-03-1053/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `3ff702d7a` is the tip of `jjtl-collection-jjel-only`; the prompt files of the branch read `Status: eseguito` at `3ff702d7a`; `git worktree list` shows `jjtl-collection-jjel-only` only in `/Users/alfonso/jjodel-w-jjtlonly`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 3ff702d7a` (measured above: 1 conflict: `docs/log-inbox/maintenance.md`). `git diff --name-only 6b4f96183 3ff702d7a -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 6b4f96183 alfonso-frontend-jjtl` with `git diff --name-only 6b4f96183 3ff702d7a` (measured above: `docs/log-inbox/maintenance.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-TXT-31` (trunk); control: `- **R-TXT-32**` none.
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-11-03 — discovery: JjTL forall collection under JjEL only, stopped before Phase 2 (P-2026-11-03-1016)` once (branch).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-03 — ticket: JjTL nested-attribute write can run before the last commit and silently drop num at 5,119 objects` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-03 — discovery: where the JjTL write-back time goes (P-2026-11-03-1014)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-11-03 — fix(jjscript): forall summary counts leaf commands; Info.tsx package fatherType (P-2026-11-03-1015)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-11-03 — merge: jjscript-forall-summary into alfonso-frontend-jjtl (P-2026-11-03-1041)` once (trunk).
4. `git merge --no-ff --no-commit 3ff702d7a`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: jjtl-collection-jjel-only into alfonso-frontend-jjtl (P-2026-11-03-1053)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `3ff702d7a` in `/Users/alfonso/jjodel-w-jjtlonly`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-jjtlonly`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 4fada5b42` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only 4fada5b42 HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/maintenance.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the jjtl-collection-jjel-only merge (P-2026-11-03-1053)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-jjtlonly`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
