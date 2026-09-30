# Prompt: merge ir-edge-ports into alfonso-frontend-jjtl

Prompt-ID: P-2026-09-30-1509
Chat: —
Lane: full (merge; 1 conflict: `docs/log-inbox/views.md` measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-09-30-1509 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `cab8a535d`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `ir-edge-ports` into the trunk with one merge commit, `--no-ff`, of the explicit sha `fb8944688`, in the shape of `d8f7be824` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `62f4ac3fc`. The branch carries, on top of the base, 3 commits:

- `fb8944688` docs: close C3 without code, ticket freeHandleIndex (P-2026-09-29-2351)
- `f83d6bc81` docs: C3 reproduction, IR edge ports hypothesis falsified (P-2026-09-29-2351)
- `bc1a3f171` docs: add prompt P-2026-09-29-2351, slice C3 ports of IR edges

The trunk carries, since the base, 6 commits:

- `cab8a535d` docs: Status flips for three executed prompts of 2026-09-18
- `9838c48c0` docs: close the ir-freeze-disc merge by hand, Status and entry (P-2026-09-30-1104)
- `d8f7be824` merge: ir-freeze-disc into alfonso-frontend-jjtl (P-2026-09-30-1104)
- `3ceceb387` docs: add prompt P-2026-09-30-1104, merge ir-freeze-disc into alfonso-frontend-jjtl
- `a50fa6607` docs: discovery of IR authoring freezes and two IR rendering gaps (P-2026-09-29-1935)
- `9b08350d0` docs: add prompt P-2026-09-29-1935, discovery of IR authoring freezes and two IR rendering gaps

Measured by `lane-run merge` at 2026-09-30 15:09, trunk at `cab8a535d`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl fb8944688`: 1 conflict: `docs/log-inbox/views.md`.
- Files changed since the base: 3 on the branch side, 7 on the trunk side; on both sides: `docs/log-inbox/views.md`.
- `git diff --name-only 62f4ac3fc fb8944688 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-09-29_2351_prompt_c3_ir_edge_ports.md` (eseguito 2026-09-30 · lane ir-edge-ports · f83d6bc81 · closed without code: hypothesis falsified on the reproduction (report docs/discovery/discovery_2026-09-29_ir_edge_ports.md), latent freeHandleIndex count and per-side cap ticketed in docs/log-inbox/views.md, self-loop and snap causes moved to slice A1 (chat decision, RC-21)).
- `git worktree list`: `ir-edge-ports` in `/Users/alfonso/jjodel-w-irports`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-09-30-1509/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `fb8944688` is the tip of `ir-edge-ports`; the prompt files of the branch read `Status: eseguito` at `fb8944688`; `git worktree list` shows `ir-edge-ports` only in `/Users/alfonso/jjodel-w-irports`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl fb8944688` (measured above: 1 conflict: `docs/log-inbox/views.md`). `git diff --name-only 62f4ac3fc fb8944688 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 62f4ac3fc alfonso-frontend-jjtl` with `git diff --name-only 62f4ac3fc fb8944688` (measured above: `docs/log-inbox/views.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/views.md`: the heading `## 2026-09-30 — docs(views): slice C3, IR edge ports, closed without code (P-2026-09-29-2351)` once (branch).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-30 — ticket: freeHandleIndex returns a count, not the first free index, and has no per-side cap` once (branch).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-29 — docs(views): discovery, IR authoring freezes, collapsed graphVertex, StructureSpec (P-2026-09-29-1935)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-30 — merge: ir-freeze-disc into alfonso-frontend-jjtl (P-2026-09-30-1104)` once (trunk).
4. `git merge --no-ff --no-commit fb8944688`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: ir-edge-ports into alfonso-frontend-jjtl (P-2026-09-30-1509)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `fb8944688` in `/Users/alfonso/jjodel-w-irports`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard cab8a535d` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/views.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the ir-edge-ports merge (P-2026-09-30-1509)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-irports`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
