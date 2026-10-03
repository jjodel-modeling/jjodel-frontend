# Prompt: merge derived-notations-edges into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-03-1901
Chat: —
Lane: full (merge; zero conflicts measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-03-1901 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `4abc9bf24`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `derived-notations-edges` into the trunk with one merge commit, `--no-ff`, of the explicit sha `30b4acc4c`, in the shape of `ef5cb6a6f` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `6ea0b0b48`. The branch carries, on top of the base, 39 commits:

- `30b4acc4c` docs: Status flip, log entry and R-VP-54..57 (P-2026-10-03-1304)
- `e2aa28207` merge: alfonso-frontend-jjtl into derived-notations-edges (P-2026-10-03-1304)
- `44f67b10d` docs: fork and join out of the turn, measured; router open item (P-2026-10-03-1304)
- `f9829587f` probe: a Flowchart pane on DemoFlowB (P-2026-10-03-1304)
- `5ac537e8e` fix(derive): fork and join stay out of the bar turn (P-2026-10-03-1304)
- `d0fe030cc` merge: alfonso-frontend-jjtl into derived-notations-edges (P-2026-10-03-1304)
- `8d2ff7f1f` merge: alfonso-frontend-jjtl into derived-notations-edges (P-2026-10-03-1304)
- `b3453a89d` docs: Q3 implemented, measured, and the cost at rest (P-2026-10-03-1304)
- `c8285f5cf` probe: the turned bar, its ink, hit, ring and drag (P-2026-10-03-1304)
- `f4d768817` feat(derive): the bars in a square box with a thickness (P-2026-10-03-1304)
- `7d7d8e23d` feat(elk): Auto layout lays a turned bar out as drawn (P-2026-10-03-1304)
- `2d967f267` feat(ir): a bar with a thickness turns by its neighbours (P-2026-10-03-1304)
- `4bd9aa66f` docs: LIR addendum, the bar orientation implementation (P-2026-10-03-1304)
- `e3f5ba9d2` probe: bar orientation prototype, offline (P-2026-10-03-1304)
- `3c2645020` docs: Q3 bar orientation design and its Layer Impact Report (P-2026-10-03-1304)
- `534698e2f` probe: labels an edge crosses, and the transition labels (P-2026-10-03-1304)
- `3d4eefe06` feat(derive): Statechart transitions read event [guard] (P-2026-10-03-1304)
- `567423cd6` fix(derive): classic Petri arcs on the orthogonal router (P-2026-10-03-1304)
- `55643d7c7` merge: alfonso-frontend-jjtl into derived-notations-edges (P-2026-10-03-1304)
- `1127b2903` feat(editor-v2): VertexViewIR.visible; Statechart draws no event boxes (P-2026-10-03-1304)
- `c6e735672` probe: drawn nodes, event boxes and canvas height in the acceptance line (P-2026-10-03-1304)
- `1de7c1fcc` docs: Layer Impact Report, VertexViewIR.visible (P-2026-10-03-1304)
- `dde52ed6d` probe: bar handle sides and diamond ends in the acceptance line (P-2026-10-03-1304)
- `d914d540c` fix(editor-v2): bars take long sides, diamonds one end per vertex (P-2026-10-03-1304)
- `1f60fd7d8` docs: Layer Impact Report, the per-form side rule of an edge end (P-2026-10-03-1304)
- `d43083244` docs: LIR addendum, the name centred when no row is left (P-2026-10-03-1304)
- `e7c0761cc` fix(editor-v2): Statechart hides compartment rows with no value (P-2026-10-03-1304)
- `cd38655ea` docs: Layer Impact Report, compartment rows with no value hidden (P-2026-10-03-1304)
- `171aca4d8` probe: a close-up crop and the paths of every entry mark (P-2026-10-03-1304)
- `5691c3992` fix(editor-v2): the entry mark ends in the open arrowhead (P-2026-10-03-1304)
- `ae107a617` docs: Layer Impact Report, the open entry head (P-2026-10-03-1304)
- `09c094ec4` merge: alfonso-frontend-jjtl into derived-notations-edges (P-2026-10-03-1304)
- `efa396924` docs: report addendum, Phase 2 step 1 numbers (P-2026-10-03-1304)
- `52934d83f` probe: default panes, acceptance line and before/after compare (P-2026-10-03-1304)
- `104f2c0cf` fix(editor-v2): arcs fan out, bow round nodes, alone take ELK's route (P-2026-10-03-1304)
- `0562a2612` fix(editor-v2): BK alignment NONE; legs ELK drew straight stay straight (P-2026-10-03-1304)
- `e767c8c24` docs: discovery report, derived notations edges and layout (P-2026-10-03-1304)
- `b613c6fa3` probe: derived notations edges, anchors and layout (P-2026-10-03-1304)
- `ce52e6b46` docs: prompt for derived_notations_edges (P-2026-10-03-1304)

The trunk carries, since the base, 2 commits:

- `4abc9bf24` chore(harness): add jdirocco to the auto-intake allowlist (RC-41)
- `925dd79c4` docs: add prompt P-2026-10-03-1853, merge derived-notations-edges into alfonso-frontend-jjtl

Measured by `lane-run merge` at 2026-10-03 19:01, trunk at `4abc9bf24`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 30b4acc4c`: zero conflicts.
- Files changed since the base: 45 on the branch side, 3 on the trunk side; on both sides: `docs/decisions.md`.
- `git diff --name-only 6ea0b0b48 30b4acc4c -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-10-03_1304_prompt_derived_notations_edges.md` (eseguito 2026-10-03 · lane derived-notations-edges · e767c8c24 (discovery), 0562a2612, 104f2c0cf, 5691c3992, e7c0761cc, d914d540c, 1127b2903, 567423cd6, 3d4eefe06, 2d967f267, 7d7d8e23d, f4d768817, 5ac537e8e · gates: typecheck 14 (the §17 set), vitest 7088 passed (9 red at import, the §17 nine), build exit 0, probe 26/26 · verifica visiva passata 2026-10-03 (Alfonso)).
- `git worktree list`: `derived-notations-edges` in `/Users/alfonso/jjodel-w-dnotC`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `30b4acc4c` is the tip of `derived-notations-edges`; the prompt files of the branch read `Status: eseguito` at `30b4acc4c`; `git worktree list` shows `derived-notations-edges` only in `/Users/alfonso/jjodel-w-dnotC`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 30b4acc4c` (measured above: zero conflicts). `git diff --name-only 6ea0b0b48 30b4acc4c -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 6ea0b0b48 alfonso-frontend-jjtl` with `git diff --name-only 6ea0b0b48 30b4acc4c` (measured above: `docs/decisions.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-VP-54` (branch), `R-VP-55` (branch), `R-VP-56` (branch), `R-VP-57` (branch), `RC-41` (trunk); control: `- **RC-42**` none.
   - `docs/log-inbox/views.md`: the heading `## 2026-10-03 — feat(derive, editor-v2, elk): derived notations' edges, bars and layout (P-2026-10-03-1304)` once (branch).
4. `git merge --no-ff --no-commit 30b4acc4c`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: derived-notations-edges into alfonso-frontend-jjtl (P-2026-10-03-1901)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `30b4acc4c` in `/Users/alfonso/jjodel-w-dnotC`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 4abc9bf24` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/views.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the derived-notations-edges merge (P-2026-10-03-1901)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-dnotC`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
