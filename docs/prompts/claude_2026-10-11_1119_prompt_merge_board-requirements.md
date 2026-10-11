# Prompt: merge board-requirements into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-11-1119
Chat: —
Lane: full (merge; 1 conflict: `docs/log-inbox/harness.md` measured)
Status: eseguito 2026-10-11 · lane merge · 1fe9439d8 · verifica visiva passata 2026-10-11 (passed: chat RC-23 on 4702 on ac2471ab0, 34 groups closed by default, unassigned pairs split by softgoal, fixed Cluster column, no em dash in rendered text)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-11-1119 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `fe87ea447`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `board-requirements` into the trunk with one merge commit, `--no-ff`, of the explicit sha `b82802d10`, in the shape of `42337a06f` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `dfdef69f1`. The branch carries, on top of the base, 3 commits:

- `b82802d10` docs: Status flip and log entry for the Requirements tab (P-2026-10-11-0008)
- `ac2471ab0` fix(harness): Requirements tab splits unassigned pairs by softgoal (P-2026-10-11-0008)
- `1aee982fa` feat(harness): lane board Requirements tab (P-2026-10-11-0008)

The trunk carries, since the base, 86 commits:

- `fe87ea447` docs: Status flip and log entry for the codegen-ready merge (P-2026-10-11-1112)
- `42337a06f` merge: codegen-ready into alfonso-frontend-jjtl (P-2026-10-11-1112)
- `e9b736e9d` docs: add prompt P-2026-10-11-1112, merge codegen-ready into alfonso-frontend-jjtl
- `63369a3dc` docs: Status flip for the codegen-ready lane (P-2026-10-11-1105)
- `764758224` docs: log entry for the oracle in-process worker ready fix (P-2026-10-11-1105)
- `47a0d95a3` fix(codegen): the oracle tests' in-process worker posts ready (P-2026-10-11-1105)
- `3ca590840` docs(prompts): add P-2026-10-11-1105, the oracle tests' in-process worker posts ready
- `28c9b0aad` merge: codegen-oracle into alfonso-frontend-jjtl (P-2026-10-11-1056)
- `3287fd99e` docs: add prompt P-2026-10-11-1056, merge codegen-oracle into alfonso-frontend-jjtl
- `bc6894a22` docs: Status flip and log entry for the codegen-fix merge (P-2026-10-11-1049)
- `bd73d6e54` merge: codegen-fix into alfonso-frontend-jjtl (P-2026-10-11-1049)
- `73a313128` docs: add prompt P-2026-10-11-1049, merge codegen-fix into alfonso-frontend-jjtl
- `d8233842b` docs: Status flip for the codegen S6 oracle lane (P-2026-10-10-2029)
- `f8992c4d0` docs: Status flip for the codegen S5b fixes lane (P-2026-10-10-2027)
- `96d38b2bf` docs(prompts): tickets become Backlog cards, discovery and fix (P-2026-10-11-1017)
- `d653cfa06` docs: ticket, a hard-stop lane with a flipped Status stays In review on its card
- `64b5bffb6` docs: Status flip and log entry for the gv-right-margin merge (P-2026-10-11-0957)
- `f7ebd0f5b` merge: gv-right-margin into alfonso-frontend-jjtl (P-2026-10-11-0957)
- `fa338afca` docs: add prompt P-2026-10-11-0957, merge gv-right-margin into alfonso-frontend-jjtl
- `9d9e0be57` docs(prompts): Status flip, P-2026-10-11-0040
- `1ceda9802` docs(log): right-margin lane entry and two tickets (P-2026-10-11-0040)
- `dfa6f07ce` test(probe): graphVertex right margin acceptance probe (P-2026-10-11-0040)
- `3c5e97b88` docs: Status flip and log entry for the ir-graphvertex merge (P-2026-10-11-0059)
- `aea222c46` fix(ir): partitions keep their content margin on the right (P-2026-10-11-0040)
- `eb5600dbb` merge: ir-graphvertex into alfonso-frontend-jjtl (P-2026-10-11-0059)
- `361a11224` docs: add prompt P-2026-10-11-0059, merge ir-graphvertex into alfonso-frontend-jjtl
- `aa9fd6701` docs: Status flip and log entry, ir-graphvertex took the trunk (P-2026-10-11-0011)
- `b08fb3885` docs(prompts): graphVertex right margin, fast lane (P-2026-10-11-0040)
- `294a29084` merge: do-freeze into alfonso-frontend-jjtl (P-2026-10-11-0034)
- `90286184d` docs: add prompt P-2026-10-11-0034, merge do-freeze into alfonso-frontend-jjtl
- `72762297b` merge: jjodie-reserved into alfonso-frontend-jjtl (P-2026-10-11-0023)
- `7b670fc45` docs: add prompt P-2026-10-11-0023, merge jjodie-reserved into alfonso-frontend-jjtl
- `7523373cb` merge: ir-graphvertex takes alfonso-frontend-jjtl (P-2026-10-11-0011)
- `72e995517` docs: add prompt P-2026-10-11-0011, merge alfonso-frontend-jjtl into ir-graphvertex
- `6c503189a` docs: R-GV-16 (S6 Auto layout, ratified) and Status flips for 0105, 1246, 1716
- `284abe5cf` docs: Status flip and log entry, ir-graphvertex took the trunk (P-2026-10-10-1945)
- `dd75987f5` docs: log entry for the codegen S6 oracle lane (P-2026-10-10-2029)
- `a40c39948` feat(codegen): oracle against the simulator, JS target, two examples (P-2026-10-10-2029)
- `93ea5fb4d` docs: log entry for the codegen S5b fixes (P-2026-10-10-2027)
- `a880e5ab8` fix(codegen): run clock starts at worker ready; output scrolls (P-2026-10-10-2027)
- and 46 more: `git log --oneline dfdef69f1..fe87ea447`

