# Prompt: merge textual-t2 into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-02-0637
Chat: —
Request: none (rendered by lane-run, no chat URL known for no --chat)
Lane: full (merge; 1 conflict: `docs/log-inbox/codegen.md` measured)
Status: eseguito 2026-11-02 · merge aa68ad049 (direct, union of docs/log-inbox/codegen.md) · verifica visiva: crops of P-2026-11-02-0057 and P-2026-11-02-0235 checked by the chat, unattended

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-02-0637 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `a29347b82`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `textual-t2` into the trunk with one merge commit, `--no-ff`, of the explicit sha `d6c5dca73`, in the shape of `3008d69b5` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `eef5351e7`. The branch carries, on top of the base, 12 commits:

- `d6c5dca73` docs: log entry and Status flips for textual T2c (P-2026-11-02-0235)
- `edf047bf3` feat(ui): New model from text (P-2026-11-02-0045)
- `5eb956681` docs: add prompt P-2026-11-02-0235, close textual T2c (RC-51)
- `ca5bc3d8d` docs: add prompt P-2026-11-02-0045, textual T2c New model from text (RC-52)
- `1560dca54` docs: log entry and Status flips for textual T2b (P-2026-11-02-0057)
- `7bd41e3cf` feat(ui): textual entry and read-only Text tab (P-2026-11-02-0040)
- `7533373b7` docs: add prompt P-2026-11-02-0057, close textual T2b (RC-51)
- `252dad72c` docs: add prompt P-2026-11-02-0040, textual T2b entry and read-only tab (RC-52)
- `1de092f11` docs: log entry and Status flips for the textual parser (P-2026-11-02-0024)
- `45c883e92` feat(codegen): textual parser with recovery (P-2026-11-02-0024)
- `6ebf7ea41` docs: renumber the T2a prompt to P-2026-11-02-0024 (0020 taken by another lane)
- `2004ea1d8` docs: add prompt P-2026-11-02-0020, textual T2a parser (RC-51, RC-52)

The trunk carries, since the base, 11 commits:

- `a29347b82` docs: ticket on the empty viewport at model open
- `f93a97253` docs: Status flip and log entry for the textual-t3 merge (P-2026-11-02-0027)
- `3008d69b5` merge: textual-t3 into alfonso-frontend-jjtl (P-2026-11-02-0027)
- `7195d93e3` docs: add prompt P-2026-11-02-0027, merge textual-t3 into alfonso-frontend-jjtl
- `3b87b4ecd` docs: log entry and Status flip for the textual style checks (P-2026-11-01-2356)
- `7731968ab` feat(codegen): textual style checks (P-2026-11-01-2356)
- `6eed25e95` docs: Status flip and log entry for the jjel-default-literal merge (P-2026-11-02-0007)
- `4383c2572` merge: jjel-default-literal into alfonso-frontend-jjtl (P-2026-11-02-0007)
- `a75ea2e9f` docs: add prompt P-2026-11-02-0007, merge jjel-default-literal into alfonso-frontend-jjtl
- `1e5a8ff90` docs: log entry and Status flip for the JjEL default literal fix (P-2026-11-01-2350)
- `59fb7c389` fix(jjel): unset attributes read their declared default literal (P-2026-11-01-2350)

Measured by `lane-run merge` at 2026-11-02 06:37, trunk at `a29347b82`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl d6c5dca73`: 1 conflict: `docs/log-inbox/codegen.md`.
- Files changed since the base: 20 on the branch side, 11 on the trunk side; on both sides: `docs/log-inbox/codegen.md`.
- `git diff --name-only eef5351e7 d6c5dca73 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-02_0024_prompt_textual_t2a_parser.md` (eseguito 2026-11-02 · lane textual-t2 · 45c883e92 · verifica visiva non applicabile (nessuna UI)), `claude_2026-11-02_0040_prompt_textual_t2b_entry_tab.md` (eseguito 2026-11-02 · hard-stop, closed by P-2026-11-02-0057), `claude_2026-11-02_0045_prompt_textual_t2c_new_model.md` (eseguito 2026-11-02 · hard-stop, closed by P-2026-11-02-0235), `claude_2026-11-02_0057_prompt_textual_t2b_close.md` (eseguito 2026-11-02), `claude_2026-11-02_0235_prompt_textual_t2c_close.md` (eseguito 2026-11-02).
- `git worktree list`: `textual-t2` in `/Users/alfonso/jjodel-w-textt2`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-11-02-0637/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `d6c5dca73` is the tip of `textual-t2`; the prompt files of the branch read `Status: eseguito` at `d6c5dca73`; `git worktree list` shows `textual-t2` only in `/Users/alfonso/jjodel-w-textt2`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl d6c5dca73` (measured above: 1 conflict: `docs/log-inbox/codegen.md`). `git diff --name-only eef5351e7 d6c5dca73 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only eef5351e7 alfonso-frontend-jjtl` with `git diff --name-only eef5351e7 d6c5dca73` (measured above: `docs/log-inbox/codegen.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-02 — feat(codegen): textual parser with recovery (P-2026-11-02-0024)` once (branch).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-02 — feat(ui): textual entry and read-only Text tab (P-2026-11-02-0057)` once (branch).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-02 — ticket: the Text tab is missing from the app bar` once (branch).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-02 — feat(ui): New model from text (P-2026-11-02-0235)` once (branch).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-01 — fix(jjel): unset attributes read their declared default literal (P-2026-11-01-2350)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-02 — merge: jjel-default-literal into alfonso-frontend-jjtl (P-2026-11-02-0007)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-02 — feat(codegen): textual style checks (P-2026-11-01-2356)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-02 — merge: textual-t3 into alfonso-frontend-jjtl (P-2026-11-02-0027)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-11-02 — ticket: Opening a large model with no viewpoint lands the canvas on an empty area` once (trunk).
4. `git merge --no-ff --no-commit d6c5dca73`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: textual-t2 into alfonso-frontend-jjtl (P-2026-11-02-0637)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `d6c5dca73` in `/Users/alfonso/jjodel-w-textt2`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-textt2`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard a29347b82` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only a29347b82 HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/codegen.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the textual-t2 merge (P-2026-11-02-0637)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-textt2`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
