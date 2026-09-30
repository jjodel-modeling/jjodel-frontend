# Prompt: merge edge-click-properties into alfonso-frontend-jjtl

Prompt-ID: P-2026-09-30-2105
Chat: C-2026-09-30-1940
Lane: full (merge; 1 conflict: `docs/log-inbox/views.md` measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-09-30-2105 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `31999a630`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `edge-click-properties` into the trunk with one merge commit, `--no-ff`, of the explicit sha `1079a9740`, in the shape of `524bdd3f1` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `45ff6c290`. The branch carries, on top of the base, 4 commits:

- `1079a9740` docs: R-ESEL rows, log entry, report addendum and Status (P-2026-09-30-1940)
- `bb0fd90c9` fix(editor-v2): an edge click shows the element the edge represents (P-2026-09-30-1940)
- `371804cf0` docs: discovery, edge click and the Properties panel (P-2026-09-30-1940)
- `25b44b2ce` docs: add prompt P-2026-09-30-1940, edge click shows reference or object-as-edge in Properties

The trunk carries, since the base, 11 commits:

- `31999a630` docs: Status flip and log entry for the viewpoint-metaclass-colors merge (P-2026-09-30-2000)
- `524bdd3f1` merge: viewpoint-metaclass-colors into alfonso-frontend-jjtl (P-2026-09-30-2000)
- `232c4eb89` docs: add prompt P-2026-09-30-2000, merge viewpoint-metaclass-colors into alfonso-frontend-jjtl
- `728291b21` docs: color by metaclass rework, R-VP-27..31, addendum, log, Status (P-2026-09-30-1815)
- `ce5e70027` docs: renumber this lane's R-VP rows in its log entry (P-2026-09-30-1815)
- `390bcaddd` feat: analogous metaclass palette, coloured selected header (P-2026-09-30-1815)
- `c76656bbc` merge: alfonso-frontend-jjtl (45ff6c290) into viewpoint-metaclass-colors (P-2026-09-30-1815)
- `55b4a33ef` docs: color by metaclass, R-VP-19..23, log entry, Status (P-2026-09-30-1815)
- `fa0b20de1` feat: viewpoint option color by metaclass (P-2026-09-30-1815)
- `c29280962` docs: discovery, viewpoint color by metaclass (P-2026-09-30-1815)
- `0c2348f39` docs: prompt viewpoint metaclass colors (P-2026-09-30-1815)

Measured by `lane-run merge` at 2026-09-30 21:05, trunk at `31999a630`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 1079a9740`: 1 conflict: `docs/log-inbox/views.md`.
- Files changed since the base: 8 on the branch side, 12 on the trunk side; on both sides: `docs/decisions.md`, `docs/log-inbox/views.md`.
- `git diff --name-only 45ff6c290 1079a9740 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-09-30_1940_prompt_edge_click_properties.md` (eseguito 2026-09-30 · lane edge-click-properties · bb0fd90c9 · non fuso: hard-stop, lane probe on 3097 (light) 50/51 (the red: no clickable point on t1's visible line, as in the before run), four demo scenes 0 px, mutation bench 12/12, crops in frontend/scripts/smoke/_tmp_edgesel_crops/ (gitignored), verifica visiva alla chat).
- `git worktree list`: `edge-click-properties` in `/Users/alfonso/jjodel-w-edgesel`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-09-30-2105/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `1079a9740` is the tip of `edge-click-properties`; the prompt files of the branch read `Status: eseguito` at `1079a9740`; `git worktree list` shows `edge-click-properties` only in `/Users/alfonso/jjodel-w-edgesel`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 1079a9740` (measured above: 1 conflict: `docs/log-inbox/views.md`). `git diff --name-only 45ff6c290 1079a9740 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 45ff6c290 alfonso-frontend-jjtl` with `git diff --name-only 45ff6c290 1079a9740` (measured above: `docs/decisions.md`, `docs/log-inbox/views.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-ESEL-1` (branch), `R-ESEL-2` (branch), `R-ESEL-3` (branch), `R-ESEL-4` (branch), `R-ESEL-5` (branch), `R-VP-27` (trunk), `R-VP-28` (trunk), `R-VP-29` (trunk), `R-VP-30` (trunk), `R-VP-31` (trunk); control: `- **R-VP-32**` none.
   - `docs/decisions.md`: the heading `## Serie R-ESEL — the edge click and the Properties panel (decisions 2026-09-30)` once (branch).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-30 — fix(editor-v2): an edge click shows the element the edge represents (P-2026-09-30-1940)` once (branch).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-30 — ticket: an inheritance edge click shows the empty panel, a lifted edge click shows nothing` once (branch).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-30 — feat(views): viewpoint option «Color by metaclass», palette, text contrast, border on/off (P-2026-09-30-1815)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-30 — feat(views): «Color by metaclass» rework, analogous palette, coloured selected header (P-2026-09-30-1815)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-30 — merge: viewpoint-metaclass-colors into alfonso-frontend-jjtl (P-2026-09-30-2000)` once (trunk).
4. `git merge --no-ff --no-commit 1079a9740`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: edge-click-properties into alfonso-frontend-jjtl (P-2026-09-30-2105)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `1079a9740` in `/Users/alfonso/jjodel-w-edgesel`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 31999a630` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/views.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the edge-click-properties merge (P-2026-09-30-2105)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-edgesel`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
