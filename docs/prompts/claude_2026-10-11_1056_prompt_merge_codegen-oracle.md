# Prompt: merge codegen-oracle into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-11-1056
Chat: C-2026-10-10-0046
Lane: full (merge; zero conflicts measured)
Status: eseguito 2026-10-11 · lane merge · 28c9b0aad · vitest red at merge (5 oracle example tests, S5b x S6 fixture), resolved by P-2026-10-11-1105 merged by P-2026-10-11-1112 (42337a06f) · verifica visiva passata 2026-10-11 (RC-23 by the chat on 4 crops, GO by Alfonso 10:48)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-11-1056 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `bc6894a22`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `codegen-oracle` into the trunk with one merge commit, `--no-ff`, of the explicit sha `d8233842b`, in the shape of `bd73d6e54` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `f4c91bd71`. The branch carries, on top of the base, 4 commits:

- `d8233842b` docs: Status flip for the codegen S6 oracle lane (P-2026-10-10-2029)
- `dd75987f5` docs: log entry for the codegen S6 oracle lane (P-2026-10-10-2029)
- `a40c39948` feat(codegen): oracle against the simulator, JS target, two examples (P-2026-10-10-2029)
- `6288ec111` docs(prompts): code generation S6 oracle (P-2026-10-10-2029)

The trunk carries, since the base, 97 commits:

- `bc6894a22` docs: Status flip and log entry for the codegen-fix merge (P-2026-10-11-1049)
- `bd73d6e54` merge: codegen-fix into alfonso-frontend-jjtl (P-2026-10-11-1049)
- `73a313128` docs: add prompt P-2026-10-11-1049, merge codegen-fix into alfonso-frontend-jjtl
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
- `dfdef69f1` docs: prompt for the Requirements tab, port slice S5 (P-2026-10-11-0008)
- `284abe5cf` docs: Status flip and log entry, ir-graphvertex took the trunk (P-2026-10-10-1945)
- `f731577da` docs: Status flip and log entry for the board-strip merge (P-2026-10-10-2119)
- `0edb5f06b` merge: board-strip into alfonso-frontend-jjtl (P-2026-10-10-2119)
- `cdc7d6896` docs: add prompt P-2026-10-10-2119, merge board-strip into alfonso-frontend-jjtl
- `c9044649e` docs: Status flip and log entry for the board status strip (P-2026-10-10-2103)
- `ff1620ca0` feat(harness): board status strip, resolved colour (P-2026-10-10-2103)
- `3f4ad5d00` docs: prompt for the board status strip, port slice S4 (P-2026-10-10-2103)
- `6c4b52131` docs: Status flip and log entry for the board-progress-core merge (P-2026-10-10-2053)
- `93ea5fb4d` docs: log entry for the codegen S5b fixes (P-2026-10-10-2027)
- `a880e5ab8` fix(codegen): run clock starts at worker ready; output scrolls (P-2026-10-10-2027)
- `4cf36a239` merge: board-progress-core into alfonso-frontend-jjtl (P-2026-10-10-2053)
- `b03fc1b44` docs: add prompt P-2026-10-10-2053, merge board-progress-core into alfonso-frontend-jjtl
- `c0727487e` docs: Status flip and log entry for the lane-run-resolve merge (P-2026-10-10-2042)
- `dc8ea2a05` docs: R-GEN-16, templates reach the target profile through `target`
- and 57 more: `git log --oneline f4c91bd71..bc6894a22`

