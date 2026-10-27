# Prompt: merge petri-ink-ports into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-04-0044
Chat: C-2026-10-03-1610
Lane: full (merge; zero conflicts measured)
Status: eseguito 2026-10-04 · lane merge · 544fbd19f · verifica visiva passata 2026-10-04 (Chat smoke 2026-10-04 00:55 on 544fbd19f: 3001 HTTP 200; IRNodeContent.tsx, irEdgeViews.ts, handlePosition.ts served and compiled (200). Visual check (RC-23) done by the chat on the branch crops of P-2026-10-04-0010 (Petri classic at rest light and dark, Activity after Auto layout dark): Petri bars readable in both themes, place names off the arrowheads, handles as on the trunk. Eight gates green. GO.)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-04-0044 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `95c38845d`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `petri-ink-ports` into the trunk with one merge commit, `--no-ff`, of the explicit sha `a24c5d5b5`, in the shape of `18926660a` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `95c38845d`. The branch carries, on top of the base, 14 commits:

- `a24c5d5b5` docs: closure of petri-ink-ports without A3, R-VP-58/59 ratified (P-2026-10-04-0010)
- `04c13e039` revert: A3, handles on ELK-routed ends, R-VP-60 withdrawn (P-2026-10-04-0010)
- `00de5a681` merge: the trunk into petri-ink-ports (P-2026-10-04-0010)
- `3d9c70545` docs: add prompt P-2026-10-04-0010
- `17969f5d7` docs: closure of petri-ink-ports, R-VP-58 to R-VP-60 provisional (P-2026-10-03-1920)
- `ad776870f` merge: the trunk into petri-ink-ports (P-2026-10-03-1920)
- `dc893ce3c` probe: petri-ink-ports reads the last ELK call, handles along the side (P-2026-10-03-1920)
- `679d68710` fix(editor-v2): an outside label takes a side no edge end holds (P-2026-10-03-1920)
- `6756eddd2` fix(editor-v2): handles of an ELK-routed edge on its drawn ends (P-2026-10-03-1920)
- `7bc8a6f3b` fix(derive): Petri bars and the flowchart Initial disc in the name ink (P-2026-10-03-1920)
- `40d39b6d1` docs: LIR of P-2026-10-03-1920 confirmed for Phase 2 (P-2026-10-03-1920)
- `86f72070f` docs: discovery and LIR, Petri ink, label sides, ELK ports (P-2026-10-03-1920)
- `5fda3c12f` probe: glyph ink, place labels and ELK ports on the demo exports (P-2026-10-03-1920)
- `517a7fb4d` docs: add prompt P-2026-10-03-1920

The trunk carries, since the base, 0 commits:

- none

Measured by `lane-run merge` at 2026-10-04 00:44, trunk at `95c38845d`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl a24c5d5b5`: zero conflicts.
- Files changed since the base: 19 on the branch side, 0 on the trunk side; on both sides: none.
- `git diff --name-only 95c38845d a24c5d5b5 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-10-03_1920_prompt_petri_ink_ports.md` (eseguito 2026-10-03 · lane petri-ink-ports · 7bc8a6f3b (item 1), 6756eddd2 (item 3), 679d68710 (item 2), probe 5fda3c12f, dc893ce3c · non fuso: hard-stop, A1-A3 provisional (R-VP-58, R-VP-60, R-VP-59) awaiting Alfonso · gates: typecheck 14 (the §17 set), vitest 7184 passed (the §17 nine at import, criticalZone.test.ts red only under this lane's go-ahead variable, 70/70 without), build exit 0 · probe on 3080 64/64: glyphs 12.59:1 dark and 16.3:1 light (min), no outside label within 4 px of an arrowhead (rest, RIGHT, DOWN), handles on the drawn ends along the side but work->d1 (6 px), 0 extra bends, the four default panes identical light and dark (dump and crops byte for byte) · mutation bench 28/29 (the survivor equivalent) · crops in ~/.jjodel-lanes/P-2026-10-03-1920/crops/ · verifica visiva alla chat), `claude_2026-10-04_0010_prompt_petri_drop_a3.md` (eseguito 2026-10-04 · lane petri-ink-ports · trunk taken 00de5a681, revert of A3 04c13e039 (irLabelAnchors.test.ts:77 added by the chat's GO option 1) · non fuso: hard-stop · R-VP-58 and R-VP-59 ratified, R-VP-60 withdrawn until after Málaga · gates: typecheck 14 (the §17 set), build exit 0, vitest full re-run after the commits (closing report) · probe on 3080 64/64: A1 16.3:1 light, 12.59:1 dark; A2 no outside label within 4 px of an arrowhead (rest, Auto layout, DOWN; min 17.52 px); handles 34 of 68 ends off after Auto layout, the trunk's ends and figures; the four default panes identical to the trunk-code run (8/8, crops byte for byte 16/16) · crops in ~/.jjodel-lanes/P-2026-10-04-0010/crops/).
- `git worktree list`: `petri-ink-ports` in `/Users/alfonso/jjodel-w-petriports`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-10-04-0044/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `a24c5d5b5` is the tip of `petri-ink-ports`; the prompt files of the branch read `Status: eseguito` at `a24c5d5b5`; `git worktree list` shows `petri-ink-ports` only in `/Users/alfonso/jjodel-w-petriports`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl a24c5d5b5` (measured above: zero conflicts). `git diff --name-only 95c38845d a24c5d5b5 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 95c38845d alfonso-frontend-jjtl` with `git diff --name-only 95c38845d a24c5d5b5` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-VP-58` (branch), `R-VP-59` (branch), `R-VP-60` (branch); control: `- **R-VP-61**` none.
   - `docs/log-inbox/views.md`: the heading `## 2026-10-03 — fix(derive, editor-v2): Petri ink in dark, outside labels off the edge ends, handles on ELK ends (P-2026-10-03-1920)` once (branch).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-04 — revert(editor-v2): A3 dropped, handles as on the trunk; R-VP-58 and R-VP-59 ratified (P-2026-10-04-0010)` once (branch).
4. `git merge --no-ff --no-commit a24c5d5b5`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: petri-ink-ports into alfonso-frontend-jjtl (P-2026-10-04-0044)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `a24c5d5b5` in `/Users/alfonso/jjodel-w-petriports`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 95c38845d` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/views.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the petri-ink-ports merge (P-2026-10-04-0044)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-petriports`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
