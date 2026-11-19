# Prompt: merge multi-tab-l4c into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-19-1705
Chat: C-2026-11-18-2337
Request: https://claude.ai/code/session_01DQt9R5BmL7gprPWEQuuqbP (merge of multi-tab-l4c launched by chat C-2026-11-18-2337)
Lane: full (merge; zero conflicts measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-19-1705 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `2f9277a66`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `multi-tab-l4c` into the trunk with one merge commit, `--no-ff`, of the explicit sha `8b5ff3c6b`, in the shape of `a4f62729e` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `2f9277a66`. The branch carries, on top of the base, 12 commits:

- `8b5ff3c6b` docs: log entry for multi-tab L4d (P-2026-11-19-1625)
- `ea99c4c40` docs: Status flips for multi-tab L4d (P-2026-11-19-1625)
- `eaad9e54d` docs: ticket, composition writer never finds the child (P-2026-11-19-1625)
- `9f73ac082` docs: L4d as implemented, report §11.5 and R-MT-29 (P-2026-11-19-1625)
- `d0c786696` fix(editor-v2): no clear from a model-less editor (P-2026-11-19-1625)
- `b2d26da5d` docs: add prompt P-2026-11-19-1625, L4d relaunch with the go-ahead
- `466ebd05c` docs: add prompt P-2026-11-19-1610, multi-tab L4d model-less release
- `fc5a1f552` docs: Status flip and log entry for multi-tab L4c (P-2026-11-19-1530)
- `dfef10a39` docs: L4c as implemented, report §11 and R-MT-29 (P-2026-11-19-1530)
- `2837e117d` fix(editor-v2): sync registries keyed by model (P-2026-11-19-1530)
- `c4c17628e` docs: add prompt P-2026-11-19-1530, multi-tab L4c registries by model
- `4c93f72f0` docs: copy the editor groups discovery from multi-tab-groups (5fa416d90)

The trunk carries, since the base, 0 commits:

- none

Measured by `lane-run merge` at 2026-11-19 17:05, trunk at `2f9277a66`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 8b5ff3c6b`: zero conflicts.
- Files changed since the base: 17 on the branch side, 0 on the trunk side; on both sides: none.
- `git diff --name-only 2f9277a66 8b5ff3c6b -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-19_1530_prompt_multi-tab-l4c-registries-by-model.md` (eseguito 2026-11-19 · lane full · 2837e117d, dfef10a39 · verifica visiva non applicabile (no visual change; chat check 2026-11-19 15:57 on the probe numbers: S1 5 registered edges kept, S2 Families 8 edges stable, S3 drag kept, S4 drop one node no duplicate edge, S5 save/reload identical; gates green)), `claude_2026-11-19_1610_prompt_multi-tab-l4d-no-model-release.md` (superseded by P-2026-11-19-1625 (blocked: the critical-zone hook refused its edits without the go-ahead flag; its tests and plan were carried by the relaunch)), `claude_2026-11-19_1625_prompt_multi-tab-l4d-relaunch.md` (eseguito 2026-11-19 · lane full · d0c786696, 9f73ac082, eaad9e54d · verifica visiva non applicabile (no visual change; chat check 2026-11-19 16:46 on the probe numbers: S1-S5 pass as in L4c, S6 edge kept, mark check fails for a pre-existing reason, the composition writer never finds the child vertex, ticket filed, low priority; gates green)).
- `git worktree list`: `multi-tab-l4c` in `/Users/alfonso/jjodel-w-mtl4c`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Findings.** `lane-run merge` refuses `--launch` on this measurement:

- branch prompts whose Status is not eseguito: `claude_2026-11-19_1610_prompt_multi-tab-l4d-no-model-release.md` (superseded by P-2026-11-19-1625 (blocked: the critical-zone hook refused its edits without the go-ahead flag; its tests and plan were carried by the relaunch))

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `8b5ff3c6b` is the tip of `multi-tab-l4c`; the prompt files of the branch read `Status: eseguito` at `8b5ff3c6b`; `git worktree list` shows `multi-tab-l4c` only in `/Users/alfonso/jjodel-w-mtl4c`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 8b5ff3c6b` (measured above: zero conflicts). `git diff --name-only 2f9277a66 8b5ff3c6b -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 2f9277a66 alfonso-frontend-jjtl` with `git diff --name-only 2f9277a66 8b5ff3c6b` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-MT-29` (branch); control: `- **R-MT-30**` none.
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-19 — fix: sync registries keyed by model (multi-tab L4c)` once (branch).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-19 — ticket: createCompositionEdgeForObjects never finds the child vertex` once (branch).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-19 — fix: no clear from a model-less editor, composition edges by model (multi-tab L4d)` once (branch).
4. `git merge --no-ff --no-commit 8b5ff3c6b`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: multi-tab-l4c into alfonso-frontend-jjtl (P-2026-11-19-1705)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `8b5ff3c6b` in `/Users/alfonso/jjodel-w-mtl4c`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-mtl4c`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 2f9277a66` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only 2f9277a66 HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/multi-tab.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the multi-tab-l4c merge (P-2026-11-19-1705)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-mtl4c`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
