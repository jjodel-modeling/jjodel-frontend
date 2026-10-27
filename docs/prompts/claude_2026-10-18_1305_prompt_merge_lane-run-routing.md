# Prompt: merge lane-run-routing into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-18-1305
Chat: C-2026-10-17-1757
Lane: full (merge; 1 conflict: `docs/log-inbox/harness.md` measured)
Status: eseguito 2026-10-18 · lane merge · c991ce637 · verifica visiva passata 2026-10-18 (no UI change: lane-run, tests and docs only (0 files under frontend/src); decided by chat C-2026-10-17-1757 under RC-25)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-18-1305 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `6a1e96adf`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `lane-run-routing` into the trunk with one merge commit, `--no-ff`, of the explicit sha `6ac82be35`, in the shape of `a99f88b4c` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `3163b7557`. The branch carries, on top of the base, 2 commits:

- `6ac82be35` docs: B3a runs.jsonl and injection schema, log entry, Status flip (P-2026-10-18-1205)
- `111376b99` feat(harness): lane-run records effort and model, injects decisions (P-2026-10-18-1205)

The trunk carries, since the base, 19 commits:

- `6a1e96adf` test(harness): live-register row count is a floor, the register is append-only
- `a99f88b4c` merge: lane-board-arch into alfonso-frontend-jjtl (P-2026-10-18-1255)
- `1ad48c983` docs: add prompt P-2026-10-18-1255, merge lane-board-arch into alfonso-frontend-jjtl
- `cfab9b74b` docs(decisions): RC-50, the AM-8 context ceiling also binds the architect
- `b9dd4290c` docs: Status flip and log entry for the ai-models-discovery merge (P-2026-10-18-1226)
- `67320b999` merge: ai-models-discovery into alfonso-frontend-jjtl (P-2026-10-18-1226)
- `cffbf13db` docs: add prompt P-2026-10-18-1226, merge ai-models-discovery into alfonso-frontend-jjtl
- `c54fa14c5` docs: Status and log entry for slices (a) and (b) of P-2026-10-18-1146
- `7d233651e` feat(ai): proxy URL from VITE_AI_PROXY_URL, prod Worker by default (P-2026-10-18-1146)
- `cfc266eac` feat(worker): AI proxy Worker in the trunk, origin fix, models routes (P-2026-10-18-1146)
- `6d648354a` docs: Status flip and log entry for the notif-url merge (P-2026-10-18-1158)
- `6268a9073` merge: notif-url into alfonso-frontend-jjtl (P-2026-10-18-1158)
- `3962a3ebf` docs: add prompt P-2026-10-18-1158, merge notif-url into alfonso-frontend-jjtl
- `70adceffe` docs: discovery on the AI proxy Worker and dynamic model lists (P-2026-10-18-1146)
- `a0337b7bc` docs: log entry and Status flip for the Arch column (P-2026-10-18-1155)
- `743ceedf3` docs(harness): README for the Arch column and architect.json (P-2026-10-18-1155)
- `e10902120` feat(harness): lane board shows the architect's tokens per lane (P-2026-10-18-1155)
- `048b86a61` docs: Status flip and log entry for the notifications host fix (P-2026-10-18-1145)
- `4e8bdbcc7` fix(notifications): point API_URL at the renamed workers.dev host (P-2026-10-18-1145)

Measured by `lane-run merge` at 2026-10-18 13:05, trunk at `6a1e96adf`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 6ac82be35`: 1 conflict: `docs/log-inbox/harness.md`.
- Files changed since the base: 6 on the branch side, 30 on the trunk side; on both sides: `docs/log-inbox/harness.md`.
- `git diff --name-only 3163b7557 6ac82be35 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: none.
- `git worktree list`: `lane-run-routing` in `/Users/alfonso/jjodel-w-routing`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-10-18-1305/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `6ac82be35` is the tip of `lane-run-routing`; the prompt files of the branch read `Status: eseguito` at `6ac82be35`; `git worktree list` shows `lane-run-routing` only in `/Users/alfonso/jjodel-w-routing`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 6ac82be35` (measured above: 1 conflict: `docs/log-inbox/harness.md`). `git diff --name-only 3163b7557 6ac82be35 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 3163b7557 alfonso-frontend-jjtl` with `git diff --name-only 3163b7557 6ac82be35` (measured above: `docs/log-inbox/harness.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `RC-50` (trunk); control: `- **RC-51**` none.
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-18 — feat(harness): B3a, lane-run records effort and model per launch, injects cited decisions and log entries (P-2026-10-18-1205)` once (branch).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-18 — feat(harness): Arch column, the lane board and lane-usage show the architect's tokens per lane (P-2026-10-18-1155)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-10-18 — fix(notifications): API_URL points at the renamed workers.dev host (P-2026-10-18-1145)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-10-18 — merge: notif-url into alfonso-frontend-jjtl (P-2026-10-18-1158)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-10-18 — discovery: AI proxy Worker back in the trunk, configurable proxy URL, dynamic model lists (P-2026-10-18-1146)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-10-18 — feat: AI proxy Worker in the trunk with the origin fix and models routes; proxy URL from VITE_AI_PROXY_URL (P-2026-10-18-1146)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-10-18 — merge: ai-models-discovery into alfonso-frontend-jjtl (P-2026-10-18-1226)` once (trunk).
4. `git merge --no-ff --no-commit 6ac82be35`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: lane-run-routing into alfonso-frontend-jjtl (P-2026-10-18-1305)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `6ac82be35` in `/Users/alfonso/jjodel-w-routing`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-routing`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 6a1e96adf` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/harness.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the lane-run-routing merge (P-2026-10-18-1305)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-routing`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
