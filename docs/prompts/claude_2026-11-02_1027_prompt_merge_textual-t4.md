# Prompt: merge textual-t4 into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-02-1027
Chat: —
Request: none (rendered by lane-run, no chat URL known for no --chat)
Lane: full (merge; 1 conflict: `docs/log-inbox/codegen.md` measured)
Status: eseguito 2026-11-02 · merge c41033a9a (direct, union of docs/log-inbox/codegen.md) · verifica visiva non applicabile

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-02-1027 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `7dc62b88f`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `textual-t4` into the trunk with one merge commit, `--no-ff`, of the explicit sha `3cf861948`, in the shape of `e684fef6c` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `47c975ec2`. The branch carries, on top of the base, 4 commits:

- `3cf861948` docs: close T4a-1, log entry and Status flips (P-2026-11-02-1016)
- `5467088b7` feat(codegen): textual syntax annotations, grammar part (P-2026-11-02-0846)
- `a9f0b0d5f` docs: add prompt P-2026-11-02-1016, close T4a-1 (RC-51)
- `e9e4fcd69` docs: add prompt P-2026-11-02-0955, implement T4a-1 (RC-51)

The trunk carries, since the base, 15 commits:

- `7dc62b88f` docs: R-TXT-27 (mnemonic mandatory in the prototype, one-line classes need a mandatory name)
- `5ed88f308` docs: merge flip (P-2026-11-02-0943) and morning section of the session checkpoint
- `e684fef6c` merge: lazy-gate-guards into alfonso-frontend-jjtl (P-2026-11-02-0943)
- `d0805ec12` docs: add prompt P-2026-11-02-0943, merge lazy-gate-guards into alfonso-frontend-jjtl
- `39e5014bc` docs: Status flip and log entry for the jjscript-set-lists merge (P-2026-11-02-0931)
- `a53423995` merge: jjscript-set-lists into alfonso-frontend-jjtl (P-2026-11-02-0931)
- `04a468341` docs: add prompt P-2026-11-02-0931, merge jjscript-set-lists into alfonso-frontend-jjtl
- `c4f1048a2` docs: Status flip and log entry, jjscript-set-lists took the trunk (P-2026-11-02-0855)
- `70e93a9cc` docs: log entry and Status flip for P-2026-11-02-0845
- `3f84dfbd1` fix(codegen): guard codegen imports for the lazy gate (P-2026-11-02-0845)
- `fb57b19f1` merge: jjscript-set-lists takes alfonso-frontend-jjtl (P-2026-11-02-0855)
- `315984f98` docs: add prompt P-2026-11-02-0855, merge alfonso-frontend-jjtl into jjscript-set-lists
- `fa528874a` docs: log entry and Status flip for set lists and enum literals (P-2026-11-02-0651)
- `084eb0902` feat(codegen): model lines write lists and literals (P-2026-11-02-0651)
- `36a5387f6` feat(jjscript): set lists and enum literals (P-2026-11-02-0651)

Measured by `lane-run merge` at 2026-11-02 10:27, trunk at `7dc62b88f`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 3cf861948`: 1 conflict: `docs/log-inbox/codegen.md`.
- Files changed since the base: 11 on the branch side, 20 on the trunk side; on both sides: `docs/log-inbox/codegen.md`.
- `git diff --name-only 47c975ec2 3cf861948 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-02_0955_prompt_textual_t4a1_impl.md` (eseguito 2026-11-02 · hard-stop at the context ceiling (RC-51), closed by P-2026-11-02-1016 · commit 5467088b7), `claude_2026-11-02_1016_prompt_textual_t4a1_close.md` (eseguito 2026-11-02 · commit 5467088b7 · verifica visiva non applicabile).
- `git worktree list`: `textual-t4` in `/Users/alfonso/jjodel-w-textt4`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-11-02-1027/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `3cf861948` is the tip of `textual-t4`; the prompt files of the branch read `Status: eseguito` at `3cf861948`; `git worktree list` shows `textual-t4` only in `/Users/alfonso/jjodel-w-textt4`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 3cf861948` (measured above: 1 conflict: `docs/log-inbox/codegen.md`). `git diff --name-only 47c975ec2 3cf861948 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 47c975ec2 alfonso-frontend-jjtl` with `git diff --name-only 47c975ec2 3cf861948` (measured above: `docs/log-inbox/codegen.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-TXT-27` (trunk); control: `- **R-TXT-28**` none.
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-02 — feat(codegen): textual syntax annotations, grammar part (P-2026-11-02-0955, P-2026-11-02-1016)` once (branch).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-02 — feat(jjscript): set lists and enum literals (P-2026-11-02-0651)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-02 — merge: jjscript-set-lists takes alfonso-frontend-jjtl (P-2026-11-02-0855)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-02 — merge: jjscript-set-lists into alfonso-frontend-jjtl (P-2026-11-02-0931)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-02 — fix(codegen): guard codegen imports for the lazy gate (P-2026-11-02-0845)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-02 — merge: lazy-gate-guards into alfonso-frontend-jjtl (P-2026-11-02-0943)` once (trunk).
4. `git merge --no-ff --no-commit 3cf861948`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: textual-t4 into alfonso-frontend-jjtl (P-2026-11-02-1027)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `3cf861948` in `/Users/alfonso/jjodel-w-textt4`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-textt4`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 7dc62b88f` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only 7dc62b88f HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/codegen.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the textual-t4 merge (P-2026-11-02-1027)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-textt4`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
