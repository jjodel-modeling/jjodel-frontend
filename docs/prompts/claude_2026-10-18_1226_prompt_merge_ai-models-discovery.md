# Prompt: merge ai-models-discovery into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-18-1226
Chat: —
Lane: full (merge; 1 conflict: `docs/log-inbox/maintenance.md` measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-18-1226 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `6d648354a`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `ai-models-discovery` into the trunk with one merge commit, `--no-ff`, of the explicit sha `c54fa14c5`, in the shape of `6268a9073` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `1e9e616fa`. The branch carries, on top of the base, 4 commits:

- `c54fa14c5` docs: Status and log entry for slices (a) and (b) of P-2026-10-18-1146
- `7d233651e` feat(ai): proxy URL from VITE_AI_PROXY_URL, prod Worker by default (P-2026-10-18-1146)
- `cfc266eac` feat(worker): AI proxy Worker in the trunk, origin fix, models routes (P-2026-10-18-1146)
- `70adceffe` docs: discovery on the AI proxy Worker and dynamic model lists (P-2026-10-18-1146)

The trunk carries, since the base, 7 commits:

- `6d648354a` docs: Status flip and log entry for the notif-url merge (P-2026-10-18-1158)
- `6268a9073` merge: notif-url into alfonso-frontend-jjtl (P-2026-10-18-1158)
- `3962a3ebf` docs: add prompt P-2026-10-18-1158, merge notif-url into alfonso-frontend-jjtl
- `3163b7557` docs: add prompt P-2026-10-18-1205 (B3a, lane-run routing and injection)
- `048b86a61` docs: Status flip and log entry for the notifications host fix (P-2026-10-18-1145)
- `4e8bdbcc7` fix(notifications): point API_URL at the renamed workers.dev host (P-2026-10-18-1145)
- `bd5ba8072` docs: add prompt P-2026-10-18-1155 (Arch column, architect tokens per lane)

Measured by `lane-run merge` at 2026-10-18 12:26, trunk at `6d648354a`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl c54fa14c5`: 1 conflict: `docs/log-inbox/maintenance.md`.
- Files changed since the base: 13 on the branch side, 6 on the trunk side; on both sides: `docs/log-inbox/maintenance.md`.
- `git diff --name-only 1e9e616fa c54fa14c5 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: none.
- `git worktree list`: `ai-models-discovery` in `/Users/alfonso/jjodel-w-aimodels`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-10-18-1226/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `c54fa14c5` is the tip of `ai-models-discovery`; the prompt files of the branch read `Status: eseguito` at `c54fa14c5`; `git worktree list` shows `ai-models-discovery` only in `/Users/alfonso/jjodel-w-aimodels`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl c54fa14c5` (measured above: 1 conflict: `docs/log-inbox/maintenance.md`). `git diff --name-only 1e9e616fa c54fa14c5 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 1e9e616fa alfonso-frontend-jjtl` with `git diff --name-only 1e9e616fa c54fa14c5` (measured above: `docs/log-inbox/maintenance.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-10-18 — discovery: AI proxy Worker back in the trunk, configurable proxy URL, dynamic model lists (P-2026-10-18-1146)` once (branch).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-10-18 — feat: AI proxy Worker in the trunk with the origin fix and models routes; proxy URL from VITE_AI_PROXY_URL (P-2026-10-18-1146)` once (branch).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-10-18 — fix(notifications): API_URL points at the renamed workers.dev host (P-2026-10-18-1145)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-10-18 — merge: notif-url into alfonso-frontend-jjtl (P-2026-10-18-1158)` once (trunk).
4. `git merge --no-ff --no-commit c54fa14c5`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: ai-models-discovery into alfonso-frontend-jjtl (P-2026-10-18-1226)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `c54fa14c5` in `/Users/alfonso/jjodel-w-aimodels`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-aimodels`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 6d648354a` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/maintenance.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the ai-models-discovery merge (P-2026-10-18-1226)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-aimodels`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
