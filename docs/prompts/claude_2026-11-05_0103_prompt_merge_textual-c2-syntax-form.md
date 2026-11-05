# Prompt: merge textual-c2-syntax-form into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-05-0103
Chat: https://claude.ai/code/session_01DQt9R5nh3m4Y234MPGL9kH
Request: none (rendered by lane-run, no chat URL known for https://claude.ai/code/session_01DQt9R5nh3m4Y234MPGL9kH)
Lane: full (merge; zero conflicts measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-05-0103 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `6a0a5fdfd`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `textual-c2-syntax-form` into the trunk with one merge commit, `--no-ff`, of the explicit sha `793b170df`, in the shape of `c7cd7e479` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `c09e8f22f`. The branch carries, on top of the base, 13 commits:

- `793b170df` docs(codegen): close C2c and C2a (P-2026-11-05-0010, 0036)
- `cdeed0c35` feat(codegen): C2a, the pure module of the Syntax form (P-2026-11-05-0010)
- `b43b060b0` docs: add prompt P-2026-11-05-0036, C2a continuation
- `6c1a22241` fix(codegen): C2a, the empty syntax record is no record (P-2026-11-05-0010)
- `90720f022` fix(codegen): C2c, the app named only what the model names (P-2026-11-05-0010)
- `bdbd014cf` docs: add prompt P-2026-11-05-0010, C2c and C2a
- `6fa6d3483` docs: Status flip of P-2026-11-04-2342, C2 discovery
- `5c459d039` docs(codegen): C2 discovery report, R4 with the refTargets readers (P-2026-11-04-2342)
- `5e56612af` docs(codegen): C2 discovery report, lanes, risks, decisions (P-2026-11-04-2342)
- `08ff830f4` docs(codegen): C2 discovery report, the three follow-ups (P-2026-11-04-2342)
- `648117e26` docs(codegen): C2 discovery report, the Syntax mode (P-2026-11-04-2342)
- `b52d96945` docs(codegen): C2 discovery report, objective and inputs (P-2026-11-04-2342)
- `c1281f5c1` docs: add prompt P-2026-11-04-2342, C2 Syntax form discovery

The trunk carries, since the base, 1 commit:

- `6a0a5fdfd` docs: R-TXT-47, the C2 recommendations taken unattended, provisional

Measured by `lane-run merge` at 2026-11-05 01:03, trunk at `6a0a5fdfd`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 793b170df`: zero conflicts.
- Files changed since the base: 12 on the branch side, 1 on the trunk side; on both sides: none.
- `git diff --name-only c09e8f22f 793b170df -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-04_2342_prompt_textual_c2_discovery.md` (eseguito 2026-11-04 · lane textual-c2-syntax-form · 5c459d039), `claude_2026-11-05_0010_prompt_textual_c2c_c2a.md` (eseguito 2026-11-05 · lane full · 90720f022, 6c1a22241, cdeed0c35 (stopped at the ceiling, closed by P-2026-11-05-0036, RC-51) · verifica visiva della chat passata 2026-11-05 (RC-23, crops c2c-1, c2c-2) (RC-23, crops of P-2026-11-05-0036)), `claude_2026-11-05_0036_prompt_textual_c2a_cont.md` (eseguito 2026-11-05 · lane full · cdeed0c35 · app probe 4 checks pass; verifica visiva della chat passata 2026-11-05 (RC-23, crops c2c-1, c2c-2) (RC-23, crops c2c-1-typed, c2c-2-name-removed in ~/.jjodel-lanes/P-2026-11-05-0036/)).
- `git worktree list`: `textual-c2-syntax-form` in `/Users/alfonso/jjodel-w-textc2`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-11-05-0103/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `793b170df` is the tip of `textual-c2-syntax-form`; the prompt files of the branch read `Status: eseguito` at `793b170df`; `git worktree list` shows `textual-c2-syntax-form` only in `/Users/alfonso/jjodel-w-textc2`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 793b170df` (measured above: zero conflicts). `git diff --name-only c09e8f22f 793b170df -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only c09e8f22f alfonso-frontend-jjtl` with `git diff --name-only c09e8f22f 793b170df` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-TXT-47` (trunk); control: `- **R-TXT-48**` none.
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-05 — fix(codegen): C2c and C2a, the false «named», the empty record, the Syntax form module (P-2026-11-05-0010, P-2026-11-05-0036)` once (branch).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-05 — ticket: a name-keyword collision is located only at the feature's keyword in the Syntax form` once (branch).
4. `git merge --no-ff --no-commit 793b170df`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: textual-c2-syntax-form into alfonso-frontend-jjtl (P-2026-11-05-0103)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `793b170df` in `/Users/alfonso/jjodel-w-textc2`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-textc2`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 6a0a5fdfd` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only 6a0a5fdfd HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/codegen.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the textual-c2-syntax-form merge (P-2026-11-05-0103)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-textc2`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
