# Prompt: merge sim-r2-apply into alfonso-frontend-jjtl

Prompt-ID: P-2026-09-27-1125
Chat: —
Lane: full (merge; 1 conflict: `docs/log-inbox/simulation.md` measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-09-27-1125 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `064c8342a`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `sim-r2-apply` into the trunk with one merge commit, `--no-ff`, of the explicit sha `cafd6f4f5`, in the shape of `a0fa9b428` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `54999f9ae`. The branch carries, on top of the base, 4 commits:

- `cafd6f4f5` docs: Status flip for the demo readiness discovery (P-2026-09-27-1015)
- `baca2f83f` docs: close R2, Apply completes the natural shapes (P-2026-09-27-1110)
- `86401f845` feat(sim): Apply completes the natural shapes (P-2026-09-27-1110)
- `39af28387` docs: add prompt P-2026-09-27-1110, R2 Apply completes the natural shapes

The trunk carries, since the base, 13 commits:

- `064c8342a` docs: Status flip for the sim-r1-labels merge (P-2026-09-27-1119)
- `a0fa9b428` merge: sim-r1-labels into alfonso-frontend-jjtl (P-2026-09-27-1119)
- `d2b74e601` docs: add prompt P-2026-09-27-1119, merge sim-r1-labels into alfonso-frontend-jjtl
- `8cde49d3a` docs: Status flip for the demo readiness discovery (P-2026-09-27-1015)
- `694d459e1` docs: session checkpoint 2026-09-27 (simulator and harness chat)
- `3ec1a8a30` docs: /lane command for Claude Code sessions (read-only lane status)
- `c8d6136a8` docs: close R1, event labels (P-2026-09-27-1105)
- `cda1fdb4e` fix(sim): event labels fall back to the instance name (P-2026-09-27-1105)
- `da0bcd012` docs: P16 lane-run v2; harness inbox (P-2026-09-27-1035)
- `c3a20b8d7` docs: add prompt P-2026-09-27-1105, R1 event labels
- `58de29980` feat(scripts): lane-run probe, wait, status --all and two fixes (P-2026-09-27-1035)
- `d6f619ce7` feat(scripts): lane-run merge, go and inline resume (P-2026-09-27-1035)
- `6c69783cf` docs: add prompt P-2026-09-27-1030, trace monitor discovery

Measured by `lane-run merge` at 2026-09-27 11:25, trunk at `064c8342a`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl cafd6f4f5`: 1 conflict: `docs/log-inbox/simulation.md`.
- Files changed since the base: 11 on the branch side, 16 on the trunk side; on both sides: `docs/log-inbox/simulation.md`, `docs/prompts/claude_2026-09-27_1015_prompt_sim_demo_readiness_discovery.md`.
- `git diff --name-only 54999f9ae cafd6f4f5 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-09-27_1110_prompt_sim_r2_apply_natural_shapes.md` (eseguito 2026-09-27 · lane sim-r2-apply · 86401f845).
- `git worktree list`: `sim-r2-apply` in `/Users/alfonso/jjodel-gate`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `cafd6f4f5` is the tip of `sim-r2-apply`; the prompt files of the branch read `Status: eseguito` at `cafd6f4f5`; `git worktree list` shows `sim-r2-apply` only in `/Users/alfonso/jjodel-gate`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl cafd6f4f5` (measured above: 1 conflict: `docs/log-inbox/simulation.md`). `git diff --name-only 54999f9ae cafd6f4f5 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 54999f9ae alfonso-frontend-jjtl` with `git diff --name-only 54999f9ae cafd6f4f5` (measured above: `docs/log-inbox/simulation.md`, `docs/prompts/claude_2026-09-27_1015_prompt_sim_demo_readiness_discovery.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-27 — feat: Apply completes the natural shapes, lane R2 (P-2026-09-27-1110)` once (branch).
   - `docs/log-inbox/harness.md`: the heading `## 2026-09-27 — feat: lane-run v2, five additions for the chat side (P-2026-09-27-1035)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-27 — fix: event labels fall back to the instance name, R1 (P-2026-09-27-1105)` once (trunk).
4. `git merge --no-ff --no-commit cafd6f4f5`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: sim-r2-apply into alfonso-frontend-jjtl (P-2026-09-27-1125)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `cafd6f4f5` in `/Users/alfonso/jjodel-gate`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)`, pathspec after `--`, subject `docs: Status flip for the sim-r2-apply merge (P-2026-09-27-1125)`. No log entry for the merge. Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-gate`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
