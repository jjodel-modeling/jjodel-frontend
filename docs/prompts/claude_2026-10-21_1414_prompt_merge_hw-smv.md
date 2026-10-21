# Prompt: merge hw-smv into hw-demo

Prompt-ID: P-2026-10-21-1414
Chat: C-2026-10-20-2055
Request: https://claude.ai/code/session_015TA6h4cZMkEoB4r47V9hTk (merge of hw-smv launched by chat C-2026-10-20-2055)
Lane: full (merge; 1 conflict: `docs/log-inbox/hw-notation.md` measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-w-hwdemo`, branch `hw-demo`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-w-hwdemo` on `hw-demo`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-21-1414 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `620e0ee00`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `hw-smv` into the trunk with one merge commit, `--no-ff`, of the explicit sha `1b6c648fd`, in the shape of `19877ff1c` (the last merge commit on `hw-demo`; read its body first). Merge base `31e277fcd`. The branch carries, on top of the base, 6 commits:

- `1b6c648fd` docs: log entry for S-G1, the nuXmv exporter (P-2026-10-21-1341)
- `8cfe5e81a` docs: Status of the S-G1 prompts 1301 and 1341 (P-2026-10-21-1341)
- `2f602806c` test(sim): S-G1, every next in its type under every selector; bench (P-2026-10-21-1341)
- `8e20fd489` feat(sim): S-G1, the nuXmv .smv exporter of a one-token machine (P-2026-10-21-1341)
- `599fac602` docs: prompt P-2026-10-21-1341 (S-G1 finish after the context ceiling)
- `401559307` docs: prompt P-2026-10-21-1301 (S-G1 nuXmv .smv exporter)

The trunk carries, since the base, 4 commits:

- `620e0ee00` docs: S-D closure, Status of 1300 and 1340, inbox entry, 3 tickets (P-2026-10-21-1340)
- `671dc5638` feat(codegen): S-D route A, the Verilog target and the hw-cpu testbench (P-2026-10-21-1340)
- `3655295a2` docs: prompt P-2026-10-21-1340 (S-D finish after the context ceiling)
- `5022461dc` docs: prompt P-2026-10-21-1300 (S-D route A, Verilog target and testbench)

Measured by `lane-run merge` at 2026-10-21 14:14, trunk at `620e0ee00`:

- `git merge-tree --write-tree --name-only hw-demo 1b6c648fd`: 1 conflict: `docs/log-inbox/hw-notation.md`.
- Files changed since the base: 7 on the branch side, 11 on the trunk side; on both sides: `docs/log-inbox/hw-notation.md`.
- `git diff --name-only 31e277fcd 1b6c648fd -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-10-21_1301_prompt_hw_sg1_smv_exporter.md` (eseguito 2026-10-21 · lane hw-smv · 8e20fd489 · continued by P-2026-10-21-1341 after the AM-8 ceiling · verifica visiva non applicabile (no UI change)), `claude_2026-10-21_1341_prompt_hw_sg1_finish.md` (eseguito 2026-10-21 · lane hw-smv · 8e20fd489, 2f602806c · continuation of P-2026-10-21-1301 · verifica visiva non applicabile (no UI change)).
- `git worktree list`: `hw-smv` in `/Users/alfonso/jjodel-w-hwsmv`; `hw-demo` in `/Users/alfonso/jjodel-w-hwdemo`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-10-21-1414/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `1b6c648fd` is the tip of `hw-smv`; the prompt files of the branch read `Status: eseguito` at `1b6c648fd`; `git worktree list` shows `hw-smv` only in `/Users/alfonso/jjodel-w-hwsmv`.
2. Measure again. `git merge-tree --write-tree --name-only hw-demo 1b6c648fd` (measured above: 1 conflict: `docs/log-inbox/hw-notation.md`). `git diff --name-only 31e277fcd 1b6c648fd -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 31e277fcd hw-demo` with `git diff --name-only 31e277fcd 1b6c648fd` (measured above: `docs/log-inbox/hw-notation.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-10-21 — feat: S-G1, the nuXmv .smv exporter, finished after the context ceiling (P-2026-10-21-1341)` once (branch).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-10-21 — feat: hw demonstrator S-D, route A, the Verilog target and the hw-cpu testbench` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-10-21 — ticket: codegen probe: checkable() now treats hw-cpu as a JS example` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-10-21 — ticket: S-D0 printer: a top-level zext prints a bare select, default verilator lint warns` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-10-21 — ticket: CodePanel Run on a Verilog entry runs the text as JavaScript` once (trunk).
4. `git merge --no-ff --no-commit 1b6c648fd`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: hw-smv into hw-demo (P-2026-10-21-1414)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `1b6c648fd` in `/Users/alfonso/jjodel-w-hwsmv`, read-only, `node /Users/alfonso/jjodel-w-hwdemo/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-hwsmv`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 620e0ee00` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only 620e0ee00 HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-w-hwdemo` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/hw-notation.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the hw-smv merge (P-2026-10-21-1414)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-hwsmv`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
