# Prompt: gen-io takes the trunk before its own merge

Prompt-ID: P-2026-10-30-2209
Chat: C-2026-10-30-1430
Front: codegen
Request: none (rendered by lane-run, no chat URL known for no --chat)
Lane: full (merge of the trunk into the branch; 1 conflict: `frontend/src/components/project/ProjectEditor.tsx` measured)
Status: eseguito 2026-10-30 · lane gen-io · 358f48f5f · verifica visiva passata 2026-10-30 (chat, unattended; Alfonso in the morning digest)

Worktree: `/Users/alfonso/jjodel-w-genio`, branch `gen-io`, a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-genio`, branch `gen-io`, `git log -1` is the commit that adds this file (its parent `ff2393191`), `git status` empty apart from gitignored `frontend/scripts/smoke/_tmp_*`, `MERGE_HEAD` absent. Otherwise stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-30-2209 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

## COSA

RC-14: a branch resolves its conflicts with the trunk on the branch, before the trunk takes it. Bring the trunk `alfonso-frontend-jjtl` at the explicit sha `5e81e8933` into `gen-io` with one merge commit, `--no-ff`, in the shape of `b1934ac2d` (the last merge commit on `gen-io`; read its body first). Merge base `87cbac5b7`. The trunk brings, since the base, 272 commits:

- `5e81e8933` docs: Status flip and log entry for the cg-generators merge (P-2026-10-30-2200)
- `52ff81621` merge: cg-generators into alfonso-frontend-jjtl (P-2026-10-30-2200)
- `a14ee5f25` docs: add prompt P-2026-10-30-2200, merge cg-generators into alfonso-frontend-jjtl
- `ab864b9b8` docs: Status flip and log entry for a direct merge (P-2026-10-30-2149)
- `5fdf3dc7a` docs: Status flip and log entry, cg-generators took the trunk (P-2026-10-30-1510)
- `213b368a8` fix(codegen): beside panel outranks the split cap again (P-2026-10-30-1510)
- `3e2ae556e` merge: jjtl-nested-materialization into alfonso-frontend-jjtl (P-2026-10-30-2149)
- `e74d12078` docs: add prompt P-2026-10-30-2149, merge jjtl-nested-materialization into alfonso-frontend-jjtl
- `49a89c430` docs(log): ticket entries #367 and #368 (C-2026-10-30-1253)
- `80d016562` docs: Status flips and log entry, nested materialization (P-2026-10-30-1545)
- `b38dccdac` fix(codegen): GENERATORS above SCRIPTS in the left bar (P-2026-10-30-1510)
- `62301b8e5` docs(jjtl): SPEC §9.2, nested creations to any depth (P-2026-10-30-1440)
- `e169b2bf3` fix(jjtl): materialize nested creations to any depth (P-2026-10-30-1440)
- `263e86492` docs(prompts): P-2026-10-30-1545 nested materialization closure
- `bb04b8737` merge: origin/staging into alfonso-frontend-jjtl (C-2026-10-30-1529)
- `574429a0f` merge: cg-generators takes alfonso-frontend-jjtl (P-2026-10-30-1510)
- `7d12f5232` docs(decisions): R-S1-6 JjTL output bypasses the R-S1-2 name guard
- `1dba845df` docs: add prompt P-2026-10-30-1510, merge alfonso-frontend-jjtl into cg-generators
- `9606c352a` docs: Status flip and log entry for the jjodie-non-text-reply merge (P-2026-10-30-1442)
- `53e7b9475` merge: jjodie-non-text-reply into alfonso-frontend-jjtl (P-2026-10-30-1442)
- `db39dfaf5` docs(discovery): JjTL nested materialization, Phase 1 report and LIR (P-2026-10-30-1440)
- `349b2175f` docs: add prompt P-2026-10-30-1442, merge jjodie-non-text-reply into alfonso-frontend-jjtl
- `77b2af9b8` docs(prompts): P-2026-10-30-1440 nested materialization, Phase 1 cont.
- `321a26699` docs(jjodie): close the non-text reply lane after the visual GO (P-2026-10-30-1215)
- `37956343a` docs(prompts): P-2026-10-30-1335 JjTL nested materialization
- `d933f15d1` docs: Status flip and log entry for the jjtl-executor-patch merge (P-2026-10-30-1330)
- `6dbd2e3b0` merge: jjtl-executor-patch into alfonso-frontend-jjtl (P-2026-10-30-1330)
- `413638847` docs: add prompt P-2026-10-30-1330, merge jjtl-executor-patch into alfonso-frontend-jjtl
- `1e370cf4b` docs(log): P-2026-10-30-1315 nested feature creation closure (P-2026-10-30-1315)
- `afcecce4d` fix(jjtl): nested '-> feature { }' places into the feature (P-2026-10-30-1315)
- `555bab6d0` docs(prompts): P-2026-10-30-1315 JjTL nested feature creation
- `8d5b5a1fe` fix(jodie): a reply without text throws, not crashes the chat (P-2026-10-30-1215)
- `a846e595a` docs(prompts): P-2026-10-30-1215 Front line
- `ecf08a1e9` docs(prompts): P-2026-10-30-1215 worktree base line
- `e29bdf7c8` docs(prompts): P-2026-10-30-1215 Jjodie non-text reply crash
- `ad73e5f39` docs: log entry, dotnet-backend-integration merge (C-2026-10-29-1805)
- `5dbd55dc7` merge: origin/dotnet-backend-integration into staging (C-2026-10-29-1805)
- `ead81b47e` docs: Status flip and log entry for the feat/186-customize-element merge (P-2026-10-29-1720)
- `b5e914168` merge: feat/186-customize-element into staging (P-2026-10-29-1720)
- `1ac0d22fe` docs: add prompt P-2026-10-29-1720, merge feat/186-customize-element into staging
- and 232 more: `git log --oneline 87cbac5b7..5e81e8933`

This branch brings, 8 commits:

- `ff2393191` docs(codegen): log entry and Status flips for generator import/export (P-2026-10-30-1540)
- `9c66dfcc0` docs(prompts): P-2026-10-30-1540 generator import/export closure
- `9d844eca3` feat(codegen): GENERATORS section in the project dashboard (P-2026-10-30-1515)
- `03db53f3f` feat(codegen): generator import and export in the Templates tab (P-2026-10-30-1515)
- `7fbedcc78` feat(codegen): generator file format, decode, validate, plan (P-2026-10-30-1515)
- `8a66dcde9` docs(prompts): P-2026-10-30-1515 generator import/export Phase 2, acceptance fixtures
- `26d27c5e9` docs(discovery): generator import and export, Phase 1 (P-2026-10-30-1430)
- `4a5921479` docs(prompts): P-2026-10-30-1430 generator import and export as JSON

Measured by `lane-run merge --trunk-into` at 2026-10-30 22:09, trunk at `5e81e8933`:

- `git merge-tree --write-tree --name-only gen-io 5e81e8933`: 1 conflict: `frontend/src/components/project/ProjectEditor.tsx`.
- Files changed since the base: 16 on the branch side, 295 on the trunk side; on both sides: `docs/log-inbox/codegen.md`, `frontend/src/components/project/ProjectEditor.tsx`.
- `git diff --name-only 87cbac5b7 ff2393191 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-10-30_1430_prompt_generator_import_export.md` (eseguito 2026-10-30 · lane gen-io · branch gen-io · 9d844eca3 · verifica visiva da fare), `claude_2026-10-30_1515_prompt_generator_import_export_phase2.md` (eseguito 2026-10-30 · lane gen-io · branch gen-io · 9d844eca3 · verifica visiva da fare), `claude_2026-10-30_1540_prompt_generator_import_export_closure.md` (eseguito 2026-10-30 · lane gen-io · branch gen-io · the commit of this line).
- `git worktree list`: `gen-io` in `/Users/alfonso/jjodel-w-genio`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Findings.** `lane-run merge` refuses `--launch` on this measurement:

- a conflict the union rule does not cover: `frontend/src/components/project/ProjectEditor.tsx`

**Direct.** `lane-run merge --direct` fell back:

- a conflict the union rule does not cover: `frontend/src/components/project/ProjectEditor.tsx`
- code files changed on both sides since the base; step 5 of the template is a reading no script does: `frontend/src/components/project/ProjectEditor.tsx`

## COME

1. Preconditions above, plus: `5e81e8933` is the tip of `alfonso-frontend-jjtl` (if a docs-only commit moved it, say so and merge `5e81e8933` all the same); `git worktree list` shows `alfonso-frontend-jjtl` only in `/Users/alfonso/jjodel-release`.
2. Measure again: `git merge-tree --write-tree --name-only gen-io 5e81e8933` (measured above: 1 conflict: `frontend/src/components/project/ProjectEditor.tsx`). A conflict in any file outside `docs/decisions.md` and `docs/log-inbox/*.md`: **stop** with `Outcome: question` and the conflict hunks quoted; do not resolve code by hand in this lane.
3. `git merge --no-ff --no-commit 5e81e8933`.
4. Resolve `docs/decisions.md`, if it conflicts, by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block, each section heading once. Resolve every `docs/log-inbox/*.md` that conflicts by union: preamble, the trunk's entries, then the branch's entries, all verbatim, each heading once. Probes on the resolved tree, each counted with `grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-JJD-1` (trunk), `R-JJD-2` (trunk), `R-JJD-3` (trunk), `R-JJD-4` (trunk), `R-JJD-5` (trunk), `R-JJD-6` (trunk), `R-JJD-7` (trunk), `R-JJD-8` (trunk), `R-JJD-9` (trunk), `R-JJD-10` (trunk), `R-JJD-11` (trunk), `R-JJD-12` (trunk), `R-JJD-13` (trunk), `R-JJD-14` (trunk), `R-JJD-15` (trunk), `R-JJD-16` (trunk), `R-RFB-1` (trunk), `R-RFB-2` (trunk), `R-RFB-3` (trunk), `R-RFB-4` (trunk), `R-RFB-5` (trunk), `R-RFB-6` (trunk), `R-RFB-7` (trunk), `R-RFB-8` (trunk), `R-JJD-17` (trunk); control: `- **R-JJD-18**` none.
   - `docs/log-inbox/codegen.md`: the heading `## 2026-10-30 — feat(codegen): generator import and export as JSON, Templates tab and dashboard (P-2026-10-30-1430, P-2026-10-30-1515)` once (branch).
   - `docs/decisions.md`: the heading `## R-JJD: the Jjodie panel redesign (decisions 2026-10-24)` once (trunk).
   - `docs/decisions.md`: the heading `## R-RFB: refactoring operations that migrate instance data (decisions 2026-10-24)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-10-30 — merge: cg-generators takes alfonso-frontend-jjtl (P-2026-10-30-1510)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-10-30 — merge: cg-generators into alfonso-frontend-jjtl (P-2026-10-30-2200)` once (trunk).
   - `docs/log-inbox/configurator-panel.md`: the heading `## 2026-10-27 — fix(#187, #186): the Configurator after @tmaog's test, R-CFG-6..9` once (trunk).
   - `docs/log-inbox/configurator-panel.md`: the heading `## 2026-10-27 — merge: fix/187-tmaog-round1 into staging (P-2026-10-27-1438)` once (trunk).
   - `docs/log-inbox/customize-element.md`: the heading `## 2026-10-28 — merge: feat/186-customize-element takes staging (P-2026-10-27-1449)` once (trunk).
   - `docs/log-inbox/customize-element.md`: the heading `## 2026-10-29 — feat(#186): Customize element, the per-role presentation of a type` once (trunk).
   - `docs/log-inbox/customize-element.md`: the heading `## 2026-10-29 — merge: feat/186-customize-element into staging (P-2026-10-29-1720)` once (trunk).
   - `docs/log-inbox/harness-observer.md`: the heading `## 2026-10-23 — implementation: independent offline identity and accounting reader` once (trunk).
   - `docs/log-inbox/harness-observer.md`: the heading `### Validation evidence` once (trunk).
   - `docs/log-inbox/harness-observer.md`: the heading `### Limits retained` once (trunk).
   - `docs/log-inbox/jjodie-ui-cel.md`: the heading `## 2026-10-24 — fix: plain console entries in Jjodie, no Source toggle on replies` once (trunk).
   - `docs/log-inbox/jjodie-ui-fin.md`: the heading `## 2026-10-24 — probe: jjodie-panel integration check of the merged tip` once (trunk).
   - `docs/log-inbox/jjodie-ui-fin.md`: the heading `## 2026-10-24 — ticket: S2 probe still expects the card actions disabled` once (trunk).
   - `docs/log-inbox/jjodie-ui-fin.md`: the heading `## 2026-10-24 — ticket: smoke RED on the first state of a cold dev server` once (trunk).
   - `docs/log-inbox/jjodie-ui-fmt.md`: the heading `## 2026-10-24 — feat: jjscript formatter that breaks long create lines before in` once (trunk).
   - `docs/log-inbox/jjodie-ui-fx1.md`: the heading `## 2026-10-24 — fix: jjodie quick tip clear of the dock, context chip at 460` once (trunk).
   - `docs/log-inbox/jjodie-ui-fx2.md`: the heading `## 2026-10-24 — ticket: megamodel edge path is NaN when its two ports share an x` once (trunk).
   - `docs/log-inbox/jjodie-ui-fx2.md`: the heading `## 2026-10-24 — test: jjodie S2 probe to the S5 actions, megamodel NaN paths traced` once (trunk).
   - `docs/log-inbox/jjodie-ui-gen.md`: the heading `## 2026-10-25 — fix: ghost edges orthogonal on facing sides, no curve under the class` once (trunk).
   - `docs/log-inbox/jjodie-ui-gin.md`: the heading `## 2026-10-25 — feat: M2 ghosts inside their class, new classes in free space, no palette beside` once (trunk).
   - `docs/log-inbox/jjodie-ui-hl.md`: the heading `## 2026-10-24 — feat: jjscript syntax highlighting in the script editors` once (trunk).
   - `docs/log-inbox/jjodie-ui-jto.md`: the heading `## 2026-10-24 — fix: jjodie bounds JjEL evaluation in the conversation` once (trunk).
   - `docs/log-inbox/jjodie-ui-jto.md`: the heading `## 2026-10-24 — ticket: Jjodie code-entry error red never renders, overridden by .jodie-messages code` once (trunk).
   - `docs/log-inbox/jjodie-ui-low.md`: the heading `## 2026-10-24 — fix: megamodel NaN paths and the preview bar under the Properties rail` once (trunk).
   - `docs/log-inbox/jjodie-ui-m2.md`: the heading `## 2026-10-24 — feat: jjodie M2 scripts in the planner, the script card and the ghost preview` once (trunk).
   - `docs/log-inbox/jjodie-ui-m2.md`: the heading `## 2026-10-24 — ticket: jjodie S2 probe pins the interim no-card rule for M2 replies` once (trunk).
   - `docs/log-inbox/jjodie-ui-ntr.md`: the heading `## 2026-10-30 — fix: a Jjodie reply without text throws, not crashes the chat` once (trunk).
   - `docs/log-inbox/jjodie-ui-ntr.md`: the heading `## 2026-10-30 — merge: jjodie-non-text-reply into alfonso-frontend-jjtl (P-2026-10-30-1442)` once (trunk).
   - `docs/log-inbox/jjodie-ui-pba.md`: the heading `## 2026-10-24 — fix: reducer resolves parked pointedBy in the batch, one folder entry` once (trunk).
   - `docs/log-inbox/jjodie-ui-pba.md`: the heading `## 2026-10-24 — ticket: a rolled-back batch loses the pointedBy its start drain resolved` once (trunk).
   - `docs/log-inbox/jjodie-ui-prb.md`: the heading `## 2026-10-25 — test: S2 and S6b probes follow M2 cards and Refactoring labels` once (trunk).
   - `docs/log-inbox/jjodie-ui-qt2.md`: the heading `## 2026-10-24 — fix: jjodie quick tip clear of the properties rail` once (trunk).
   - `docs/log-inbox/jjodie-ui-rf1.md`: the heading `## 2026-10-24 — feat: refactoring artifacts from the artifact menu` once (trunk).
   - `docs/log-inbox/jjodie-ui-rf2.md`: the heading `## 2026-10-24 — feat: run a refactoring from the artifact tab` once (trunk).
   - `docs/log-inbox/jjodie-ui-rfa.md`: the heading `## 2026-10-24 — feat: refactoring page split editor, diagnostics, preview and apply` once (trunk).
   - `docs/log-inbox/jjodie-ui-rfb.md`: the heading `## 2026-10-24 — discovery: refactoring operations that migrate instance data` once (trunk).
   - `docs/log-inbox/jjodie-ui-rfp.md`: the heading `## 2026-10-25 — fix: refactoring page, one Preview label, full-width editor, Jjodie in header` once (trunk).
   - `docs/log-inbox/jjodie-ui-s1b.md`: the heading `## 2026-10-24 — feat: jjodie S1b, header, in-input mode selector, code block wrap` once (trunk).
   - `docs/log-inbox/jjodie-ui-s1p.md`: the heading `## 2026-10-24 — probe: jjodie S1a docked panel, DOM measures and header fix` once (trunk).
   - `docs/log-inbox/jjodie-ui-s2.md`: the heading `## 2026-10-24 — feat: jjodie S2, collapsed script card with planned effects` once (trunk).
   - `docs/log-inbox/jjodie-ui-s2.md`: the heading `## 2026-10-24 — ticket: preview bar Discard fails Playwright's actionability wait` once (trunk).
   - `docs/log-inbox/jjodie-ui-s3c.md`: the heading `## 2026-10-24 — ticket: Jjodie JjEL console entry has no deadline, a slow submit blocks the thread` once (trunk).
   - `docs/log-inbox/jjodie-ui-s3c.md`: the heading `## 2026-10-24 — feat: jjodie S3c, JjEL live on the canvas selection` once (trunk).
   - `docs/log-inbox/jjodie-ui-s4b.md`: the heading `## 2026-10-24 — feat: ghost preview of a planned script on the canvas (S4b)` once (trunk).
   - `docs/log-inbox/jjodie-ui-s4c.md`: the heading `## 2026-10-24 — feat: Apply of a previewed script as one undo step (S4c)` once (trunk).
   - `docs/log-inbox/jjodie-ui-s4p.md`: the heading `## 2026-10-24 — probe: jjodie S4b ghost preview, DOM measures and marker fix` once (trunk).
   - `docs/log-inbox/jjodie-ui-s4p.md`: the heading `## 2026-10-24 — ticket: ghost preview column opens under the right sidebar` once (trunk).
   - `docs/log-inbox/jjodie-ui-s5.md`: the heading `## 2026-10-24 — feat: jjodie S5, edit the generated script with a live preview` once (trunk).
   - `docs/log-inbox/jjodie-ui-s5.md`: the heading `## 2026-10-24 — ticket: editors/skeleton.scss forces every Monaco margin app-wide` once (trunk).
   - `docs/log-inbox/jjodie-ui-s6a.md`: the heading `## 2026-10-24 — feat: scripts as project files with an editor tab (S6a)` once (trunk).
   - `docs/log-inbox/jjodie-ui-s6b.md`: the heading `## 2026-10-24 — feat: scripts listed in the project tree and the megamodel view (S6b)` once (trunk).
   - `docs/log-inbox/jjodie-ui-s6c.md`: the heading `## 2026-10-24 — ticket: megamodel logs NaN edge paths on open with a linked script` once (trunk).
   - `docs/log-inbox/jjodie-ui-s6c.md`: the heading `## 2026-10-24 — feat: update a script file from a later Jjodie answer (S6c)` once (trunk).
   - `docs/log-inbox/jjodie-ui-sbs.md`: the heading `## 2026-10-25 — feat: refactoring tab beside the target's own tab, preview on the real canvas` once (trunk).
   - `docs/log-inbox/jjodie-ui-tix.md`: the heading `## 2026-10-25 — fix: jjodie small tickets, error red asserted, editor colours in script blocks` once (trunk).
   - `docs/log-inbox/jjodie-ui-tix.md`: the heading `## 2026-10-25 — ticket: S2 and S6b probes stale against the merged tip` once (trunk).
   - `docs/log-inbox/jjodie-ui-tools.md`: the heading `## 2026-10-25 — feat: run a refactoring from the Tools menu` once (trunk).
   - `docs/log-inbox/jjodie-ui-udo.md`: the heading `## 2026-10-24 — discovery: the extra undo entry after Apply is a parked pointedBy` once (trunk).
   - `docs/log-inbox/jjodie-ui.md`: the heading `## 2026-10-24 — discovery: jjodie panel redesign report from the handoff` once (trunk).
   - `docs/log-inbox/jjodie-ui.md`: the heading `## 2026-10-24 — feat: jjel optional evaluation deadline (S3a)` once (trunk).
   - `docs/log-inbox/jjodie-ui.md`: the heading `## 2026-10-24 — feat: read-only effects planner for JjScript (S4a)` once (trunk).
   - `docs/log-inbox/jjodie-ui.md`: the heading `## 2026-10-24 — feat: jjodie S1a, docked panel with a resize handle` once (trunk).
   - `docs/log-inbox/jjodie-ui.md`: the heading `## 2026-10-24 — feat: publish the canvas multi-selection as an event (S3b)` once (trunk).
   - `docs/log-inbox/jjtl-executor-patch.md`: the heading `## 2026-10-30 — fix(jjtl): nested '-> feature { }' places into the feature (P-2026-10-30-1315)` once (trunk).
   - `docs/log-inbox/jjtl-executor-patch.md`: the heading `## 2026-10-30 — merge: jjtl-executor-patch into alfonso-frontend-jjtl (P-2026-10-30-1330)` once (trunk).
   - `docs/log-inbox/jjtl-nested-materialization.md`: the heading `## 2026-10-30 — fix(jjtl): materialize nested creations to any depth (P-2026-10-30-1440)` once (trunk).
   - `docs/log-inbox/jjtl-nested-materialization.md`: the heading `## 2026-10-30 — merge: jjtl-nested-materialization into alfonso-frontend-jjtl (P-2026-10-30-2149)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-10-30 — ticket: JjTL: a transformation run is many undo steps, not one` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-10-30 — ticket: Rename via the $name slot bypasses the R-S1-2 same-name guard` once (trunk).
   - `docs/log-inbox/merge-dotnet-backend.md`: the heading `## 2026-10-29 — merge: origin/dotnet-backend-integration into staging (C-2026-10-29-1805)` once (trunk).
5. On the resolved tree, before committing, read every file changed on both sides once from top to bottom (`docs/log-inbox/codegen.md`, `frontend/src/components/project/ProjectEditor.tsx`); an auto-merge is a textual result, not a semantic one: no conflict marker, no duplicated declaration, hook or selector, one root per component.
6. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: gen-io takes alfonso-frontend-jjtl (P-2026-10-30-2209)`. Body: the two sides' shas, the merge-tree measurement, the union resolutions, the reading of step 5, `Model:` and `Co-Authored-By` trailers.
7. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: state the expectation first as the trunk tip's count (measure it read-only in `/Users/alfonso/jjodel-release` with `node /Users/alfonso/jjodel-w-genio/frontend/scripts/run-quiet.mjs vitest-trunk -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-release`/frontend`, the runner's log goes to this tree's `.agent-logs/`; do not write there) plus the tests this branch added, 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard ff2393191` (this branch's own pre-merge tip; the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 8.
8. `Outcome: hard-stop`: the chat re-runs the visual probes of the branch on this tree and gives the GO. Do not start a server.
9. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane gen-io · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/codegen.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry, gen-io took the trunk (P-2026-10-30-2209)` (P16, RC-17). `Outcome: done`. The merge of `gen-io` into the trunk gets its own prompt (`lane-run merge gen-io --into alfonso-frontend-jjtl`).

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 7), `git checkout -- .`, `git clean`, `--no-verify`, a hand edit to a code file, editing any line inside a decision block or a log entry, rebase, squash, push, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-release`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge --trunk-into` from `frontend/scripts/lane-templates/trunk-into-branch.md`, in the shape of `claude_2026-09-27_0325_prompt_sim_profiles_take_trunk.md`.