Measured by `lane-run merge` at 2026-10-11 11:19, trunk at `fe87ea447`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl b82802d10`: 1 conflict: `docs/log-inbox/harness.md`.
- Files changed since the base: 6 on the branch side, 163 on the trunk side; on both sides: `docs/log-inbox/harness.md`.
- `git diff --name-only dfdef69f1 b82802d10 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: none.
- `git worktree list`: `board-requirements` in `/Users/alfonso/jjodel-w-boardreq`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-10-11-1119/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `b82802d10` is the tip of `board-requirements`; the prompt files of the branch read `Status: eseguito` at `b82802d10`; `git worktree list` shows `board-requirements` only in `/Users/alfonso/jjodel-w-boardreq`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl b82802d10` (measured above: 1 conflict: `docs/log-inbox/harness.md`). `git diff --name-only dfdef69f1 b82802d10 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only dfdef69f1 alfonso-frontend-jjtl` with `git diff --name-only dfdef69f1 b82802d10` (measured above: `docs/log-inbox/harness.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-GV-1` (trunk), `R-GV-2` (trunk), `R-GV-3` (trunk), `R-GV-4` (trunk), `R-GV-5` (trunk), `R-GV-6` (trunk), `R-GV-7` (trunk), `R-GV-8` (trunk), `R-GV-9` (trunk), `R-GV-10` (trunk), `R-GV-11` (trunk), `R-GV-12` (trunk), `R-GV-13` (trunk), `R-GV-14` (trunk), `R-GV-15` (trunk), `R-GV-16` (trunk); control: `- **R-GV-17**` none.
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-11 — feat(harness): lane board Requirements tab (P-2026-10-11-0008)` once (branch).
   - `docs/decisions.md`: the heading `## R-GV — graphVertex containment: channel, layout, membership (ratifiche 2026-10-10)` once (trunk).
   - `docs/log-inbox/codegen-fix.md`: the heading `## 2026-10-10 — fix(codegen): run clock starts at worker ready; output scrolls (P-2026-10-10-2027)` once (trunk).
   - `docs/log-inbox/codegen-fix.md`: the heading `## 2026-10-11 — merge: codegen-fix into alfonso-frontend-jjtl (P-2026-10-11-1049)` once (trunk).
   - `docs/log-inbox/codegen-oracle.md`: the heading `## 2026-10-10 — feat(codegen): oracle against the simulator, JS target profile, two lecture examples (P-2026-10-10-2029)` once (trunk).
   - `docs/log-inbox/codegen-ready.md`: the heading `## 2026-10-11 — fix(codegen): the oracle tests' in-process worker posts ready (P-2026-10-11-1105)` once (trunk).
   - `docs/log-inbox/codegen-ready.md`: the heading `## 2026-10-11 — merge: codegen-ready into alfonso-frontend-jjtl (P-2026-10-11-1112)` once (trunk).
   - `docs/log-inbox/gv-right-margin.md`: the heading `## 2026-10-11 — fix(ir): partitions keep their content margin on the right (P-2026-10-11-0040)` once (trunk).
   - `docs/log-inbox/gv-right-margin.md`: the heading `## 2026-10-11 — ticket: Auto layout writes a grown pool's size with its old position` once (trunk).
   - `docs/log-inbox/gv-right-margin.md`: the heading `## 2026-10-11 — ticket: a stacked partition loses its bottom margin as it lost the right one` once (trunk).
   - `docs/log-inbox/gv-right-margin.md`: the heading `## 2026-10-11 — merge: gv-right-margin into alfonso-frontend-jjtl (P-2026-10-11-0957)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-11 — ticket: a hard-stop lane whose Status is flipped stays «In review» on its card` once (trunk).
   - `docs/log-inbox/ir-graphvertex-s4.md`: the heading `## 2026-10-10 — feat(authoring): graphVertex authoring panel, containment section and D-a seed, S4 (P-2026-10-10-1156)` once (trunk).
   - `docs/log-inbox/ir-graphvertex.md`: the heading `## 2026-10-10 — docs(discovery): graphVertex for OMG-faithful BPMN lanes (P-2026-10-10-0105)` once (trunk).
   - `docs/log-inbox/ir-graphvertex.md`: the heading `## 2026-10-10 — feat(ir): graphVertex containment keys, spec addendum and R-GV rows, S0 and S1 (P-2026-10-10-0105)` once (trunk).
   - `docs/log-inbox/ir-graphvertex.md`: the heading `## 2026-10-10 — feat(ir): graphVertex partitions, header bands and channel edges rendered, S2 (P-2026-10-10-0105)` once (trunk).
   - `docs/log-inbox/ir-graphvertex.md`: the heading `## 2026-10-10 — feat(editor-v2): graphVertex gestures and membership, S3 (P-2026-10-10-0105)` once (trunk).
   - `docs/log-inbox/ir-graphvertex.md`: the heading `## 2026-10-10 — ticket: useJjomSync keeps the RF edge of a deleted M1 reference edge` once (trunk).
   - `docs/log-inbox/ir-graphvertex.md`: the heading `## 2026-10-10 — ticket: a state updater replayed by React loops the canvas to the update depth limit` once (trunk).
   - `docs/log-inbox/ir-graphvertex.md`: the heading `## 2026-10-10 — ticket: under the pointer the target ghost handle covers the source ghost` once (trunk).
   - `docs/log-inbox/ir-graphvertex.md`: the heading `## 2026-10-10 — feat(ir): graphVertex self-framing containers for UML statecharts, S2b (P-2026-10-10-0105)` once (trunk).
   - `docs/log-inbox/ir-graphvertex.md`: the heading `## 2026-10-10 — ticket: an IR view cannot hide a reference edge, nor a predicate reach an object's owner` once (trunk).
   - `docs/log-inbox/ir-graphvertex.md`: the heading `## 2026-10-10 — feat(editor-v2): graphVertex Auto layout across containers, S6 (P-2026-10-10-0105)` once (trunk).
   - `docs/log-inbox/ir-graphvertex.md`: the heading `## 2026-10-10 — merge: ir-graphvertex takes alfonso-frontend-jjtl (P-2026-10-10-1945)` once (trunk).
   - `docs/log-inbox/ir-graphvertex.md`: the heading `## 2026-10-11 — merge: ir-graphvertex takes alfonso-frontend-jjtl (P-2026-10-11-0011)` once (trunk).
   - `docs/log-inbox/ir-graphvertex.md`: the heading `## 2026-10-11 — merge: ir-graphvertex into alfonso-frontend-jjtl (P-2026-10-11-0059)` once (trunk).
   - `docs/log-inbox/jjodie-reserved.md`: the heading `## 2026-10-10 — feat(jodie): one list of reserved identifiers and a gate on Jjodie's scripts (P-2026-10-10-0045)` once (trunk).
   - `docs/log-inbox/jjscript.md`: the heading `## 2026-10-10 — fix(jjscript): a do block whose body is not a command stops (P-2026-10-10-0810)` once (trunk).
4. `git merge --no-ff --no-commit b82802d10`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: board-requirements into alfonso-frontend-jjtl (P-2026-10-11-1119)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `b82802d10` in `/Users/alfonso/jjodel-w-boardreq`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard fe87ea447` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/harness.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the board-requirements merge (P-2026-10-11-1119)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-boardreq`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
