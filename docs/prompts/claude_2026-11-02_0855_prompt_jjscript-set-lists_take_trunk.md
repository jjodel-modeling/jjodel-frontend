# Prompt: jjscript-set-lists takes the trunk before its own merge

Prompt-ID: P-2026-11-02-0855
Chat: —
Request: none (rendered by lane-run, no chat URL known for no --chat)
Lane: full (merge of the trunk into the branch; 1 conflict: `docs/log-inbox/codegen.md` measured)
Status: eseguito 2026-11-02 · lane jjscript-set-lists · fb57b19f1 · verifica visiva passata 2026-11-02 (chat, unattended; Alfonso in the morning digest)

Worktree: `/Users/alfonso/jjodel-w-jjsset`, branch `jjscript-set-lists`, a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-jjsset`, branch `jjscript-set-lists`, `git log -1` is the commit that adds this file (its parent `fa528874a`), `git status` empty apart from gitignored `frontend/scripts/smoke/_tmp_*`, `MERGE_HEAD` absent. Otherwise stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-02-0855 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

## COSA

RC-14: a branch resolves its conflicts with the trunk on the branch, before the trunk takes it. Bring the trunk `alfonso-frontend-jjtl` at the explicit sha `47c975ec2` into `jjscript-set-lists` with one merge commit, `--no-ff`, in the shape of `aa68ad049` (the last merge commit on `jjscript-set-lists`; read its body first). Merge base `c03585ae8`. The trunk brings, since the base, 31 commits:

- `47c975ec2` docs: merge flip (P-2026-11-02-0841), prompts P-2026-11-02-0845 (lazy gate guards) and 0846 (T4a annotations)
- `247007a7b` merge: defaults-layer-gate into alfonso-frontend-jjtl (P-2026-11-02-0841)
- `afa8431af` docs: add prompt P-2026-11-02-0841, merge defaults-layer-gate into alfonso-frontend-jjtl
- `5b62357a5` docs: merge flip (P-2026-11-02-0833) and R-TXT-26 (apply on pause)
- `41c7c0d8a` merge: undo-tab-badge into alfonso-frontend-jjtl (P-2026-11-02-0833)
- `76a44600c` docs: add prompt P-2026-11-02-0833, merge undo-tab-badge into alfonso-frontend-jjtl
- `015d2a27e` docs: Status flip and log entry for the textual-paths merge (P-2026-11-02-0821)
- `b7c0adfc2` merge: textual-paths into alfonso-frontend-jjtl (P-2026-11-02-0821)
- `08d4c75b0` docs: add prompt P-2026-11-02-0821, merge textual-paths into alfonso-frontend-jjtl
- `a54aad3cc` docs: ticket on the reset target in the merge prompt template
- `90350bbef` docs: Status flip and log entry for the criticalzone-test-env merge (P-2026-11-02-0723)
- `34bb2c30c` merge: criticalzone-test-env into alfonso-frontend-jjtl (P-2026-11-02-0723)
- `bce1f3ef5` docs: add prompt P-2026-11-02-0723, merge criticalzone-test-env into alfonso-frontend-jjtl
- `85da82fc8` docs: log entry, ticket and Status flip for P-2026-11-02-0653
- `ffcb21052` fix(model): defaultValueLiteral accessors, int defaults, lazy gate off (P-2026-11-02-0653)
- `81e0aafdf` docs: Status flip and log entry for the only-visible-conditional merge (P-2026-11-02-0656)
- `7a4094009` merge: only-visible-conditional into alfonso-frontend-jjtl (P-2026-11-02-0656)
- `d114178d6` docs: Status flip and log entry for the undo-tab fix and Text tab badge (P-2026-11-02-0650)
- `fdb70a1e8` fix(ui): close the tab of an undone model; badge for Text tabs (P-2026-11-02-0650)
- `dcbd70ed5` docs: add prompt P-2026-11-02-0656, merge only-visible-conditional into alfonso-frontend-jjtl
- `f91c95e22` docs: log entry and Status flip for textual paths, fold, corpus (P-2026-11-02-0652)
- `40b70401d` feat(codegen): unambiguous paths, fold fallback, shared corpus (P-2026-11-02-0652)
- `ad09563f7` docs: log entry and Status flip for criticalZone test env (P-2026-11-02-0645)
- `3c54c9d3f` test(hooks): criticalZone spawns drop an inherited go-ahead (P-2026-11-02-0645)
- `bfb6ee654` docs: close P-2026-11-02-0020, 0225, 0233 (visual check passed)
- `aa079a7d5` docs: add prompt P-2026-11-02-0645, criticalZone test env (ticket #393)
- `604f578ed` probe: CLICK_FIT viewport over the node positions (P-2026-11-02-0233)
- `9217e9185` docs: add prompt P-2026-11-02-0233, no-viewpoint drag timing
- `36694dbfb` perf(editor-v2): conditional onlyRenderVisibleElements (P-2026-11-02-0020)
- `b32858bf1` docs: add prompt P-2026-11-02-0225, conditional only-visible closure
- `e38677b8d` docs: add prompt P-2026-11-02-0020, conditional only-visible rendering

This branch brings, 3 commits:

- `fa528874a` docs: log entry and Status flip for set lists and enum literals (P-2026-11-02-0651)
- `084eb0902` feat(codegen): model lines write lists and literals (P-2026-11-02-0651)
- `36a5387f6` feat(jjscript): set lists and enum literals (P-2026-11-02-0651)

Measured by `lane-run merge --trunk-into` at 2026-11-02 08:55, trunk at `47c975ec2`:

- `git merge-tree --write-tree --name-only jjscript-set-lists 47c975ec2`: 1 conflict: `docs/log-inbox/codegen.md`.
- Files changed since the base: 12 on the branch side, 44 on the trunk side; on both sides: `docs/log-inbox/codegen.md`, `frontend/src/codegen/textual/__tests__/modelLines.test.ts`.
- `git diff --name-only c03585ae8 fa528874a -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: none.
- `git worktree list`: `jjscript-set-lists` in `/Users/alfonso/jjodel-w-jjsset`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

