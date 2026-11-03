# Prompt: merge textual-refs-outside into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-03-1207
Chat: C-2026-11-03-1037
Request: https://claude.ai/code/session_01DQt9R5nh3m4Y234MPGL9kH (merge of textual-refs-outside launched by chat C-2026-11-03-1037)
Lane: full (merge; zero conflicts measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-03-1207 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `7690502cb`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `textual-refs-outside` into the trunk with one merge commit, `--no-ff`, of the explicit sha `b8712daa6`, in the shape of `e226a7625` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `fa9e886cb`. The branch carries, on top of the base, 5 commits:

- `b8712daa6` docs: Status flips and log entry for textual refs outside the text (P-2026-11-03-1141)
- `aef4c28c8` docs: add prompt P-2026-11-03-1141, in-app acceptance of textual refs
- `5a9ce5ec4` feat(codegen): references outside the text print as @"id" (P-2026-11-03-1045)
- `071a83e47` docs: discovery, textual references outside the text (P-2026-11-03-1045)
- `167c8d0dd` test(codegen): expected-fail on a reference outside the text (P-2026-11-03-1045)

The trunk carries, since the base, 26 commits:

- `7690502cb` docs: R-TXT-32 ratified by Alfonso
- `677fab23a` docs: Status flip and log entry for the jjtl-collection-jjel-only merge (P-2026-11-03-1148)
- `e226a7625` merge: jjtl-collection-jjel-only into alfonso-frontend-jjtl (P-2026-11-03-1148)
- `015fcf9d2` docs: add prompt P-2026-11-03-1148, merge jjtl-collection-jjel-only into alfonso-frontend-jjtl
- `03967006a` docs: Status flip and log entry for the failing-builtin lane (P-2026-11-03-1135)
- `9afbe4376` fix(jjtl): failing builtin is an error; JjEL-only forall collection (P-2026-11-03-1135)
- `3f8faebce` docs: add prompt P-2026-11-03-1135, JjTL failing builtin and JjEL collection
- `9e72593b7` docs: R-FA-11, a failing builtin in JjTL is an error
- `4ce9c67b3` docs: Status flip and log entry for the jjtl-collection-jjel-only merge (P-2026-11-03-1053)
- `8dada64f1` docs: mark P-2026-11-03-1028 as a duplicate merge, never applied
- `bff0064e3` docs: Status flip and log entry for the jjtl-writeback-time merge (P-2026-11-03-1021)
- `7f40f65af` docs: R-TXT-32 provisional, references outside the text
- `d8773e4cd` merge: jjtl-collection-jjel-only into alfonso-frontend-jjtl (P-2026-11-03-1053)
- `f1a6d9ea3` docs: add prompt P-2026-11-03-1053, merge jjtl-collection-jjel-only into alfonso-frontend-jjtl
- `4fada5b42` docs: Status flip and log entry for the jjscript-forall-summary merge (P-2026-11-03-1041)
- `16c38c9e0` merge: jjscript-forall-summary into alfonso-frontend-jjtl (P-2026-11-03-1041)
- `79241bb32` docs: add prompt P-2026-11-03-1041, merge jjscript-forall-summary into alfonso-frontend-jjtl
- `7fd560341` docs: correct the shas in the Status of P-2026-11-03-1015
- `4b9d3d0f3` docs: Status flip of P-2026-11-03-1015
- `53731ec92` docs: log entry for the forall summary and Info package fixes (P-2026-11-03-1015)
- `72d1b3cf2` fix(editors): Info.tsx passes DPackage.new the type of its father (P-2026-11-03-1015)
- `3ff702d7a` docs: Status flip and log entry, Phase 1 only (P-2026-11-03-1016)
- `9373d1fa7` fix(jjscript): forall summary counts the leaf commands of nested foralls (P-2026-11-03-1015)
- `1300be2cc` docs: discovery, JjTL forall collection under JjEL only (P-2026-11-03-1016)
- `e3fedc41f` docs: add prompt P-2026-11-03-1015, forall summary and Info package
- `9ee5da178` docs: add prompt P-2026-11-03-1016, JjTL collection parsed by JjEL only

Measured by `lane-run merge` at 2026-11-03 12:07, trunk at `7690502cb`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl b8712daa6`: zero conflicts.
- Files changed since the base: 13 on the branch side, 20 on the trunk side; on both sides: none.
- `git diff --name-only fa9e886cb b8712daa6 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-03_1141_prompt_textual_refs_acceptance.md` (eseguito 2026-11-03 · lane fast · 5a9ce5ec4 (no code in this lane) · verifica visiva passata 2026-11-03 (chat, RC-23, crops in ~/.jjodel-lanes/P-2026-11-03-1141/; R-TXT-32 ratified by Alfonso)).
- `git worktree list`: `textual-refs-outside` in `/Users/alfonso/jjodel-w-textrefs`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-11-03-1207/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `b8712daa6` is the tip of `textual-refs-outside`; the prompt files of the branch read `Status: eseguito` at `b8712daa6`; `git worktree list` shows `textual-refs-outside` only in `/Users/alfonso/jjodel-w-textrefs`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl b8712daa6` (measured above: zero conflicts). `git diff --name-only fa9e886cb b8712daa6 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only fa9e886cb alfonso-frontend-jjtl` with `git diff --name-only fa9e886cb b8712daa6` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-TXT-32` (trunk); control: `- **R-TXT-33**` none.
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-03 — test(codegen): in-app acceptance of references outside the text (P-2026-11-03-1141)` once (branch).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-03 — merge: jjtl-writeback-time into alfonso-frontend-jjtl (P-2026-11-03-1021)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-11-03 — fix(jjscript): forall summary counts leaf commands; Info.tsx package fatherType (P-2026-11-03-1015)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-11-03 — merge: jjscript-forall-summary into alfonso-frontend-jjtl (P-2026-11-03-1041)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-11-03 — discovery: JjTL forall collection under JjEL only, stopped before Phase 2 (P-2026-11-03-1016)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-11-03 — merge: jjtl-collection-jjel-only into alfonso-frontend-jjtl (P-2026-11-03-1053)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-11-03 — fix(jjtl): a failing builtin is an error on both paths; JjEL alone parses a forall collection (P-2026-11-03-1135)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-11-03 — merge: jjtl-collection-jjel-only into alfonso-frontend-jjtl (P-2026-11-03-1148)` once (trunk).
4. `git merge --no-ff --no-commit b8712daa6`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: textual-refs-outside into alfonso-frontend-jjtl (P-2026-11-03-1207)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `b8712daa6` in `/Users/alfonso/jjodel-w-textrefs`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-textrefs`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 7690502cb` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only 7690502cb HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/codegen.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the textual-refs-outside merge (P-2026-11-03-1207)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-textrefs`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
