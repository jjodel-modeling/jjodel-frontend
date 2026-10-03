# Prompt: merge auto-intake into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-03-1840
Chat: C-2026-10-03-1705
Lane: full (merge; zero conflicts measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-03-1840 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `7a249ef87`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `auto-intake` into the trunk with one merge commit, `--no-ff`, of the explicit sha `c5b8279d8`, in the shape of `3d62a8f13` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `49957d340`. The branch carries, on top of the base, 3 commits:

- `c5b8279d8` docs: Status flip, log entry and report addendum, auto-intake (P-2026-10-03-1705)
- `630d82e19` feat(harness): auto-intake core for issue-driven lanes (P-2026-10-03-1705)
- `c5bb487a8` docs: discovery on auto-intake (P-2026-10-03-1705)

The trunk carries, since the base, 21 commits:

- `7a249ef87` docs: add prompt P-2026-10-03-1838, merge derived-notations-edges into alfonso-frontend-jjtl
- `95f06e6a7` docs: Status flip and log entry for the undo-inline-edit merge (P-2026-10-03-1750)
- `3d62a8f13` merge: undo-inline-edit into alfonso-frontend-jjtl (P-2026-10-03-1750)
- `ff12f72b7` docs: add prompt P-2026-10-03-1750, merge undo-inline-edit into alfonso-frontend-jjtl
- `c41c63a7a` docs: correct the auto-lanes memo with the discovery of P-2026-10-03-1705
- `14adb5da5` merge: undo-inline-edit takes alfonso-frontend-jjtl at b4c59c572 (P-2026-10-03-1632)
- `408f5dea2` docs: second trunk take of the undo lane, gates rerun (P-2026-10-03-1632)
- `b4c59c572` docs: Status flip and log entry for the sim-polish merge (P-2026-10-03-1730)
- `22a3b33b4` merge: undo-inline-edit takes alfonso-frontend-jjtl at 26b62ea01 (P-2026-10-03-1632)
- `bb7a3f985` docs: closure of the undo of inline edits, Status flip (P-2026-10-03-1632)
- `26b62ea01` merge: sim-polish into alfonso-frontend-jjtl (P-2026-10-03-1730)
- `22f728956` docs: add prompt P-2026-10-03-1730, merge sim-polish into alfonso-frontend-jjtl
- `c482d7785` docs: Status flip and log entry for the simulation UI polish (P-2026-10-03-1630)
- `26e05dba3` fix(sim): role tags, roles counter, state heading, initial on switches (P-2026-10-03-1630)
- `ac64b213b` fix(redux): copy-on-write never writes into the previous state (P-2026-10-03-1632)
- `0eac2931b` docs: LIR for the undo fix amended at the Phase 2 GO (P-2026-10-03-1632)
- `e2154ebaf` merge: undo-inline-edit takes alfonso-frontend-jjtl at 49957d340 (P-2026-10-03-1632)
- `389519169` docs: discovery and LIR for the undo of inline edits (P-2026-10-03-1632)
- `d073925e7` probe: undo of inline slot writes on DemoPetri (P-2026-10-03-1632)
- `4cba26044` docs: add prompt P-2026-10-03-1632
- `1bfb24d88` docs: add prompt P-2026-10-03-1630

Measured by `lane-run merge` at 2026-10-03 18:40, trunk at `7a249ef87`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl c5b8279d8`: zero conflicts.
- Files changed since the base: 10 on the branch side, 23 on the trunk side; on both sides: none.
- `git diff --name-only 49957d340 c5b8279d8 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: none.
- `git worktree list`: `auto-intake` in `/Users/alfonso/jjodel-w-autointake`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-10-03-1840/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `c5b8279d8` is the tip of `auto-intake`; the prompt files of the branch read `Status: eseguito` at `c5b8279d8`; `git worktree list` shows `auto-intake` only in `/Users/alfonso/jjodel-w-autointake`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl c5b8279d8` (measured above: zero conflicts). `git diff --name-only 49957d340 c5b8279d8 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 49957d340 alfonso-frontend-jjtl` with `git diff --name-only 49957d340 c5b8279d8` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-03 — feat: auto-intake core for issue-driven unattended lanes (P-2026-10-03-1705)` once (branch).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-03 — fix: simulation UI polish, tags, roles line, state heading, initials (P-2026-10-03-1630)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-03 — ticket: two console errors on the demo scenes predate the simulation UI` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-03 — merge: sim-polish into alfonso-frontend-jjtl (P-2026-10-03-1730)` once (trunk).
   - `docs/log-inbox/symbol-editor.md`: the heading `## 2026-10-03 — fix(redux): undo restores a slot written inline, copy-on-write never writes into the previous state (P-2026-10-03-1632)` once (trunk).
   - `docs/log-inbox/symbol-editor.md`: the heading `## 2026-10-03 — merge: undo-inline-edit takes alfonso-frontend-jjtl at 26b62ea01, second take (P-2026-10-03-1632)` once (trunk).
   - `docs/log-inbox/symbol-editor.md`: the heading `## 2026-10-03 — merge: undo-inline-edit into alfonso-frontend-jjtl (P-2026-10-03-1750)` once (trunk).
4. `git merge --no-ff --no-commit c5b8279d8`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: auto-intake into alfonso-frontend-jjtl (P-2026-10-03-1840)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `c5b8279d8` in `/Users/alfonso/jjodel-w-autointake`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 7a249ef87` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/harness.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the auto-intake merge (P-2026-10-03-1840)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-autointake`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
