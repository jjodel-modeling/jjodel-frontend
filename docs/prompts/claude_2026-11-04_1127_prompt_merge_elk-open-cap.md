# Prompt: merge elk-open-cap into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-04-1127
Chat: C-2026-11-03-2317
Request: https://claude.ai/code/session_01DQt9R6hbytx4vz5aAdzQ8i (merge of elk-open-cap launched by chat C-2026-11-03-2317)
Lane: full (merge; zero conflicts measured)
Status: eseguito 2026-11-04 · lane merge · b35f43b84 · verifica visiva passata 2026-11-04 (gates green on b35f43b84; the cap probe ran on the branch before the trunk merge and was not rerun; no hand run)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-04-1127 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `32ca59c2d`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `elk-open-cap` into the trunk with one merge commit, `--no-ff`, of the explicit sha `4dc49956e`, in the shape of `9abc989ff` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `32ca59c2d`. The branch carries, on top of the base, 12 commits:

- `4dc49956e` docs: Status flip and log entry, elk-open-cap took the trunk (P-2026-11-04-1053)
- `80f03e1b6` merge: elk-open-cap takes alfonso-frontend-jjtl (P-2026-11-04-1053)
- `e50c87d7c` docs: add prompt P-2026-11-04-1053, merge alfonso-frontend-jjtl into elk-open-cap
- `8fae6564d` docs: Status flip for the route A crops read (P-2026-11-04-1042)
- `96c3d0093` docs: add prompt P-2026-11-04-1042, look at the route A crops
- `06b4f4aaa` docs: Status flip for the ELK open cap (P-2026-11-04-0926)
- `5432f8570` docs: log entries for the ELK trace and the open cap (P-2026-11-04-0926)
- `f33424346` fix(editor-v2): the open cap counts the objects of the graph's model (P-2026-11-04-0926)
- `ca94f5a36` fix(editor-v2): no auto-layout on open above 500 nodes or edges (P-2026-11-04-0926)
- `508aa0815` docs: add prompt P-2026-11-04-0926, ELK open cap
- `62ddd6b09` docs: discovery, ELK auto-layout on open freeze (P-2026-11-04-0902)
- `a77e47fe3` docs: add prompt P-2026-11-04-0902, trace the ELK freeze

The trunk carries, since the base, 0 commits:

- none

Measured by `lane-run merge` at 2026-11-04 11:27, trunk at `32ca59c2d`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 4dc49956e`: zero conflicts.
- Files changed since the base: 9 on the branch side, 0 on the trunk side; on both sides: none.
- `git diff --name-only 32ca59c2d 4dc49956e -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-04_0902_prompt_elk_open_trace.md` (eseguito 2026-11-04 · lane elk-open-trace · report docs/discovery/discovery_2026-11-04_elk_open_freeze.md · app reproduction not tried), `claude_2026-11-04_0926_prompt_elk_open_cap.md` (eseguito 2026-11-04 · lane elk-open-cap · commits ca94f5a36, f33424346 · cap 500 nodes or edges, model objects counted · app probe on b10_8, no hand run), `claude_2026-11-04_1042_prompt_canvas_crop_read.md` (eseguito 2026-11-04 · read only, report in chat), `claude_2026-11-04_1053_prompt_elk-open-cap_take_trunk.md` (eseguito 2026-11-04 · lane elk-open-cap · 80f03e1b6 · verifica visiva passata 2026-11-04 (chat, unattended; Alfonso in the morning digest)).
- `git worktree list`: `elk-open-cap` in `/Users/alfonso/jjodel-w-elkcap`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-11-04-1127/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `4dc49956e` is the tip of `elk-open-cap`; the prompt files of the branch read `Status: eseguito` at `4dc49956e`; `git worktree list` shows `elk-open-cap` only in `/Users/alfonso/jjodel-w-elkcap`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 4dc49956e` (measured above: zero conflicts). `git diff --name-only 32ca59c2d 4dc49956e -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 32ca59c2d alfonso-frontend-jjtl` with `git diff --name-only 32ca59c2d 4dc49956e` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-04 — docs: discovery, ELK auto-layout on open freeze (P-2026-11-04-0902)` once (branch).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-04 — fix(editor-v2): no auto-layout on open above 500 nodes or edges (P-2026-11-04-0926)` once (branch).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-04 — merge: elk-open-cap takes alfonso-frontend-jjtl (P-2026-11-04-1053)` once (branch).
4. `git merge --no-ff --no-commit 4dc49956e`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: elk-open-cap into alfonso-frontend-jjtl (P-2026-11-04-1127)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `4dc49956e` in `/Users/alfonso/jjodel-w-elkcap`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-elkcap`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 32ca59c2d` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only 32ca59c2d HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/hw-notation.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the elk-open-cap merge (P-2026-11-04-1127)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-elkcap`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
