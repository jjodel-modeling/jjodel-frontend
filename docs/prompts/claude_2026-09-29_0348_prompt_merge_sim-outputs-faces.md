# Prompt: merge sim-outputs-faces into alfonso-frontend-jjtl

Prompt-ID: P-2026-09-29-0348
Chat: C-2026-09-28-1936
Lane: full (merge; 1 conflict: `docs/log-inbox/simulation.md` measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-09-29-0348 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `91257e719`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `sim-outputs-faces` into the trunk with one merge commit, `--no-ff`, of the explicit sha `0a84308a6`, in the shape of `79c3bd83c` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `c2560b69e`. The branch carries, on top of the base, 9 commits:

- `0a84308a6` docs(sim): R-SIM-95, the outputs faces lane entry and Status (P-2026-09-29-0300)
- `c926d803a` fix(sim): Mealy's output right after the input in «Last step» (P-2026-09-29-0300)
- `f255d7d0c` feat(sim): the faces in the panel, accepting and Output (P-2026-09-29-0300)
- `d89ecce7b` feat(sim): the accepting mark, the Output line, Mealy's output (P-2026-09-29-0300)
- `1e8051c3e` feat(sim): DFA, NFA, Moore, Mealy in the selects; their M2 rows (P-2026-09-29-0300)
- `8240715c3` fix(sim): an Accepting class is a node in the overlap check (P-2026-09-29-0300)
- `ffd8c4c16` docs(prompts): P-2026-09-29-0300 outputs faces phase 2
- `904bab148` docs(sim): discovery of the outputs faces and hidden presets (P-2026-09-29-0239)
- `07dd278e3` docs(prompts): P-2026-09-29-0239 discovery outputs faces

The trunk carries, since the base, 12 commits:

- `91257e719` docs: Status flip and log entry for the derive-viewpoint-m2-only merge (P-2026-09-29-0315)
- `79c3bd83c` merge: derive-viewpoint-m2-only into alfonso-frontend-jjtl (P-2026-09-29-0315)
- `828fca515` docs: add prompt P-2026-09-29-0315, merge derive-viewpoint-m2-only into alfonso-frontend-jjtl
- `dfed9ea9f` docs: Status flip and log entry for the derive-viewpoint-m2-only lane (P-2026-09-29-0305)
- `f2e5b086e` fix(tree): «Derive viewpoint» only on metamodel rows (P-2026-09-29-0305)
- `424ca4a00` docs(prompts): P-2026-09-29-0305 derive viewpoint on metamodel rows only
- `76c7b4f7f` docs: Status flip and log entry for the viewpoint-derivation merge (P-2026-09-29-0259)
- `8a183be5a` merge: viewpoint-derivation into alfonso-frontend-jjtl (P-2026-09-29-0259)
- `4c05e020f` docs: add prompt P-2026-09-29-0259, merge viewpoint-derivation into alfonso-frontend-jjtl
- `1d707831f` docs: Status flip and log entry for the demo-script-data-level merge (P-2026-09-29-0238)
- `6c7dc7b33` docs(views): viewpoint derivation discovery, log entry, Status (P-2026-09-29-0111)
- `f55571b41` docs(prompts): P-2026-09-29-0111 discovery viewpoint derivation

Measured by `lane-run merge` at 2026-09-29 03:48, trunk at `91257e719`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 0a84308a6`: 1 conflict: `docs/log-inbox/simulation.md`.
- Files changed since the base: 14 on the branch side, 12 on the trunk side; on both sides: `docs/log-inbox/simulation.md`.
- `git diff --name-only c2560b69e 0a84308a6 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-09-29_0239_prompt_discovery_sim_outputs_faces.md` (eseguito 2026-09-29 · lane discovery sim-outputs-faces-disc · measured on 07dd278e3; the report is in the commit that carries this line (a commit cannot name its own sha) · Outcome: hard-stop), `claude_2026-09-29_0300_prompt_sim_outputs_faces_p2.md` (eseguito 2026-09-29 · lane sim-outputs-faces · 8240715c3, 1e8051c3e, d89ecce7b, f255d7d0c, c926d803a · non fuso: hard-stop, crop in docs/discovery/harness/_tmp_faces_*.png (gitignored), R-SIM-95 nel commit docs, le quattro scene le sonda la chat).
- `git worktree list`: `sim-outputs-faces` in `/Users/alfonso/jjodel-w-faces2`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-09-29-0348/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `0a84308a6` is the tip of `sim-outputs-faces`; the prompt files of the branch read `Status: eseguito` at `0a84308a6`; `git worktree list` shows `sim-outputs-faces` only in `/Users/alfonso/jjodel-w-faces2`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 0a84308a6` (measured above: 1 conflict: `docs/log-inbox/simulation.md`). `git diff --name-only c2560b69e 0a84308a6 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only c2560b69e alfonso-frontend-jjtl` with `git diff --name-only c2560b69e 0a84308a6` (measured above: `docs/log-inbox/simulation.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-SIM-95` (branch); control: `- **R-SIM-96**` none.
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-29 — discovery: the faces of Accepting and outputs, their M2 rows, the four hidden presets (P-2026-09-29-0239)` once (branch).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-29 — feat: DFA, NFA, Moore, Mealy in the selects; the faces of Accepting and outputs (P-2026-09-29-0300)` once (branch).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-29 — merge: demo-script-data-level into alfonso-frontend-jjtl (P-2026-09-29-0238)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-29 — docs(views): discovery, deriving a viewpoint from a metamodel into the view IR (P-2026-09-29-0111)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-29 — merge: viewpoint-derivation into alfonso-frontend-jjtl (P-2026-09-29-0259)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-29 — fix(tree): «Derive viewpoint» only on metamodel rows (P-2026-09-29-0305)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-29 — merge: derive-viewpoint-m2-only into alfonso-frontend-jjtl (P-2026-09-29-0315)` once (trunk).
4. `git merge --no-ff --no-commit 0a84308a6`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: sim-outputs-faces into alfonso-frontend-jjtl (P-2026-09-29-0348)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `0a84308a6` in `/Users/alfonso/jjodel-w-faces2`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 91257e719` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/simulation.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the sim-outputs-faces merge (P-2026-09-29-0348)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-faces2`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
