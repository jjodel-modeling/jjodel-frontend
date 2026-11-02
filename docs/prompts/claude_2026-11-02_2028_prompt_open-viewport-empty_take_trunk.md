# Prompt: open-viewport-empty takes the trunk before its own merge

Prompt-ID: P-2026-11-02-2028
Chat: C-2026-11-01-1434
Request: https://claude.ai/code/session_01DQt9R32KVprpjZZCfe6Sbp (merge of open-viewport-empty launched by chat C-2026-11-01-1434)
Lane: full (merge of the trunk into the branch; 2 conflicts: `docs/log-inbox/maintenance.md`, `frontend/src/components/editor-v2/EditorV2.tsx` measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-w-openvp`, branch `open-viewport-empty`, a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-openvp`, branch `open-viewport-empty`, `git log -1` is the commit that adds this file (its parent `fe6d90b75`), `git status` empty apart from gitignored `frontend/scripts/smoke/_tmp_*`, `MERGE_HEAD` absent. Otherwise stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-02-2028 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

## COSA

RC-14: a branch resolves its conflicts with the trunk on the branch, before the trunk takes it. Bring the trunk `alfonso-frontend-jjtl` at the explicit sha `e5e60dca4` into `open-viewport-empty` with one merge commit, `--no-ff`, in the shape of `aa68ad049` (the last merge commit on `open-viewport-empty`; read its body first). Merge base `aa68ad049`. The trunk brings, since the base, 115 commits:

- `e5e60dca4` docs: add prompt P-2026-11-02-2030, JjScript rename takes an expression
- `d95f54e95` docs: Status flip and log entry for the textual-path-keyword merge (P-2026-11-02-2019)
- `45b02a390` merge: textual-path-keyword into alfonso-frontend-jjtl (P-2026-11-02-2019)
- `c592eb5f7` docs: ticket on the toolbar auto layout freeze on large models
- `7bf34c70f` docs: add prompt P-2026-11-02-2019, merge textual-path-keyword into alfonso-frontend-jjtl
- `3ebbb3f92` docs: close R-TXT-28 paths, Status flip and log entry (P-2026-11-02-2003)
- `e141ed7b1` feat(codegen): text paths follow the class keyword (P-2026-11-02-2003)
- `5467e2328` docs: Status flip and log entry for the textual-t4a2 merge (P-2026-11-02-1954)
- `42e4065c6` docs: R-TXT-28 and prompt P-2026-11-02-2003, paths follow the class keyword
- `4233db8e5` merge: textual-t4a2 into alfonso-frontend-jjtl (P-2026-11-02-1954)
- `3f0374e0c` docs: add prompt P-2026-11-02-1956, JjTL A1 containment in the executor
- `196610fc2` docs: add prompt P-2026-11-02-1954, merge textual-t4a2 into alfonso-frontend-jjtl
- `718c11374` docs: close T4a-2, Status flips and log entry (P-2026-11-02-1930)
- `e415cb932` docs: add prompt P-2026-11-02-1942, measure the textual notation for template models
- `e522cd48a` docs: tickets from the A0 probe (P-2026-11-02-1838)
- `f2be6cab2` docs: checkpoint of chat C-2026-11-02-1541, JjTL generic transformation
- `bb620d93c` feat(codegen): store textual syntax annotations, show the language name (P-2026-11-02-1830)
- `91d93fdb1` docs: Status flip and log entry for jjtl-generic-transformation merge (P-2026-11-02-1905)
- `e6bc99860` docs: add prompt P-2026-11-02-1930, close T4a-2 (RC-51)
- `a296fefcb` docs: R-FA ratified by Alfonso
- `8f14055bf` merge: jjtl-generic-transformation into alfonso-frontend-jjtl (P-2026-11-02-1905)
- `27398633c` docs: add prompt P-2026-11-02-1905, merge jjtl-generic-transformation into alfonso-frontend-jjtl
- `88dd98234` docs: R-JTG-6 and R-JTG-7 registered, log entry and status (P-2026-11-02-1838)
- `95c8c00dd` docs(jjtl): SPEC 5.3.2, the Open block becomes R-JTG-6 and R-JTG-7 (P-2026-11-02-1838)
- `e5ad232c4` docs: add prompt P-2026-11-02-1830, textual syntax T4a-2
- `083844b19` docs: add prompt P-2026-11-02-1838, A0 rulings and write-back probe
- `fc7b4b20c` docs: log entry, ticket and status for A0 (P-2026-11-02-1742)
- `aaf103671` docs: R-JTG-1..5 registered, answer in brief added to the JjTL report (P-2026-11-02-1742)
- `9d41917e6` docs: ticket on the abstract-syntax viewport not restored after reload
- `73f4655fe` docs(jjtl): SPEC 5.3 rewritten, gaps 1 and 5 updated (P-2026-11-02-1742)
- `39202fe67` feat(jjtl): report the three silent resolution fallbacks (P-2026-11-02-1742)
- `a43408ca2` feat(jjtl): bind resolved targets by identity, not by copy (P-2026-11-02-1742)
- `49c762328` docs: log entry and status for A0, stopped at the step 2 inventory (P-2026-11-02-1742)
- `d2e2c8574` test(jjtl): confirm a resolved target is copied on bind (P-2026-11-02-1742)
- `a1c40416b` docs: add prompt P-2026-11-02-1742, JjTL A0 bind by identity
- `a1ba9a2b4` Merge branch 'alfonso-frontend-jjtl' into jjtl-generic-transformation
- `2a75d6c1d` docs: Status flip and log entry for the jjscript-forall-multivar merge (P-2026-11-02-1701)
- `838ea1449` merge: jjscript-forall-multivar into alfonso-frontend-jjtl (P-2026-11-02-1701)
- `fda4a2b4e` docs: add prompt P-2026-11-02-1701, merge jjscript-forall-multivar into alfonso-frontend-jjtl
- `79e532bb3` docs(discovery): JjTL generic transformation, Phase 1 (P-2026-11-02-1612)
- and 75 more: `git log --oneline aa68ad049..e5e60dca4`

This branch brings, 5 commits:

- `fe6d90b75` docs: close ticket #419, open viewport fix verified (P-2026-11-02-1856)
- `55e4d2703` fix(editor-v2): an open fit that frames no node pans onto one (P-2026-11-02-1856)
- `7d461c88c` docs: add prompt P-2026-11-02-1856, open viewport fix (ticket #419)
- `f6c512960` docs: discovery, open viewport on an empty area (P-2026-11-02-0646)
- `246edb1bc` docs: add prompt P-2026-11-02-0646, empty viewport at model open (ticket #419)

Measured by `lane-run merge --trunk-into` at 2026-11-02 20:28, trunk at `e5e60dca4`:

- `git merge-tree --write-tree --name-only open-viewport-empty e5e60dca4`: 2 conflicts: `docs/log-inbox/maintenance.md`, `frontend/src/components/editor-v2/EditorV2.tsx`.
- Files changed since the base: 8 on the branch side, 127 on the trunk side; on both sides: `docs/log-inbox/maintenance.md`, `frontend/src/components/editor-v2/EditorV2.tsx`.
- `git diff --name-only aa68ad049 fe6d90b75 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-02_0646_prompt_open_viewport_empty.md` (eseguito 2026-11-02 · lane open-viewport-empty · 55e4d2703 · verifica visiva passata 2026-11-02), `claude_2026-11-02_1856_prompt_open_viewport_fix.md` (eseguito 2026-11-02 · lane open-viewport-empty · 55e4d2703 · verifica visiva passata 2026-11-02).
- `git worktree list`: `open-viewport-empty` in `/Users/alfonso/jjodel-w-openvp`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Findings.** `lane-run merge` refuses `--launch` on this measurement:

- a conflict the union rule does not cover: `frontend/src/components/editor-v2/EditorV2.tsx`

## COME

1. Preconditions above, plus: `e5e60dca4` is the tip of `alfonso-frontend-jjtl` (if a docs-only commit moved it, say so and merge `e5e60dca4` all the same); `git worktree list` shows `alfonso-frontend-jjtl` only in `/Users/alfonso/jjodel-release`.
2. Measure again: `git merge-tree --write-tree --name-only open-viewport-empty e5e60dca4` (measured above: 2 conflicts: `docs/log-inbox/maintenance.md`, `frontend/src/components/editor-v2/EditorV2.tsx`). A conflict in any file outside `docs/decisions.md` and `docs/log-inbox/*.md`: **stop** with `Outcome: question` and the conflict hunks quoted; do not resolve code by hand in this lane.
3. `git merge --no-ff --no-commit e5e60dca4`.
4. Resolve `docs/decisions.md`, if it conflicts, by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block, each section heading once. Resolve every `docs/log-inbox/*.md` that conflicts by union: preamble, the trunk's entries, then the branch's entries, all verbatim, each heading once. Probes on the resolved tree, each counted with `grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-TXT-25` (trunk), `R-TXT-26` (trunk), `R-TXT-27` (trunk), `R-TXT-28` (trunk); control: `- **R-TXT-29**` none.
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-11-02 — fix(editor-v2): an open fit that frames no node pans onto one (P-2026-11-02-1856)` once (branch).
   - `docs/decisions.md`: the heading `## R-FA: `forall` and `exists` over several variables (decisions 2026-11-02)` once (trunk).
   - `docs/decisions.md`: the heading `## R-JTG: one generic JjTL transformation, the order and frame of parts A to D (decisions 2026-11-02)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-02 — merge: textual-t2 into alfonso-frontend-jjtl (P-2026-11-02-0637)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-02 — feat(codegen): unambiguous paths, fold fallback, shared corpus (P-2026-11-02-0652)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-02 — merge: textual-paths into alfonso-frontend-jjtl (P-2026-11-02-0821)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-02 — fix(ui): close the tab of an undone model; badge for Text tabs (P-2026-11-02-0650)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-02 — merge: undo-tab-badge into alfonso-frontend-jjtl (P-2026-11-02-0833)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-02 — fix(model): defaultValueLiteral accessors, integer defaults, lazy gate off mode (P-2026-11-02-0653)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-02 — ticket: the lazy gate's off build ships generator modules through unguarded dynamic imports` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-02 — merge: defaults-layer-gate into alfonso-frontend-jjtl (P-2026-11-02-0841)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-02 — feat(jjscript): set lists and enum literals (P-2026-11-02-0651)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-02 — merge: jjscript-set-lists takes alfonso-frontend-jjtl (P-2026-11-02-0855)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-02 — merge: jjscript-set-lists into alfonso-frontend-jjtl (P-2026-11-02-0931)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-02 — fix(codegen): guard codegen imports for the lazy gate (P-2026-11-02-0845)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-02 — merge: lazy-gate-guards into alfonso-frontend-jjtl (P-2026-11-02-0943)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-02 — feat(codegen): textual syntax annotations, grammar part (P-2026-11-02-0955, P-2026-11-02-1016)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-02 — merge: textual-t4 into alfonso-frontend-jjtl (P-2026-11-02-1027)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-02 — feat(codegen): textual syntax annotations stored, language name shown (P-2026-11-02-1830, P-2026-11-02-1930)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-02 — merge: textual-t4a2 into alfonso-frontend-jjtl (P-2026-11-02-1954)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-02 — feat(codegen): text paths follow the class keyword (P-2026-11-02-2003)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-02 — merge: textual-path-keyword into alfonso-frontend-jjtl (P-2026-11-02-2019)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-11-02 — test(hooks): criticalZone spawns drop an inherited go-ahead (P-2026-11-02-0645)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-11-02 — merge: criticalzone-test-env into alfonso-frontend-jjtl (P-2026-11-02-0723)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-11-02 — ticket: Merge prompt template names the wrong reset target when check:addonly fails` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-02 — docs(jjtl): R-JTG-6 and R-JTG-7 registered, A0 write-back exercised in the running app (P-2026-11-02-1838)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-02 — feat(jjtl): A0, resolved targets bound by identity, fallbacks reported, SPEC 5.3, R-JTG (P-2026-11-02-1742)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-02 — ticket: two JjTL executor tests fail once the joiner import is mocked` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-02 — test(jjtl): A0 step 1, copy on bind confirmed; stopped at the step 2 inventory (P-2026-11-02-1742)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-02 — discovery: JjTL generic transformation, Phase 1 report (P-2026-11-02-1425, P-2026-11-02-1612)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-02 — merge: jjtl-generic-transformation into alfonso-frontend-jjtl (P-2026-11-02-1905)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-02 — ticket: JjTL nested creation drops name on a class without a declared name attribute` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-02 — ticket: JjTL re-run in the same tab executes a stale AST` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-02 — ticket: init_dash page error in the JjTL probe, untraced` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-11-02 — perf(editor-v2): conditional onlyRenderVisibleElements (P-2026-11-02-0225)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-11-02 — merge: only-visible-conditional into alfonso-frontend-jjtl (P-2026-11-02-0656)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-11-02 — feat(jjtl): forall over several variables (P-2026-11-02-1331)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-11-02 — merge: jjtl-forall-multivar into alfonso-frontend-jjtl (P-2026-11-02-1404)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-11-02 — feat(jjel): forall and exists over several variables (P-2026-11-02-1410)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-11-02 — merge: jjel-forall-multivar into alfonso-frontend-jjtl (P-2026-11-02-1511)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-11-02 — feat(jjscript): forall...do over several variables (P-2026-11-02-1332)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-11-02 — merge: jjscript-forall-multivar into alfonso-frontend-jjtl (P-2026-11-02-1701)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-11-02 — ticket: Abstract-syntax viewport is not restored after a reload` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-11-02 — ticket: Toolbar auto layout blocks the page for minutes on a 407-node model` once (trunk).
5. On the resolved tree, before committing, read every file changed on both sides once from top to bottom (`docs/log-inbox/maintenance.md`, `frontend/src/components/editor-v2/EditorV2.tsx`); an auto-merge is a textual result, not a semantic one: no conflict marker, no duplicated declaration, hook or selector, one root per component.
6. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: open-viewport-empty takes alfonso-frontend-jjtl (P-2026-11-02-2028)`. Body: the two sides' shas, the merge-tree measurement, the union resolutions, the reading of step 5, `Model:` and `Co-Authored-By` trailers.
7. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: state the expectation first as the trunk tip's count (measure it read-only in `/Users/alfonso/jjodel-release` with `node /Users/alfonso/jjodel-w-openvp/frontend/scripts/run-quiet.mjs vitest-trunk -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-release`/frontend`, the runner's log goes to this tree's `.agent-logs/`; do not write there) plus the tests this branch added, 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard fe6d90b75` (this branch's own pre-merge tip; the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 8.
8. `Outcome: hard-stop`: the chat re-runs the visual probes of the branch on this tree and gives the GO. Do not start a server.
9. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane open-viewport-empty · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/maintenance.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry, open-viewport-empty took the trunk (P-2026-11-02-2028)` (P16, RC-17). `Outcome: done`. The merge of `open-viewport-empty` into the trunk gets its own prompt (`lane-run merge open-viewport-empty --into alfonso-frontend-jjtl`).

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 7), `git checkout -- .`, `git clean`, `--no-verify`, a hand edit to a code file, editing any line inside a decision block or a log entry, rebase, squash, push, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-release`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge --trunk-into` from `frontend/scripts/lane-templates/trunk-into-branch.md`, in the shape of `claude_2026-09-27_0325_prompt_sim_profiles_take_trunk.md`.