Measured by `lane-run merge` at 2026-10-11 10:56, trunk at `bc6894a22`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl d8233842b`: zero conflicts.
- Files changed since the base: 17 on the branch side, 169 on the trunk side; on both sides: none.
- `git diff --name-only f4c91bd71 d8233842b -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-10-10_2029_prompt_codegen_s6_oracle.md` (eseguito 2026-10-10 · lane codegen-oracle · code a40c39948 · log dd75987f5 · tsc 14 = base, vitest codegen + simulation 968 (932 + 36), build exit 0, check:codegen-lazy green, probe 29/29, mutation bench 14/14 · visual check passata 2026-10-11 (RC-23 by the chat on 4 crops, GO by Alfonso 10:48); follow-ups: oracle button in the panel, readable names in generated code, importable example projects (ticket)).
- `git worktree list`: `codegen-oracle` in `/Users/alfonso/jjodel-w-codegen-oracle`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-10-11-1056/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `d8233842b` is the tip of `codegen-oracle`; the prompt files of the branch read `Status: eseguito` at `d8233842b`; `git worktree list` shows `codegen-oracle` only in `/Users/alfonso/jjodel-w-codegen-oracle`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl d8233842b` (measured above: zero conflicts). `git diff --name-only f4c91bd71 d8233842b -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only f4c91bd71 alfonso-frontend-jjtl` with `git diff --name-only f4c91bd71 d8233842b` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-GEN-16` (trunk), `R-GV-1` (trunk), `R-GV-2` (trunk), `R-GV-3` (trunk), `R-GV-4` (trunk), `R-GV-5` (trunk), `R-GV-6` (trunk), `R-GV-7` (trunk), `R-GV-8` (trunk), `R-GV-9` (trunk), `R-GV-10` (trunk), `R-GV-11` (trunk), `R-GV-12` (trunk), `R-GV-13` (trunk), `R-GV-14` (trunk), `R-GV-15` (trunk), `R-GV-16` (trunk); control: `- **R-GV-17**` none.
   - `docs/log-inbox/codegen-oracle.md`: the heading `## 2026-10-10 — feat(codegen): oracle against the simulator, JS target profile, two lecture examples (P-2026-10-10-2029)` once (branch).
   - `docs/decisions.md`: the heading `## R-GV — graphVertex containment: channel, layout, membership (ratifiche 2026-10-10)` once (trunk).
   - `docs/log-inbox/codegen-fix.md`: the heading `## 2026-10-10 — fix(codegen): run clock starts at worker ready; output scrolls (P-2026-10-10-2027)` once (trunk).
   - `docs/log-inbox/codegen-fix.md`: the heading `## 2026-10-11 — merge: codegen-fix into alfonso-frontend-jjtl (P-2026-10-11-1049)` once (trunk).
   - `docs/log-inbox/gv-right-margin.md`: the heading `## 2026-10-11 — fix(ir): partitions keep their content margin on the right (P-2026-10-11-0040)` once (trunk).
   - `docs/log-inbox/gv-right-margin.md`: the heading `## 2026-10-11 — ticket: Auto layout writes a grown pool's size with its old position` once (trunk).
   - `docs/log-inbox/gv-right-margin.md`: the heading `## 2026-10-11 — ticket: a stacked partition loses its bottom margin as it lost the right one` once (trunk).
   - `docs/log-inbox/gv-right-margin.md`: the heading `## 2026-10-11 — merge: gv-right-margin into alfonso-frontend-jjtl (P-2026-10-11-0957)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — feat(harness): req-trace on the trunk, verbatim from harness-req-tab (P-2026-10-10-2022)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — merge: req-trace-port into alfonso-frontend-jjtl (P-2026-10-10-2034)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — feat: lane-run resolve and the resolved outcome, with card projection (P-2026-10-10-2020)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — merge: lane-run-resolve into alfonso-frontend-jjtl (P-2026-10-10-2042)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — feat: lane board progress in the Phase cell and the resolved outcome (P-2026-10-10-2021)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — merge: board-progress-core into alfonso-frontend-jjtl (P-2026-10-10-2053)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — feat(harness): board status strip, resolved colour in Timeline and Insights (P-2026-10-10-2103)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — merge: board-strip into alfonso-frontend-jjtl (P-2026-10-10-2119)` once (trunk).
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
4. `git merge --no-ff --no-commit d8233842b`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: codegen-oracle into alfonso-frontend-jjtl (P-2026-10-11-1056)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `d8233842b` in `/Users/alfonso/jjodel-w-codegen-oracle`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard bc6894a22` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/codegen-oracle.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the codegen-oracle merge (P-2026-10-11-1056)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-codegen-oracle`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
