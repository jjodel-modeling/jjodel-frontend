# Prompt: merge sim-e1-engine into alfonso-frontend-jjtl

Prompt-ID: P-2026-09-27-1632
Chat: C-2026-09-27-1437
Lane: full (merge; 1 conflict: `docs/log-inbox/simulation.md` measured)
Status: eseguito 2026-09-27 · lane merge · bbd9b7142 · verifica visiva passata 2026-09-27 (chat, unattended; Alfonso in the morning digest)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-09-27-1632 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `5c996267e`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `sim-e1-engine` into the trunk with one merge commit, `--no-ff`, of the explicit sha `0898a4f99`, in the shape of `c4c54a999` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `d7fe8871f`. The branch carries, on top of the base, 7 commits:

- `0898a4f99` docs(sim): E1 closure, R-SIM-83 and R-SIM-84, log entry, Status (P-2026-09-27-1610)
- `bce34aee1` feat(sim): else over fused transitions, else-position defect (G7) (P-2026-09-27-1610)
- `45a796050` feat(sim): the engine reads the activity final (G6) (P-2026-09-27-1610)
- `5260df11f` docs: add prompt P-2026-09-27-1610, E1 engine G6 and G7
- `f60a0f0b2` docs(sim): Alfonso answers A yes, B no on the post-MODELS engine batch (P-2026-09-27-1545)
- `948fdad8a` docs(sim): post-MODELS engine batch discovery (P-2026-09-27-1545)
- `f18d976d5` docs: add prompt P-2026-09-27-1545, post-MODELS engine batch discovery

The trunk carries, since the base, 15 commits:

- `5c996267e` docs: Status flip for the harness-p16-merge-rules merge (P-2026-09-27-1621)
- `c4c54a999` merge: harness-p16-merge-rules into alfonso-frontend-jjtl (P-2026-09-27-1621)
- `df5d742cd` docs: add prompt P-2026-09-27-1621, merge harness-p16-merge-rules into alfonso-frontend-jjtl
- `c197c0ce6` docs(harness): P16 describes the pending render and --governance-goahead (P-2026-09-27-1620)
- `03c2ebb3b` docs: add prompt P-2026-09-27-1620, P16 describes the pending render and --governance-goahead
- `2b1b346da` docs: Status flip for the sim-demo-script-hint merge (P-2026-09-27-1546)
- `7c9956b40` merge: sim-demo-script-hint into alfonso-frontend-jjtl (P-2026-09-27-1546)
- `696ec45b9` docs: add prompt P-2026-09-27-1546, merge sim-demo-script-hint into alfonso-frontend-jjtl
- `4d8d9ea4c` docs: Status flip for the sim-hint-path-probe merge (P-2026-09-27-1536)
- `2eeae9825` merge: sim-hint-path-probe into alfonso-frontend-jjtl (P-2026-09-27-1536)
- `261886ad4` docs(sim): demo script names the ESM hint path gestures (P-2026-09-27-1540)
- `7994d347b` docs: add prompt P-2026-09-27-1536, merge sim-hint-path-probe into alfonso-frontend-jjtl
- `8598bf7c1` docs: add prompt P-2026-09-27-1540, demo script names the ESM hint path gestures
- `6acdb7080` docs(sim): hint path of the demo script measured on the trunk (P-2026-09-27-1500)
- `49b195a02` docs: add prompt P-2026-09-27-1500, demo hint path measured on the trunk

Measured by `lane-run merge` at 2026-09-27 16:32, trunk at `5c996267e`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 0898a4f99`: 1 conflict: `docs/log-inbox/simulation.md`.
- Files changed since the base: 13 on the branch side, 11 on the trunk side; on both sides: `docs/log-inbox/simulation.md`.
- `git diff --name-only d7fe8871f 0898a4f99 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-09-27_1545_prompt_discovery_sim_post_models_engine.md` (eseguito 2026-09-27 · lane sim-post-models-engine · measured on f18d976d5; the report is in the commit that carries this line (a commit cannot name its own sha)), `claude_2026-09-27_1610_prompt_sim_e1_engine_g6_g7.md` (eseguito 2026-09-27 · lane sim-e1-engine · 45a796050, bce34aee1).
- `git worktree list`: `sim-e1-engine` in `/Users/alfonso/jjodel-icons`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `0898a4f99` is the tip of `sim-e1-engine`; the prompt files of the branch read `Status: eseguito` at `0898a4f99`; `git worktree list` shows `sim-e1-engine` only in `/Users/alfonso/jjodel-icons`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 0898a4f99` (measured above: 1 conflict: `docs/log-inbox/simulation.md`). `git diff --name-only d7fe8871f 0898a4f99 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only d7fe8871f alfonso-frontend-jjtl` with `git diff --name-only d7fe8871f 0898a4f99` (measured above: `docs/log-inbox/simulation.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-SIM-83` (branch), `R-SIM-84` (branch); control: `- **R-SIM-85**` none.
   - `docs/decisions.md`: the heading `### Decisioni 2026-09-27: corsia E1, il motore dopo MODELS (R-SIM-83..84)` once (branch).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-27 — discovery: post-MODELS engine batch, G6, G7, G12 (P-2026-09-27-1545)` once (branch).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-27 — feat: the engine reads the activity final and resolves else over fused transitions, lane E1 (P-2026-09-27-1610)` once (branch).
   - `docs/log-inbox/harness.md`: the heading `## 2026-09-27 — docs: P16 describes the pending render and --governance-goahead (P-2026-09-27-1620)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-27 — probe: the demo script's Add attribute hint path on the trunk (P-2026-09-27-1500)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-27 — docs: demo script names the ESM hint path gestures (P-2026-09-27-1540)` once (trunk).
4. `git merge --no-ff --no-commit 0898a4f99`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: sim-e1-engine into alfonso-frontend-jjtl (P-2026-09-27-1632)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `0898a4f99` in `/Users/alfonso/jjodel-icons`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)`, pathspec after `--`, subject `docs: Status flip for the sim-e1-engine merge (P-2026-09-27-1632)`. No log entry for the merge. Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-icons`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
