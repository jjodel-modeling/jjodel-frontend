# Prompt: merge viewpoint-derivation-p2 into alfonso-frontend-jjtl

Prompt-ID: P-2026-09-29-0233
Chat: C-2026-09-28-1936
Lane: full (merge; zero conflicts measured)
Status: eseguito 2026-09-29 · lane merge · cf0dc6b8c · verifica visiva passata 2026-09-29 (chat: four demo scenes probed on the branch, light theme, port 3044: 71 readings identical to the trunk before R-SIM-94; lane measured one-step undo and default viewpoint untouched; additive feature behind Derive viewpoint in Advanced mode; crops not viewed by the chat)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-09-29-0233 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `04c81327d`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `viewpoint-derivation-p2` into the trunk with one merge commit, `--no-ff`, of the explicit sha `5334ffa5c`, in the shape of `7cdf5d0f8` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `174f6c58a`. The branch carries, on top of the base, 5 commits:

- `5334ffa5c` docs: log entry and Status flip for viewpoint derivation Phase 2 (P-2026-09-29-0135)
- `fead37b48` feat(tree): «Derive viewpoint» in the metamodel row's menu (P-2026-09-29-0135)
- `9511f745c` feat(views): create a derived viewpoint, one IR view per class (P-2026-09-29-0135)
- `1eb916bba` feat(editor-v2): derive IR view documents from a metamodel (P-2026-09-29-0135)
- `131c395e2` docs(prompts): P-2026-09-29-0135 viewpoint derivation Phase 2

The trunk carries, since the base, 11 commits:

- `04c81327d` docs: Status flip and log entry for the sim-data-level-p2 merge (P-2026-09-29-0214)
- `7cdf5d0f8` merge: sim-data-level-p2 into alfonso-frontend-jjtl (P-2026-09-29-0214)
- `fffceedf8` docs: add prompt P-2026-09-29-0214, merge sim-data-level-p2 into alfonso-frontend-jjtl
- `08491af8e` docs: Status, log entry and discovery section 8 for R-SIM-94 Phase 2 (P-2026-09-29-0110)
- `812b17cab` feat(sim): the metamodel's hint says where globals go (R-SIM-94) (P-2026-09-29-0110)
- `ef24c0a7c` feat(sim): Data... on the model tab of the simulation panel (R-SIM-94) (P-2026-09-29-0110)
- `35d0e19a2` feat(sim): the model's Data dialog, globals only (R-SIM-94) (P-2026-09-29-0110)
- `6c06503b7` feat(sim): the declarations table serves a model's globals (R-SIM-94) (P-2026-09-29-0110)
- `59b020a5c` feat(sim): Reset reads the model's globals (R-SIM-94) (P-2026-09-29-0110)
- `b4fba8a39` feat(sim): a model's globals merged over the metamodel's (R-SIM-94) (P-2026-09-29-0110)
- `78e2fcc7e` docs: R-SIM-94 (globals in the model, decided on Alfonso's delegation) and prompt P-2026-09-29-0110

Measured by `lane-run merge` at 2026-09-29 02:33, trunk at `04c81327d`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 5334ffa5c`: zero conflicts.
- Files changed since the base: 7 on the branch side, 14 on the trunk side; on both sides: none.
- `git diff --name-only 174f6c58a 5334ffa5c -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-09-29_0135_prompt_viewpoint_derivation_p2.md` (eseguito 2026-09-29 · lane viewpoint-derivation-p2 · 1eb916bba, 9511f745c, fead37b48 · non fuso: hard-stop, lane probe 32/32 on 3042 (light), crop in docs/discovery/harness/_tmp_viewgen_*.png (gitignored), verifica visiva alla chat).
- `git worktree list`: `viewpoint-derivation-p2` in `/Users/alfonso/jjodel-w-viewgen2`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-09-29-0233/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `5334ffa5c` is the tip of `viewpoint-derivation-p2`; the prompt files of the branch read `Status: eseguito` at `5334ffa5c`; `git worktree list` shows `viewpoint-derivation-p2` only in `/Users/alfonso/jjodel-w-viewgen2`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 5334ffa5c` (measured above: zero conflicts). `git diff --name-only 174f6c58a 5334ffa5c -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 174f6c58a alfonso-frontend-jjtl` with `git diff --name-only 174f6c58a 5334ffa5c` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-SIM-94` (trunk); control: `- **R-SIM-95**` none.
   - `docs/log-inbox/views.md`: the heading `## 2026-09-29 — feat(views): viewpoint derivation Phase 2, a deterministic viewpoint from a metamodel (P-2026-09-29-0135)` once (branch).
   - `docs/decisions.md`: the heading `### Decisions 2026-09-29 (night): the globals of a system live in its model (R-SIM-94)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-29 — feat: the globals of a system declared in its model, R-SIM-94 Phase 2 (P-2026-09-29-0110)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-29 — merge: sim-data-level-p2 into alfonso-frontend-jjtl (P-2026-09-29-0214)` once (trunk).
4. `git merge --no-ff --no-commit 5334ffa5c`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: viewpoint-derivation-p2 into alfonso-frontend-jjtl (P-2026-09-29-0233)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `5334ffa5c` in `/Users/alfonso/jjodel-w-viewgen2`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 04c81327d` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/views.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the viewpoint-derivation-p2 merge (P-2026-09-29-0233)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-viewgen2`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
