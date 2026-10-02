# Prompt: merge ir-ink-outside into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-03-0038
Chat: —
Lane: full (merge; zero conflicts measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-03-0038 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `6dc5fdc4b`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `ir-ink-outside` into the trunk with one merge commit, `--no-ff`, of the explicit sha `d5defd00d`, in the shape of `6dc5fdc4b` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `7c9ae4e0d`. The branch carries, on top of the base, 4 commits:

- `d5defd00d` docs: report addendum, R-VP-51, log entry, Status (P-2026-10-02-2356)
- `cce1ecfef` fix(ir): outside marks of a coloured node keep the notation ink (P-2026-10-02-2356)
- `770b3ddc9` docs: discovery, outside marks of a coloured node keep the ink (P-2026-10-02-2356)
- `850718308` docs: add prompt P-2026-10-02-2356, outside marks of a coloured node keep the notation ink

The trunk carries, since the base, 5 commits:

- `6dc5fdc4b` merge: sim-state-disc into alfonso-frontend-jjtl (P-2026-10-03-0032)
- `18ade0d0d` docs: add prompt P-2026-10-03-0032, merge sim-state-disc into alfonso-frontend-jjtl
- `fece79bc3` docs: R-SIM-109, merge before the MODELS demo and the discovery recommendations adopted (P-2026-10-02-2340)
- `ebf0d4f10` docs: discovery of the simulator's state UI (P-2026-10-02-2340)
- `60b60c31d` docs: add prompt P-2026-10-02-2340 and rows R-SIM-102..109, simulator state UI

Measured by `lane-run merge` at 2026-10-03 00:38, trunk at `6dc5fdc4b`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl d5defd00d`: zero conflicts.
- Files changed since the base: 9 on the branch side, 5 on the trunk side; on both sides: `docs/decisions.md`.
- `git diff --name-only 7c9ae4e0d d5defd00d -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-10-02_2356_prompt_ir_ink_outside.md` (eseguito 2026-10-03 · lane ir-ink-outside · 770b3ddc9, cce1ecfef · non fuso: hard-stop, outside labels and the entry mark of a coloured node keep the notation ink (light rgb(15, 23, 42), dark rgba(255, 255, 255, 0.92)), lane probe on 3098 (light and dark) 50/50 and the base run 20/20, the four default scenes 0 px, mutation bench 13/14 (the survivor equivalent), crops in frontend/scripts/smoke/_tmp_inkout_crops/ (gitignored), R-VP-51, verifica visiva alla chat).
- `git worktree list`: `ir-ink-outside` in `/Users/alfonso/jjodel-w-inkout`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-10-03-0038/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `d5defd00d` is the tip of `ir-ink-outside`; the prompt files of the branch read `Status: eseguito` at `d5defd00d`; `git worktree list` shows `ir-ink-outside` only in `/Users/alfonso/jjodel-w-inkout`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl d5defd00d` (measured above: zero conflicts). `git diff --name-only 7c9ae4e0d d5defd00d -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 7c9ae4e0d alfonso-frontend-jjtl` with `git diff --name-only 7c9ae4e0d d5defd00d` (measured above: `docs/decisions.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-VP-51` (branch), `R-SIM-102` (trunk), `R-SIM-103` (trunk), `R-SIM-104` (trunk), `R-SIM-105` (trunk), `R-SIM-106` (trunk), `R-SIM-107` (trunk), `R-SIM-108` (trunk), `R-SIM-109` (trunk); control: `- **R-SIM-110**` none.
   - `docs/log-inbox/views.md`: the heading `## 2026-10-03 — fix(ir): outside marks of a coloured node keep the notation ink (P-2026-10-02-2356)` once (branch).
   - `docs/decisions.md`: the heading `### Decisions 2026-10-02: the simulator's state UI (R-SIM-102..109)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-02 — discovery: the simulator's state UI, R-SIM-102..107 and 109 (P-2026-10-02-2340)` once (trunk).
4. `git merge --no-ff --no-commit d5defd00d`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: ir-ink-outside into alfonso-frontend-jjtl (P-2026-10-03-0038)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `d5defd00d` in `/Users/alfonso/jjodel-w-inkout`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 6dc5fdc4b` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/views.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the ir-ink-outside merge (P-2026-10-03-0038)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-inkout`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
