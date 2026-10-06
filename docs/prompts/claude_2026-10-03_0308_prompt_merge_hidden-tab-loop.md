# Prompt: merge hidden-tab-loop into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-03-0308
Chat: —
Lane: full (merge; zero conflicts measured)
Status: eseguito 2026-10-03 · lane merge · cd348df03 · verifica visiva passata 2026-10-03 (chat, unattended, sonda interact vs after2; Alfonso al digest mattutino)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-03-0308 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `04dd1c7e5`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `hidden-tab-loop` into the trunk with one merge commit, `--no-ff`, of the explicit sha `08f442052`, in the shape of `b5427d7a5` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `ff93dc482`. The branch carries, on top of the base, 17 commits:

- `08f442052` docs(editor-v2): T9 closure, log entry, two tickets, Status (P-2026-10-02-1450)
- `1b40b2a03` merge: alfonso-frontend-jjtl into hidden-tab-loop, second (P-2026-10-02-1450)
- `efccfd70c` docs(editor-v2): T9 smoke addendum, figures from the final runs (P-2026-10-02-1450)
- `5d8379a85` docs(editor-v2): T9 addendum, the scripted interaction smoke (P-2026-10-02-1450)
- `4afbb321a` chore(probe): scripted interaction smoke and before/after compare (P-2026-10-02-1450)
- `69cea0d03` docs(editor-v2): T9 addendum, useTreeLayout effect at :170-194 (P-2026-10-02-1450)
- `fb70f03f2` docs(editor-v2): T9 addendum, the line-jump extension measured (P-2026-10-02-1450)
- `334a7e444` fix(editor-v2): line jumps follow the path registry (P-2026-10-02-1450)
- `91f700102` docs(editor-v2): T9 addendum, the vertex test is at useJjomSync.ts:1391 (P-2026-10-02-1450)
- `010254a66` docs(editor-v2): T9 Phase 2 addendum, results and the line-jump stop (P-2026-10-02-1450)
- `5921a6c06` chore(probe): edge-selection phases and fix B mutations (P-2026-10-02-1450)
- `c7380822c` fix(editor-v2): a sync patch that changes nothing keeps identity (P-2026-10-02-1450)
- `c99cb758b` feat(editor-v2): structural equality and identity-keeping edge merge (P-2026-10-02-1450)
- `ec57a268d` merge: alfonso-frontend-jjtl into hidden-tab-loop (P-2026-10-02-1450)
- `0a2ad8c7a` docs(editor-v2): discovery of the idle render loop, T9 (P-2026-10-02-1450)
- `a114b7bf9` chore(probe): idle render-loop probe for editor tabs (P-2026-10-02-1450)
- `788d3659d` docs: add prompt P-2026-10-02-1450, hidden tab render loop (T9)

The trunk carries, since the base, 1 commit:

- `04dd1c7e5` docs: add prompt P-2026-10-03-0250, merge sim-state-face into alfonso-frontend-jjtl

Measured by `lane-run merge` at 2026-10-03 03:08, trunk at `04dd1c7e5`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 08f442052`: zero conflicts.
- Files changed since the base: 11 on the branch side, 1 on the trunk side; on both sides: none.
- `git diff --name-only ff93dc482 08f442052 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-10-02_1450_prompt_hidden_tab_render_loop.md` (eseguito 2026-10-03 · lane hidden-tab-loop · 4afbb321a · verifica visiva passata 2026-10-03 (scripted interaction smoke and scene dumps by the lane, crops md5-checked by the chat; Alfonso's own check pending in the morning digest)).
- `git worktree list`: `hidden-tab-loop` in `/Users/alfonso/jjodel-w-hiddenloop`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `08f442052` is the tip of `hidden-tab-loop`; the prompt files of the branch read `Status: eseguito` at `08f442052`; `git worktree list` shows `hidden-tab-loop` only in `/Users/alfonso/jjodel-w-hiddenloop`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 08f442052` (measured above: zero conflicts). `git diff --name-only ff93dc482 08f442052 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only ff93dc482 alfonso-frontend-jjtl` with `git diff --name-only ff93dc482 08f442052` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/jjscript.md`: the heading `## 2026-10-03 — fix(editor-v2): T9, the idle render loop of every editor holding an edge (P-2026-10-02-1450)` once (branch).
   - `docs/log-inbox/jjscript.md`: the heading `## 2026-10-03 — ticket: a selected edge keeps half of T9's loop running until a pane click` once (branch).
   - `docs/log-inbox/jjscript.md`: the heading `## 2026-10-03 — ticket: adding then deleting a reference leaves a handle slot on its target class` once (branch).
4. `git merge --no-ff --no-commit 08f442052`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: hidden-tab-loop into alfonso-frontend-jjtl (P-2026-10-03-0308)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `08f442052` in `/Users/alfonso/jjodel-w-hiddenloop`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 04dd1c7e5` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/jjscript.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the hidden-tab-loop merge (P-2026-10-03-0308)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-hiddenloop`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
