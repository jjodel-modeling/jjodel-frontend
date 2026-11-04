# Prompt: elk-open-cap takes the trunk before its own merge

Prompt-ID: P-2026-11-04-1053
Chat: C-2026-11-03-2317
Request: https://claude.ai/code/session_01DQt9R6hbytx4vz5aAdzQ8i (merge of elk-open-cap launched by chat C-2026-11-03-2317)
Lane: full (merge of the trunk into the branch; 1 conflict: `docs/log-inbox/hw-notation.md` measured)
Status: eseguito 2026-11-04 · lane elk-open-cap · 80f03e1b6 · verifica visiva passata 2026-11-04 (chat, unattended; Alfonso in the morning digest)

Worktree: `/Users/alfonso/jjodel-w-elkcap`, branch `elk-open-cap`, a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-elkcap`, branch `elk-open-cap`, `git log -1` is the commit that adds this file (its parent `8fae6564d`), `git status` empty apart from gitignored `frontend/scripts/smoke/_tmp_*`, `MERGE_HEAD` absent. Otherwise stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-04-1053 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

## COSA

RC-14: a branch resolves its conflicts with the trunk on the branch, before the trunk takes it. Bring the trunk `alfonso-frontend-jjtl` at the explicit sha `32ca59c2d` into `elk-open-cap` with one merge commit, `--no-ff`, in the shape of `4325ec678` (the last merge commit on `elk-open-cap`; read its body first). Merge base `32b9c87d3`. The trunk brings, since the base, 22 commits:

- `32ca59c2d` docs: Status flip and log entry for the canvas-mount-unmeasured merge (P-2026-11-04-1038)
- `9abc989ff` merge: canvas-mount-unmeasured into alfonso-frontend-jjtl (P-2026-11-04-1038)
- `62580d5b8` docs: add prompt P-2026-11-04-1038, merge canvas-mount-unmeasured into alfonso-frontend-jjtl
- `58bcb36f8` docs: log entry, ELK ticket and Status of P-2026-11-04-1012
- `6f08e076f` docs: add prompt P-2026-11-04-1012, off-screen edge check
- `c4ecbb6a4` docs: log entry and Status, ceiling stop of P-2026-11-04-0925
- `5eb1942b3` docs: LIR figures, ceiling stop of P-2026-11-04-0925
- `ad34b896f` docs: Status flip and log entry for the jjtl-let-multiplicity merge (P-2026-11-04-0936)
- `3161cc583` merge: jjtl-let-multiplicity into alfonso-frontend-jjtl (P-2026-11-04-0936)
- `c25d3160d` docs: add prompt P-2026-11-04-0936, merge jjtl-let-multiplicity into alfonso-frontend-jjtl
- `0740d511f` feat(editor-v2): skip React Flow's forced first mount on large canvases (P-2026-11-04-0925)
- `46da7fabe` docs(jjtl): R-JTG-22 amended, abstract class in a let body (P-2026-11-04-0900)
- `06ce85232` feat(jjtl): an abstract class created in a let body is an error (P-2026-11-04-0900)
- `be8e2eed2` feat(editor-v2): unmeasured-node decoration helpers and test (P-2026-11-04-0925)
- `4e709eb59` docs: add prompt P-2026-11-04-0925, canvas mount continued
- `ca888071f` wip: canvas mount helpers, ceiling stop of P-2026-11-04-0901
- `0216e8a71` docs: Status flip and log entry, let body class and [*] (P-2026-11-04-0900)
- `5eaae6544` docs(jjtl): R-JTG-21 [*] settled, R-JTG-22 let bodies; SPEC 4.4, 10, 12 (P-2026-11-04-0900)
- `b5cfa4a85` docs: LIR, skip the forced first mount of never-measured nodes (P-2026-11-04-0901)
- `96b79cec3` feat(jjtl): missing class in a let body is an error; [n..*] creates n (P-2026-11-04-0900)
- `9a8c9ecbd` docs: add prompt P-2026-11-04-0901, skip the forced first mount
- `c79411ef2` docs: add prompt P-2026-11-04-0900, let body class and [*]

This branch brings, 9 commits:

- `8fae6564d` docs: Status flip for the route A crops read (P-2026-11-04-1042)
- `96c3d0093` docs: add prompt P-2026-11-04-1042, look at the route A crops
- `06b4f4aaa` docs: Status flip for the ELK open cap (P-2026-11-04-0926)
- `5432f8570` docs: log entries for the ELK trace and the open cap (P-2026-11-04-0926)
- `f33424346` fix(editor-v2): the open cap counts the objects of the graph's model (P-2026-11-04-0926)
- `ca94f5a36` fix(editor-v2): no auto-layout on open above 500 nodes or edges (P-2026-11-04-0926)
- `508aa0815` docs: add prompt P-2026-11-04-0926, ELK open cap
- `62ddd6b09` docs: discovery, ELK auto-layout on open freeze (P-2026-11-04-0902)
- `a77e47fe3` docs: add prompt P-2026-11-04-0902, trace the ELK freeze

Measured by `lane-run merge --trunk-into` at 2026-11-04 10:53, trunk at `32ca59c2d`:

- `git merge-tree --write-tree --name-only elk-open-cap 32ca59c2d`: 1 conflict: `docs/log-inbox/hw-notation.md`.
- Files changed since the base: 8 on the branch side, 15 on the trunk side; on both sides: `docs/log-inbox/hw-notation.md`, `frontend/src/components/editor-v2/EditorV2.tsx`.
- `git diff --name-only 32b9c87d3 8fae6564d -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-04_0902_prompt_elk_open_trace.md` (eseguito 2026-11-04 · lane elk-open-trace · report docs/discovery/discovery_2026-11-04_elk_open_freeze.md · app reproduction not tried), `claude_2026-11-04_0926_prompt_elk_open_cap.md` (eseguito 2026-11-04 · lane elk-open-cap · commits ca94f5a36, f33424346 · cap 500 nodes or edges, model objects counted · app probe on b10_8, no hand run), `claude_2026-11-04_1042_prompt_canvas_crop_read.md` (eseguito 2026-11-04 · read only, report in chat).
- `git worktree list`: `elk-open-cap` in `/Users/alfonso/jjodel-w-elkcap`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

## COME

1. Preconditions above, plus: `32ca59c2d` is the tip of `alfonso-frontend-jjtl` (if a docs-only commit moved it, say so and merge `32ca59c2d` all the same); `git worktree list` shows `alfonso-frontend-jjtl` only in `/Users/alfonso/jjodel-release`.
2. Measure again: `git merge-tree --write-tree --name-only elk-open-cap 32ca59c2d` (measured above: 1 conflict: `docs/log-inbox/hw-notation.md`). A conflict in any file outside `docs/decisions.md` and `docs/log-inbox/*.md`: **stop** with `Outcome: question` and the conflict hunks quoted; do not resolve code by hand in this lane.
3. `git merge --no-ff --no-commit 32ca59c2d`.
4. Resolve `docs/decisions.md`, if it conflicts, by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block, each section heading once. Resolve every `docs/log-inbox/*.md` that conflicts by union: preamble, the trunk's entries, then the branch's entries, all verbatim, each heading once. Probes on the resolved tree, each counted with `grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-JTG-21` (trunk), `R-JTG-22` (trunk); control: `- **R-JTG-23**` none.
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-04 — docs: discovery, ELK auto-layout on open freeze (P-2026-11-04-0902)` once (branch).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-04 — fix(editor-v2): no auto-layout on open above 500 nodes or edges (P-2026-11-04-0926)` once (branch).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-04 — feat(jjtl): missing class in a let body is an error; [*] settled (P-2026-11-04-0900)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-04 — feat(jjtl): abstract class in a let body is an error (P-2026-11-04-0900, follow-up)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-04 — merge: jjtl-let-multiplicity into alfonso-frontend-jjtl (P-2026-11-04-0936)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-04 — feat(editor-v2): skip React Flow's forced first mount on large canvases (P-2026-11-04-0901, P-2026-11-04-0925)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-04 — ticket: Auto layout throws an ELK RangeError on a 200-class metamodel, on trunk too` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-04 — test(editor-v2): off-screen edges of route A on 200 flat classes (P-2026-11-04-1012)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-04 — merge: canvas-mount-unmeasured into alfonso-frontend-jjtl (P-2026-11-04-1038)` once (trunk).
5. On the resolved tree, before committing, read every file changed on both sides once from top to bottom (`docs/log-inbox/hw-notation.md`, `frontend/src/components/editor-v2/EditorV2.tsx`); an auto-merge is a textual result, not a semantic one: no conflict marker, no duplicated declaration, hook or selector, one root per component.
6. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: elk-open-cap takes alfonso-frontend-jjtl (P-2026-11-04-1053)`. Body: the two sides' shas, the merge-tree measurement, the union resolutions, the reading of step 5, `Model:` and `Co-Authored-By` trailers.
7. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: state the expectation first as the trunk tip's count (measure it read-only in `/Users/alfonso/jjodel-release` with `node /Users/alfonso/jjodel-w-elkcap/frontend/scripts/run-quiet.mjs vitest-trunk -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-release`/frontend`, the runner's log goes to this tree's `.agent-logs/`; do not write there) plus the tests this branch added, 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 8fae6564d` (this branch's own pre-merge tip; the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 8.
8. `Outcome: hard-stop`: the chat re-runs the visual probes of the branch on this tree and gives the GO. Do not start a server.
9. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane elk-open-cap · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/hw-notation.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry, elk-open-cap took the trunk (P-2026-11-04-1053)` (P16, RC-17). `Outcome: done`. The merge of `elk-open-cap` into the trunk gets its own prompt (`lane-run merge elk-open-cap --into alfonso-frontend-jjtl`).

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 7), `git checkout -- .`, `git clean`, `--no-verify`, a hand edit to a code file, editing any line inside a decision block or a log entry, rebase, squash, push, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-release`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge --trunk-into` from `frontend/scripts/lane-templates/trunk-into-branch.md`, in the shape of `claude_2026-09-27_0325_prompt_sim_profiles_take_trunk.md`.
