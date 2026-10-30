# Prompt: merge gen-io into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-30-2300
Chat: —
Request: none (rendered by lane-run, no chat URL known for no --chat)
Lane: full (merge; zero conflicts measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-30-2300 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `5e81e8933`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `gen-io` into the trunk with one merge commit, `--no-ff`, of the explicit sha `d0fc59c7a`, in the shape of `52ff81621` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `5e81e8933`. The branch carries, on top of the base, 11 commits:

- `d0fc59c7a` docs: Status flip and log entry, gen-io took the trunk (P-2026-10-30-2209)
- `358f48f5f` merge: gen-io takes alfonso-frontend-jjtl (P-2026-10-30-2209)
- `aa0280e04` docs: add prompt P-2026-10-30-2209, merge alfonso-frontend-jjtl into gen-io
- `ff2393191` docs(codegen): log entry and Status flips for generator import/export (P-2026-10-30-1540)
- `9c66dfcc0` docs(prompts): P-2026-10-30-1540 generator import/export closure
- `9d844eca3` feat(codegen): GENERATORS section in the project dashboard (P-2026-10-30-1515)
- `03db53f3f` feat(codegen): generator import and export in the Templates tab (P-2026-10-30-1515)
- `7fbedcc78` feat(codegen): generator file format, decode, validate, plan (P-2026-10-30-1515)
- `8a66dcde9` docs(prompts): P-2026-10-30-1515 generator import/export Phase 2, acceptance fixtures
- `26d27c5e9` docs(discovery): generator import and export, Phase 1 (P-2026-10-30-1430)
- `4a5921479` docs(prompts): P-2026-10-30-1430 generator import and export as JSON

The trunk carries, since the base, 0 commits:

- none

Measured by `lane-run merge` at 2026-10-30 23:00, trunk at `5e81e8933`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl d0fc59c7a`: zero conflicts.
- Files changed since the base: 17 on the branch side, 0 on the trunk side; on both sides: none.
- `git diff --name-only 5e81e8933 d0fc59c7a -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-10-30_1430_prompt_generator_import_export.md` (eseguito 2026-10-30 · lane gen-io · branch gen-io · 9d844eca3 · verifica visiva da fare), `claude_2026-10-30_1515_prompt_generator_import_export_phase2.md` (eseguito 2026-10-30 · lane gen-io · branch gen-io · 9d844eca3 · verifica visiva da fare), `claude_2026-10-30_1540_prompt_generator_import_export_closure.md` (eseguito 2026-10-30 · lane gen-io · branch gen-io · the commit of this line), `claude_2026-10-30_2209_prompt_gen-io_take_trunk.md` (eseguito 2026-10-30 · lane gen-io · 358f48f5f · verifica visiva passata 2026-10-30 (chat, unattended; Alfonso in the morning digest)).
- `git worktree list`: `gen-io` in `/Users/alfonso/jjodel-w-genio`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-10-30-2300/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `d0fc59c7a` is the tip of `gen-io`; the prompt files of the branch read `Status: eseguito` at `d0fc59c7a`; `git worktree list` shows `gen-io` only in `/Users/alfonso/jjodel-w-genio`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl d0fc59c7a` (measured above: zero conflicts). `git diff --name-only 5e81e8933 d0fc59c7a -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 5e81e8933 alfonso-frontend-jjtl` with `git diff --name-only 5e81e8933 d0fc59c7a` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/codegen.md`: the heading `## 2026-10-30 — feat(codegen): generator import and export as JSON, Templates tab and dashboard (P-2026-10-30-1430, P-2026-10-30-1515)` once (branch).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-10-30 — merge: gen-io takes alfonso-frontend-jjtl (P-2026-10-30-2209)` once (branch).
4. `git merge --no-ff --no-commit d0fc59c7a`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: gen-io into alfonso-frontend-jjtl (P-2026-10-30-2300)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `d0fc59c7a` in `/Users/alfonso/jjodel-w-genio`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-genio`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 5e81e8933` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only 5e81e8933 HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/codegen.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the gen-io merge (P-2026-10-30-2300)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-genio`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
