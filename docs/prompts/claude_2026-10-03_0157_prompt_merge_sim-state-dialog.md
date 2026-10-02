# Prompt: merge sim-state-dialog into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-03-0157
Chat: C-2026-10-02-2340
Lane: full (merge; 1 conflict: `docs/log-inbox/simulation.md` measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-03-0157 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `7aba76bfa`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `sim-state-dialog` into the trunk with one merge commit, `--no-ff`, of the explicit sha `f580d8f78`, in the shape of `788570c06` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `fece79bc3`. The branch carries, on top of the base, 6 commits:

- `f580d8f78` docs: closure of Lane B sim-state-dialog, Status and entry (P-2026-10-03-0041)
- `b4b32bd72` docs: the model dialog's rows have no Globals heading of their own (P-2026-10-03-0041)
- `a57092326` fix(sim): kind chips in entity colours, Globals once in the model dialog (P-2026-10-03-0041)
- `0889e83be` docs: the demo script reads the State dialog (P-2026-10-03-0041)
- `b8ac89fcd` feat(sim): State page in two columns, Written by and Read by (P-2026-10-03-0041)
- `9980db732` docs: add prompt P-2026-10-03-0041, Lane B sim-state-dialog

The trunk carries, since the base, 43 commits:

- `7aba76bfa` docs: Status flip and log entry for the elk-layout-disc merge (P-2026-10-03-0126)
- `788570c06` merge: elk-layout-disc into alfonso-frontend-jjtl (P-2026-10-03-0126)
- `a1b8aa196` docs: add prompt P-2026-10-03-0126, merge elk-layout-disc into alfonso-frontend-jjtl
- `15a17ba08` docs: Status flip of P-2026-10-03-0050 (elk-layout-disc took the trunk)
- `f7131a405` docs: Status flip and log entry for the sim-state-model merge (P-2026-10-03-0114)
- `2a60dbd3d` merge: sim-state-model into alfonso-frontend-jjtl (P-2026-10-03-0114)
- `651630c43` docs: add prompt P-2026-10-03-0114, merge sim-state-model into alfonso-frontend-jjtl
- `6ae536200` docs: Lane A sim-state-model, log entry and Status (P-2026-10-03-0040)
- `14311a636` feat(sim): kept configurations, the viewed step, viewer prefs (P-2026-10-03-0040)
- `47d6dc97d` docs: Status flip and log entry for the sim-state-disc merge (P-2026-10-03-0032)
- `6a1cea69b` merge: elk-layout-disc takes alfonso-frontend-jjtl (P-2026-10-03-0050)
- `39fc1cb7d` docs: add prompt P-2026-10-03-0050, merge alfonso-frontend-jjtl into elk-layout-disc
- `07bca00e2` docs: Status flip and log entry for the ir-ink-outside merge (P-2026-10-03-0038)
- `a48a8aefa` merge: ir-ink-outside into alfonso-frontend-jjtl (P-2026-10-03-0038)
- `1c63fca7c` docs: Status flip of P-2026-10-02-1718 (elk-layout-disc took the trunk)
- `bf3c91287` docs: add prompt P-2026-10-03-0038, merge ir-ink-outside into alfonso-frontend-jjtl
- `6dc5fdc4b` merge: sim-state-disc into alfonso-frontend-jjtl (P-2026-10-03-0032)
- `916d45977` docs: add prompt P-2026-10-03-0040, Lane A sim-state-model
- `18ade0d0d` docs: add prompt P-2026-10-03-0032, merge sim-state-disc into alfonso-frontend-jjtl
- `d5defd00d` docs: report addendum, R-VP-51, log entry, Status (P-2026-10-02-2356)
- `cce1ecfef` fix(ir): outside marks of a coloured node keep the notation ink (P-2026-10-02-2356)
- `770b3ddc9` docs: discovery, outside marks of a coloured node keep the ink (P-2026-10-02-2356)
- `850718308` docs: add prompt P-2026-10-02-2356, outside marks of a coloured node keep the notation ink
- `7c9ae4e0d` docs: merge-gate ticket in the ticket entry format
- `52a06669f` docs: Status of P-2026-10-02-2315 (superseded by 2330) and merge-gate ticket on the worktree node_modules link
- `3d9a1702b` docs: Status flip and log entry for the vp-glyph-nocolor merge (P-2026-10-02-2330)
- `e2e4fbc35` merge: vp-glyph-nocolor into alfonso-frontend-jjtl (P-2026-10-02-2330)
- `99520574e` docs: add prompt P-2026-10-02-2330, merge vp-glyph-nocolor into alfonso-frontend-jjtl
- `8ef9e3c48` docs: add prompt P-2026-10-02-2315, merge vp-glyph-nocolor into alfonso-frontend-jjtl
- `e6bbc9829` docs: report addendum, R-VP-50, log entry, ticket, Status (P-2026-10-02-2045)
- `00b16d998` fix(views): notation glyphs keep their colours under Color by metaclass (P-2026-10-02-2045)
- `353fa49b4` docs: discovery, notation glyphs out of Color by metaclass (P-2026-10-02-2045)
- `c14dc0c67` docs: add prompt P-2026-10-02-2045, notation glyphs out of Color by metaclass
- `693f10008` merge: elk-layout-disc takes alfonso-frontend-jjtl (P-2026-10-02-1718)
- `99c2a43ac` docs: add prompt P-2026-10-02-1718, merge alfonso-frontend-jjtl into elk-layout-disc
- `a7d2a3f91` docs: R-VP-37..47, Phase 2 results, log entry, Status (P-2026-10-01-2215)
- `803b84e3a` feat(editor-v2): toolbar auto-layout uses ELK in full (P-2026-10-01-2215)
- `ccba4b030` docs: Phase 2 plan addendum, ELK routes drawn by UnifiedEdge (P-2026-10-01-2215)
- `5c9aadb1c` merge: alfonso-frontend-jjtl (c3a9c9ffd) into elk-layout-disc (P-2026-10-01-2215)
- `57c150a2a` docs: add Phase 2 prompt for P-2026-10-01-2215, ELK auto-layout used in full
- and 3 more: `git log --oneline fece79bc3..7aba76bfa`

Measured by `lane-run merge` at 2026-10-03 01:57, trunk at `7aba76bfa`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl f580d8f78`: 1 conflict: `docs/log-inbox/simulation.md`.
- Files changed since the base: 10 on the branch side, 48 on the trunk side; on both sides: `docs/log-inbox/simulation.md`.
- `git diff --name-only fece79bc3 f580d8f78 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-10-03_0041_prompt_sim_state_dialog.md` (eseguito 2026-10-03 · lane sim-state-dialog · b8ac89fcd, 0889e83be, a57092326, b4b32bd72 · the State page in two columns in both dialogs (1120 × 600, no layout shift between the picker, the roles and the State page), kind chip, access path, E-NODE before Apply, Written by and Read by on selection (simStateUsage.ts), «State of …»; the chat's first visual check (RC-23) fixed in a57092326: DEFINE and IVAR chips in the entity palette's operation and model tokens, no inner Globals heading in the model dialog; tests first, mutation bench 21/21, typecheck 14 (the §17 set), sim suites 395/395, build exit 0, lane probe on 3064 (light) 78/78, crops docs/discovery/harness/_tmp_simdialog_*.png (gitignored) · GO visivo della chat 2026-10-03 (RC-23) sulle crop fresche: State page two columns with the one-way arrow, E-NODE before Apply, Written by/Read by on ESM and Flow B, DEFINE indigo and IVAR amber chips, concrete chips dashed pink, model dialog with Globals once · non fuso).
- `git worktree list`: `sim-state-dialog` in `/Users/alfonso/jjodel-w-simdialog`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-10-03-0157/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `f580d8f78` is the tip of `sim-state-dialog`; the prompt files of the branch read `Status: eseguito` at `f580d8f78`; `git worktree list` shows `sim-state-dialog` only in `/Users/alfonso/jjodel-w-simdialog`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl f580d8f78` (measured above: 1 conflict: `docs/log-inbox/simulation.md`). `git diff --name-only fece79bc3 f580d8f78 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only fece79bc3 alfonso-frontend-jjtl` with `git diff --name-only fece79bc3 f580d8f78` (measured above: `docs/log-inbox/simulation.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-VP-50` (trunk), `R-VP-51` (trunk), `R-VP-48` (trunk), `R-VP-49` (trunk), `R-VP-52` (trunk), `R-VP-40` (trunk), `R-VP-41` (trunk), `R-VP-42` (trunk), `R-VP-43` (trunk), `R-VP-44` (trunk), `R-VP-45` (trunk), `R-VP-46` (trunk), `R-VP-47` (trunk); control: `- **R-VP-53**` none.
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-03 — feat: the State page of the roles dialog and the model's State dialog (P-2026-10-03-0041)` once (branch).
   - `docs/log-inbox/merge-gate.md`: the heading `## 2026-10-02 — ticket: a lane removes the node_modules symlink the direct merge needs later` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-03 — merge: sim-state-disc into alfonso-frontend-jjtl (P-2026-10-03-0032)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-03 — feat: the run model of the simulator's state UI, Lane A (P-2026-10-03-0040)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-03 — merge: sim-state-model into alfonso-frontend-jjtl (P-2026-10-03-0114)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-02 — fix(views): notation glyphs out of «Color by metaclass» (P-2026-10-02-2045)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-02 — ticket: name-ink marks outside a coloured node take its text colour` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-02 — merge: vp-glyph-nocolor into alfonso-frontend-jjtl (P-2026-10-02-2330)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-03 — fix(ir): outside marks of a coloured node keep the notation ink (P-2026-10-02-2356)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-03 — merge: ir-ink-outside into alfonso-frontend-jjtl (P-2026-10-03-0038)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-01 — docs: ELK auto-layout quality, measured per notation (P-2026-10-01-2215)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-01 — ticket: hidden object-as-edge vertices reach ELK as 180x120 boxes` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-02 — feat(editor-v2): toolbar auto-layout uses ELK in full (P-2026-10-01-2215)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-02 — ticket: Petri net (classic) transition names are crossed by their outgoing arc after the toolbar layout` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-03 — merge: elk-layout-disc into alfonso-frontend-jjtl (P-2026-10-03-0126)` once (trunk).
4. `git merge --no-ff --no-commit f580d8f78`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: sim-state-dialog into alfonso-frontend-jjtl (P-2026-10-03-0157)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `f580d8f78` in `/Users/alfonso/jjodel-w-simdialog`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 7aba76bfa` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/simulation.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the sim-state-dialog merge (P-2026-10-03-0157)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-simdialog`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
