# Prompt: merge hw-printer into hw-demo

Prompt-ID: P-2026-10-21-1138
Chat: —
Request: none (rendered by lane-run, no chat URL known for no --chat)
Lane: full (merge; zero conflicts measured)
Status: eseguito 2026-10-21 · lane merge · 8d40c015f · verifica visiva passata 2026-10-21 (codegen Verilog printer and tests only, no UI file; gates green after re-run)

Worktree: `/Users/alfonso/jjodel-w-hwdemo`, branch `hw-demo`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-w-hwdemo` on `hw-demo`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-21-1138 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `fb9aecbcd`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `hw-printer` into the trunk with one merge commit, `--no-ff`, of the explicit sha `33ae51fbf`, in the shape of `eee32699f` (the last merge commit on `hw-demo`; read its body first). Merge base `f8ee48a07`. The branch carries, on top of the base, 3 commits:

- `33ae51fbf` docs: close S-D0 Verilog printer (P-2026-10-21-1035)
- `da6405568` feat(codegen): JjEL to Verilog printer of the register-transfer subset (P-2026-10-21-1035)
- `76743b198` docs: prompt claude_2026-10-21_1035_prompt_hw_sd0_verilog_printer.md

The trunk carries, since the base, 3 commits:

- `fb9aecbcd` docs: S-A1 closure, Status of 1036 and 1100, inbox entry (P-2026-10-21-1100)
- `d3abfaade` feat(examples): HwDesign metamodel and CPU model built by script (P-2026-10-21-1100)
- `8b9c6e4b5` docs: prompt P-2026-10-21-1100 (S-A1 finish after the context ceiling)

Measured by `lane-run merge` at 2026-10-21 11:38, trunk at `fb9aecbcd`:

- `git merge-tree --write-tree --name-only hw-demo 33ae51fbf`: zero conflicts.
- Files changed since the base: 8 on the branch side, 9 on the trunk side; on both sides: `docs/log-inbox/hw-notation.md`.
- `git diff --name-only f8ee48a07 33ae51fbf -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-10-21_1035_prompt_hw_sd0_verilog_printer.md` (eseguito 2026-10-21 · lane hw-printer · da6405568).
- `git worktree list`: `hw-printer` in `/Users/alfonso/jjodel-w-hwprinter`; `hw-demo` in `/Users/alfonso/jjodel-w-hwdemo`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-10-21-1138/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `33ae51fbf` is the tip of `hw-printer`; the prompt files of the branch read `Status: eseguito` at `33ae51fbf`; `git worktree list` shows `hw-printer` only in `/Users/alfonso/jjodel-w-hwprinter`.
2. Measure again. `git merge-tree --write-tree --name-only hw-demo 33ae51fbf` (measured above: zero conflicts). `git diff --name-only f8ee48a07 33ae51fbf -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only f8ee48a07 hw-demo` with `git diff --name-only f8ee48a07 33ae51fbf` (measured above: `docs/log-inbox/hw-notation.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-10-21 — feat: S-D0, the JjEL to Verilog printer of the register-transfer subset` once (branch).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-10-21 — feat: hw demonstrator S-A1, HwDesign metamodel and CPU model built by script` once (trunk).
4. `git merge --no-ff --no-commit 33ae51fbf`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: hw-printer into hw-demo (P-2026-10-21-1138)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `33ae51fbf` in `/Users/alfonso/jjodel-w-hwprinter`, read-only, `node /Users/alfonso/jjodel-w-hwdemo/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-hwprinter`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard fb9aecbcd` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only fb9aecbcd HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-w-hwdemo` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/hw-notation.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the hw-printer merge (P-2026-10-21-1138)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-hwprinter`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