## COME

1. Preconditions above, plus: `47c975ec2` is the tip of `alfonso-frontend-jjtl` (if a docs-only commit moved it, say so and merge `47c975ec2` all the same); `git worktree list` shows `alfonso-frontend-jjtl` only in `/Users/alfonso/jjodel-release`.
2. Measure again: `git merge-tree --write-tree --name-only jjscript-set-lists 47c975ec2` (measured above: 1 conflict: `docs/log-inbox/codegen.md`). A conflict in any file outside `docs/decisions.md` and `docs/log-inbox/*.md`: **stop** with `Outcome: question` and the conflict hunks quoted; do not resolve code by hand in this lane.
3. `git merge --no-ff --no-commit 47c975ec2`.
4. Resolve `docs/decisions.md`, if it conflicts, by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block, each section heading once. Resolve every `docs/log-inbox/*.md` that conflicts by union: preamble, the trunk's entries, then the branch's entries, all verbatim, each heading once. Probes on the resolved tree, each counted with `grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-TXT-26` (trunk); control: `- **R-TXT-27**` none.
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-02 — feat(jjscript): set lists and enum literals (P-2026-11-02-0651)` once (branch).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-02 — feat(codegen): unambiguous paths, fold fallback, shared corpus (P-2026-11-02-0652)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-02 — merge: textual-paths into alfonso-frontend-jjtl (P-2026-11-02-0821)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-02 — fix(ui): close the tab of an undone model; badge for Text tabs (P-2026-11-02-0650)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-02 — merge: undo-tab-badge into alfonso-frontend-jjtl (P-2026-11-02-0833)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-02 — fix(model): defaultValueLiteral accessors, integer defaults, lazy gate off mode (P-2026-11-02-0653)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-02 — ticket: the lazy gate's off build ships generator modules through unguarded dynamic imports` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-02 — merge: defaults-layer-gate into alfonso-frontend-jjtl (P-2026-11-02-0841)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-11-02 — test(hooks): criticalZone spawns drop an inherited go-ahead (P-2026-11-02-0645)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-11-02 — merge: criticalzone-test-env into alfonso-frontend-jjtl (P-2026-11-02-0723)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-11-02 — ticket: Merge prompt template names the wrong reset target when check:addonly fails` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-11-02 — perf(editor-v2): conditional onlyRenderVisibleElements (P-2026-11-02-0225)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-11-02 — merge: only-visible-conditional into alfonso-frontend-jjtl (P-2026-11-02-0656)` once (trunk).
5. On the resolved tree, before committing, read every file changed on both sides once from top to bottom (`docs/log-inbox/codegen.md`, `frontend/src/codegen/textual/__tests__/modelLines.test.ts`); an auto-merge is a textual result, not a semantic one: no conflict marker, no duplicated declaration, hook or selector, one root per component.
6. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: jjscript-set-lists takes alfonso-frontend-jjtl (P-2026-11-02-0855)`. Body: the two sides' shas, the merge-tree measurement, the union resolutions, the reading of step 5, `Model:` and `Co-Authored-By` trailers.
7. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: state the expectation first as the trunk tip's count (measure it read-only in `/Users/alfonso/jjodel-release` with `node /Users/alfonso/jjodel-w-jjsset/frontend/scripts/run-quiet.mjs vitest-trunk -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-release`/frontend`, the runner's log goes to this tree's `.agent-logs/`; do not write there) plus the tests this branch added, 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard fa528874a` (this branch's own pre-merge tip; the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 8.
8. `Outcome: hard-stop`: the chat re-runs the visual probes of the branch on this tree and gives the GO. Do not start a server.
9. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane jjscript-set-lists · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/codegen.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry, jjscript-set-lists took the trunk (P-2026-11-02-0855)` (P16, RC-17). `Outcome: done`. The merge of `jjscript-set-lists` into the trunk gets its own prompt (`lane-run merge jjscript-set-lists --into alfonso-frontend-jjtl`).

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 7), `git checkout -- .`, `git clean`, `--no-verify`, a hand edit to a code file, editing any line inside a decision block or a log entry, rebase, squash, push, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-release`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge --trunk-into` from `frontend/scripts/lane-templates/trunk-into-branch.md`, in the shape of `claude_2026-09-27_0325_prompt_sim_profiles_take_trunk.md`.
