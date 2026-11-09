# Prompt: expression-catalog takes the trunk before its own merge

Prompt-ID: P-2026-11-09-1946
Chat: —
Request: none (rendered by lane-run, no chat URL known for no --chat)
Lane: full (merge of the trunk into the branch; 1 conflict: `docs/decisions.md` measured)
Status: eseguito ✅ c212f41fd (committed by the chat after the session ceiling; typecheck, check:scripts, check:docs, build green; vitest 16055 passed, only the 3 known import failures)

Worktree: `/Users/alfonso/jjodel-w-exprcat`, branch `expression-catalog`, a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-exprcat`, branch `expression-catalog`, `git log -1` is the commit that adds this file (its parent `bccb80208`), `git status` empty apart from gitignored `frontend/scripts/smoke/_tmp_*`, `MERGE_HEAD` absent. Otherwise stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-09-1946 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

## COSA

RC-14: a branch resolves its conflicts with the trunk on the branch, before the trunk takes it. Bring the trunk `alfonso-frontend-jjtl` at the explicit sha `198153915` into `expression-catalog` with one merge commit, `--no-ff`, in the shape of `5a9887622` (the last merge commit on `expression-catalog`; read its body first). Merge base `b23eae219`. The trunk brings, since the base, 174 commits:

- `198153915` docs: Status flip and log entry for the lost-link-fix merge (P-2026-11-09-1420)
- `cbd3d6115` merge: lost-link-fix into alfonso-frontend-jjtl (P-2026-11-09-1420)
- `96e49ca1a` docs: add prompt P-2026-11-09-1420, merge lost-link-fix into alfonso-frontend-jjtl
- `1070a45a1` docs(dcn): Status flip of the trunk merge and its gates (P-2026-11-09-1358)
- `20f2dcfb9` docs(dcn): prompt for the gates on the trunk merge into lost-link-fix (P-2026-11-09-1358)
- `067e796bc` merge: lost-link-fix takes alfonso-frontend-jjtl (P-2026-11-09-1347)
- `f2ac2d722` docs: add prompt P-2026-11-09-1347, merge alfonso-frontend-jjtl into lost-link-fix
- `646c78b89` docs(dcn): close the queued appends fix, entry and status (P-2026-11-09-1323)
- `3b7e06289` docs(dcn): LIR measures, two drops before and after (P-2026-11-09-1323)
- `d3f989d5c` docs(dcn): prompt to close the queued appends fix (P-2026-11-09-1323)
- `0971567bb` test(editor-v2): landed entry in flight, every slot settled (P-2026-11-09-1227)
- `c3eabab15` test(dcn): arms keep both writes, two real drops (P-2026-11-09-1227)
- `3d567c77a` fix(editor-v2): queue slot appends so a burst keeps every write (P-2026-11-09-1227)
- `f9b8f2e2a` feat(editor-v2): queue of slot appends not yet in the store (P-2026-11-09-1227)
- `6b66f67ad` docs(dcn): Layer Impact Report of the queued appends (P-2026-11-09-1227)
- `f840dac52` docs(dcn): prompt for the queued appends fix (P-2026-11-09-1227)
- `7571f8a53` docs: Status flip and log entry for the oi-rail merge (P-2026-11-09-1209)
- `b103b2481` merge: oi-rail into alfonso-frontend-jjtl (P-2026-11-09-1209)
- `de3440898` docs: add prompt P-2026-11-09-1209, merge oi-rail into alfonso-frontend-jjtl
- `b292b3d1b` docs: Status flip and log entry for the rail in a split pane (P-2026-11-09-1115)
- `2d874313a` chore(probe): the rail in a split pane, SP-0..SP-6 (P-2026-11-09-1115)
- `e52cfa569` fix(editor-v2): the rail in a split pane, click centre and drop guard (P-2026-11-09-1115)
- `95dbfaacb` docs(dcn): Status of the lost containment discovery prompt (P-2026-11-09-1020)
- `a031db094` docs: add prompt P-2026-11-09-1115, rail in a split pane
- `5d9537948` docs: Status flip and log entry, oi-rail took the trunk (P-2026-11-09-0943)
- `08ee13b31` docs(dcn): Status flip of the lost containment discovery (P-2026-11-09-1020)
- `b7b4817b1` docs(dcn): lost containment write discovery (P-2026-11-09-1020)
- `780b0b99e` test(dcn): probe of the lost containment write (P-2026-11-09-1020)
- `a1cb914c0` merge: oi-rail takes alfonso-frontend-jjtl (P-2026-11-09-0943)
- `285600ecb` docs(dcn): prompt P-2026-11-09-1020
- `53e89405f` docs: checkpoint update, D6 pinned hover card merged (C-2026-11-08-1908)
- `a8c327925` docs: Status flip and log entry for the textual-d6-pinned-hover merge (P-2026-11-09-1001)
- `7255e5c36` merge: textual-d6-pinned-hover into alfonso-frontend-jjtl (P-2026-11-09-1001)
- `c59adc944` docs: add prompt P-2026-11-09-1001, merge textual-d6-pinned-hover into alfonso-frontend-jjtl
- `dc070e33d` docs: D6b log entry and Status (P-2026-11-09-0950)
- `5221842dd` fix(codegen): the pinned card binds a chord, not Option+H (P-2026-11-09-0950)
- `5af83948d` docs: add prompt P-2026-11-09-0950, D6b pin shortcut as a chord
- `8d2fa8843` docs: D6 log entry and Status (P-2026-11-08-2330, P-2026-11-09-0020)
- `4cc6384f4` docs: add prompt P-2026-11-09-0943, merge alfonso-frontend-jjtl into oi-rail
- `733a67020` docs: Status flip and log entry for the notices merge (P-2026-11-09-0930)
- and 134 more: `git log --oneline b23eae219..198153915`

This branch brings, 17 commits:

- `bccb80208` perf(expression): Auto layout packs the folded model without freezing the page (P-2026-11-09-0952)
- `36984d7a7` docs: add prompt P-2026-11-09-0952, Auto layout without freezing the page
- `5e2a265b3` docs: add prompt P-2026-11-09-0925, Auto layout on the folded model
- `1123ced34` perf(expression): fold views no longer force every node to mount (P-2026-11-09-0900)
- `353ff5a1c` docs: add prompt P-2026-11-09-0900, fold open without mounting every node
- `1ba03bb01` docs: add prompt P-2026-11-09-0806, expression catalog S1c (open time and layout)
- `b42ddc837` feat(expression): fold views and the expression text source (P-2026-11-09-0035)
- `874626956` docs: add prompt P-2026-11-09-0108, expression catalog S1b finish
- `8cb4201db` docs: add prompt P-2026-11-09-0035, expression catalog S1b (wiring)
- `985c27b54` feat(expression): catalog codec, printer, batch, golden test (P-2026-11-09-0010)
- `bdb1f1d0f` docs: add prompt P-2026-11-09-0010, expression catalog S1a (model)
- `c3ffb710a` docs, test: LIR and golden fixtures of expression catalog S1 (P-2026-11-08-2345)
- `60dfcad3c` docs: R-EXP row headers in the register grammar
- `4cf25af28` docs: add prompt P-2026-11-08-2345, expression catalog S1
- `326eff46d` docs: R-EXP-1..14, the expression role catalog; amend R-PLG-11
- `e137e6a8f` docs: discovery of the expression role catalog as the first plugin (P-2026-11-08-2310)
- `2b7ba21b7` docs: add prompt P-2026-11-08-2310, expression role catalog discovery

Measured by `lane-run merge --trunk-into` at 2026-11-09 19:46, trunk at `198153915`:

- `git merge-tree --write-tree --name-only expression-catalog 198153915`: 1 conflict: `docs/decisions.md`.
- Files changed since the base: 41 on the branch side, 155 on the trunk side; on both sides: `docs/decisions.md`, `frontend/src/components/editor-v2/EditorV2.tsx`.
- `git diff --name-only b23eae219 bccb80208 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-08_2310_prompt_expression_catalog_discovery.md` (da eseguire), `claude_2026-11-08_2345_prompt_expression_catalog_s1.md` (da eseguire), `claude_2026-11-09_0010_prompt_expression_s1a_model.md` (da eseguire), `claude_2026-11-09_0035_prompt_expression_s1b_wiring.md` (da eseguire), `claude_2026-11-09_0108_prompt_expression_s1b_finish.md` (da eseguire), `claude_2026-11-09_0806_prompt_expression_s1c_perf.md` (da eseguire), `claude_2026-11-09_0900_prompt_expression_open.md` (da eseguire), `claude_2026-11-09_0925_prompt_expression_layout.md` (da eseguire), `claude_2026-11-09_0952_prompt_expression_layout_worker.md` (da eseguire).
- `git worktree list`: `expression-catalog` in `/Users/alfonso/jjodel-w-exprcat`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

## COME

1. Preconditions above, plus: `198153915` is the tip of `alfonso-frontend-jjtl` (if a docs-only commit moved it, say so and merge `198153915` all the same); `git worktree list` shows `alfonso-frontend-jjtl` only in `/Users/alfonso/jjodel-release`.
2. Measure again: `git merge-tree --write-tree --name-only expression-catalog 198153915` (measured above: 1 conflict: `docs/decisions.md`). A conflict in any file outside `docs/decisions.md` and `docs/log-inbox/*.md`: **stop** with `Outcome: question` and the conflict hunks quoted; do not resolve code by hand in this lane.
3. `git merge --no-ff --no-commit 198153915`.
4. Resolve `docs/decisions.md`, if it conflicts, by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block, each section heading once. Resolve every `docs/log-inbox/*.md` that conflicts by union: preamble, the trunk's entries, then the branch's entries, all verbatim, each heading once. Probes on the resolved tree, each counted with `grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-EXP-1` (branch), `R-EXP-2` (branch), `R-EXP-3` (branch), `R-EXP-4` (branch), `R-EXP-5` (branch), `R-EXP-6` (branch), `R-EXP-7` (branch), `R-EXP-8` (branch), `R-EXP-9` (branch), `R-EXP-10` (branch), `R-EXP-11` (branch), `R-EXP-12` (branch), `R-EXP-13` (branch), `R-EXP-14` (branch), `R-OI-18` (trunk), `R-OI-19` (trunk), `R-OI-20` (trunk), `R-OI-21` (trunk), `R-OI-22` (trunk), `R-OI-23` (trunk), `R-OI-24` (trunk), `R-NT-1` (trunk), `R-NT-2` (trunk), `R-NT-3` (trunk), `R-NT-4` (trunk), `R-NT-5` (trunk); control: `- **R-NT-6**` none.
   - `docs/decisions.md`: the heading `## R-EXP: the expression role catalog, textual projection of expression subtrees (decisions 2026-11-08)` once (branch).
   - `docs/decisions.md`: the heading `## R-NT: notices and tips (decisions 2026-11-08)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-09 — feat(codegen): D6, the pinned hover card of the Text tab (P-2026-11-08-2330, P-2026-11-09-0020)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-09 — fix(codegen): D6b, the pinned card binds a chord, not Option+H (P-2026-11-09-0950)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-09 — merge: textual-d6-pinned-hover into alfonso-frontend-jjtl (P-2026-11-09-1001)` once (trunk).
   - `docs/log-inbox/dashboard-drop-import.md`: the heading `## 2026-11-08 — discovery: dashboard drop import, stopped before Phase 2 (P-2026-11-08-1845)` once (trunk).
   - `docs/log-inbox/dashboard-drop-import.md`: the heading `## 2026-11-08 — fix(dashboard): shared .jjodel import, awaited transaction, failures reported (P-2026-11-08-2015)` once (trunk).
   - `docs/log-inbox/dashboard-drop-import.md`: the heading `## 2026-11-08 — feat(dashboard): import modal with drop area, empty state import (P-2026-11-08-2040)` once (trunk).
   - `docs/log-inbox/dashboard-drop-import.md`: the heading `## 2026-11-08 — feat(dashboard): drag tracking and drop overlay (P-2026-11-08-2115)` once (trunk).
   - `docs/log-inbox/dashboard-drop-import.md`: the heading `## 2026-11-08 — feat(dashboard): drop import panel and toasts (P-2026-11-08-2145)` once (trunk).
   - `docs/log-inbox/dashboard-drop-import.md`: the heading `## 2026-11-08 — feat(dashboard): imported card marker and modal feedback (P-2026-11-08-2215)` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-08 — feat: DCN snapshot copy, the pure plan (P-2026-11-08-2124)` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-08 — feat: DCN snapshot written as a new model, layout, exact match (P-2026-11-08-2355)` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-09 — feat: DCN Save snapshot button in the Simulation panel (P-2026-11-09-0017)` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-09 — merge: dcn-s5 into alfonso-frontend-jjtl (P-2026-11-09-0053)` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-09 — fix: DCN bare invocation arguments, chips at step back (P-2026-11-09-0055)` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-09 — feat: DCN coherence roles and their reader (P-2026-11-09-0124)` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-09 — test: DCN coherence constraints in the drone fixture (P-2026-11-09-0237)` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-09 — feat: DCN coherence constraints over a trajectory (P-2026-11-09-0259)` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-09 — feat: DCN coherence constraints in a run, as watch hits (P-2026-11-09-0320)` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-09 — merge: dcn-s5 into alfonso-frontend-jjtl (P-2026-11-09-0350)` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-09 — fix: queued slot appends keep every write of a burst (P-2026-11-09-1227, P-2026-11-09-1323)` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-09 — merge: lost-link-fix into alfonso-frontend-jjtl (P-2026-11-09-1420)` once (trunk).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-11-08 — feat: onto binding editor with Detect, probe and bench (P-2026-11-08-0151)` once (trunk).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-11-08 — ticket: value kinds can be edited in the binding editor but not added` once (trunk).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-11-08 — feat: «Instances of» rail section, probe, regression, bench (P-2026-11-08-0241)` once (trunk).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-11-08 — feat: the viewpoint's level gates the instance surfaces (P-2026-11-08-1726)` once (trunk).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-11-08 — feat: the class rail and pane menu from the binding, probe, bench (P-2026-11-08-1822)` once (trunk).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-11-08 — feat: a link drawn between two instances, probe, bench (P-2026-11-08-2041)` once (trunk).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-11-08 — fix: class diagram defects, one undo for the generalization, handle reach (P-2026-11-08-2214)` once (trunk).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-11-08 — ticket: one undo does not remove an object-as-edge outside level class` once (trunk).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-11-09 — merge: oi-rail takes alfonso-frontend-jjtl (P-2026-11-09-0943)` once (trunk).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-11-09 — fix: the rail in a split pane, click centre and drop guard (P-2026-11-09-1115)` once (trunk).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-11-09 — merge: oi-rail into alfonso-frontend-jjtl (P-2026-11-09-1209)` once (trunk).
   - `docs/log-inbox/notices.md`: the heading `## 2026-11-08 — docs: notices and tips discovery, Phase 1 (P-2026-11-08-2230)` once (trunk).
   - `docs/log-inbox/notices.md`: the heading `## 2026-11-09 — ticket: donation banner ignores the right rail in the editor` once (trunk).
   - `docs/log-inbox/notices.md`: the heading `## 2026-11-09 — ticket: .notification-header is global and reaches the JjScript success notification` once (trunk).
   - `docs/log-inbox/notices.md`: the heading `## 2026-11-09 — ticket: Properties overlay covers the Help menu in the editor` once (trunk).
   - `docs/log-inbox/notices.md`: the heading `## 2026-11-09 — feat: notices and tips Phase 2, banner, tips card, tips browser (P-2026-11-08-2340)` once (trunk).
   - `docs/log-inbox/notices.md`: the heading `## 2026-11-09 — chore: notices Phase 2 closure, gates, stale probe, tickets (P-2026-11-09-0036)` once (trunk).
   - `docs/log-inbox/notices.md`: the heading `## 2026-11-09 — merge: notices-discovery into alfonso-frontend-jjtl (P-2026-11-09-0930)` once (trunk).
5. On the resolved tree, before committing, read every file changed on both sides once from top to bottom (`docs/decisions.md`, `frontend/src/components/editor-v2/EditorV2.tsx`); an auto-merge is a textual result, not a semantic one: no conflict marker, no duplicated declaration, hook or selector, one root per component.
6. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: expression-catalog takes alfonso-frontend-jjtl (P-2026-11-09-1946)`. Body: the two sides' shas, the merge-tree measurement, the union resolutions, the reading of step 5, `Model:` and `Co-Authored-By` trailers.
7. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: state the expectation first as the trunk tip's count (measure it read-only in `/Users/alfonso/jjodel-release` with `node /Users/alfonso/jjodel-w-exprcat/frontend/scripts/run-quiet.mjs vitest-trunk -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-release`/frontend`, the runner's log goes to this tree's `.agent-logs/`; do not write there) plus the tests this branch added, 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard bccb80208` (this branch's own pre-merge tip; the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 8.
8. `Outcome: hard-stop`: the chat re-runs the visual probes of the branch on this tree and gives the GO. Do not start a server.
9. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane expression-catalog · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of the `docs/log-inbox/` file of this branch's front (the branch adds headings to none), both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry, expression-catalog took the trunk (P-2026-11-09-1946)` (P16, RC-17). `Outcome: done`. The merge of `expression-catalog` into the trunk gets its own prompt (`lane-run merge expression-catalog --into alfonso-frontend-jjtl`).

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 7), `git checkout -- .`, `git clean`, `--no-verify`, a hand edit to a code file, editing any line inside a decision block or a log entry, rebase, squash, push, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-release`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge --trunk-into` from `frontend/scripts/lane-templates/trunk-into-branch.md`, in the shape of `claude_2026-09-27_0325_prompt_sim_profiles_take_trunk.md`.
