# Prompt: textual-d-writing-aids takes the trunk before its own merge

Prompt-ID: P-2026-11-07-0117
Chat: —
Request: none (rendered by lane-run, no chat URL known for no --chat)
Lane: full (merge of the trunk into the branch; 1 conflict: `docs/log-inbox/codegen.md` measured)
Status: eseguito 2026-11-07 · direct merge a4b4d551f · vitest reds by load (languageService budget, tolerant (v) and (x), irCollapsedRender, irSelectionRing; 121/121 alone), resolved 01:51 · closed by hand: lane-run go refuses a blocked merge

Worktree: `/Users/alfonso/jjodel-w-textd`, branch `textual-d-writing-aids`, a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-textd`, branch `textual-d-writing-aids`, `git log -1` is the commit that adds this file (its parent `8cf70e2ec`), `git status` empty apart from gitignored `frontend/scripts/smoke/_tmp_*`, `MERGE_HEAD` absent. Otherwise stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-07-0117 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

## COSA

RC-14: a branch resolves its conflicts with the trunk on the branch, before the trunk takes it. Bring the trunk `alfonso-frontend-jjtl` at the explicit sha `47b7b514f` into `textual-d-writing-aids` with one merge commit, `--no-ff`, in the shape of `ad6da074b` (the last merge commit on `textual-d-writing-aids`; read its body first). Merge base `8049bf81b`. The trunk brings, since the base, 61 commits:

- `47b7b514f` docs: add prompt P-2026-11-07-0116, merge textual-f-jjel-tracing into alfonso-frontend-jjtl
- `c8b568e56` docs: Status flip and log entry for the multi-tab merge (P-2026-11-07-0041)
- `f4c031b3e` docs: R-MT-5..17 and lanes L1, L0b of the multi-tab front
- `0d48b6eb0` merge: multi-tab into alfonso-frontend-jjtl (P-2026-11-07-0041)
- `b01e829d9` docs: R-TXT-54, step E decisions taken under lane auto, provisional
- `8edb5ceae` docs: Status flip and log entry for the textual-e-sync merge (P-2026-11-07-0017)
- `6dce5df2c` docs: add prompt P-2026-11-07-0041, merge multi-tab into alfonso-frontend-jjtl
- `1ab4568ff` docs: Status flips of the multi-tab discovery prompts (P-2026-11-07-0030)
- `177e95c9f` docs(discovery): multi-tab viewpoints, answer in brief (P-2026-11-07-0030)
- `702898171` docs(discovery): multi-tab viewpoints, risks, Q1..Q13, decisions (P-2026-11-07-0030)
- `125144806` docs(discovery): multi-tab viewpoints, lane plan (P-2026-11-07-0030)
- `f8f359ec4` docs(discovery): multi-tab viewpoints, persistence and probe (P-2026-11-07-0030)
- `44bc72549` docs(discovery): multi-tab viewpoints, state one per project (P-2026-11-07-0030)
- `6f1c2ab95` docs(discovery): multi-tab viewpoints, creations outside the canvas (P-2026-11-07-0030)
- `8168b608f` docs: continuation prompt P-2026-11-07-0030 for the multi-tab discovery
- `03be29abc` docs: Status flip and log entry for the jjtl-builtin-errors merge (P-2026-11-07-0011)
- `a5cb8aafb` merge: textual-e-sync into alfonso-frontend-jjtl (P-2026-11-07-0017)
- `1afa6dfcd` docs: add prompt P-2026-11-07-0017, merge textual-e-sync into alfonso-frontend-jjtl
- `9a5a63048` merge: jjtl-builtin-errors into alfonso-frontend-jjtl (P-2026-11-07-0011)
- `59947fc70` docs: Status flip and log entry for the dcn-l21 merge (P-2026-11-06-2351)
- `ea57b6539` docs: add prompt P-2026-11-07-0011, merge jjtl-builtin-errors into alfonso-frontend-jjtl
- `145c2b7c6` docs(discovery): multi-tab viewpoints, sync and critical zone (P-2026-11-06-2350)
- `db3b86541` docs(discovery): multi-tab viewpoints, tabs and instances (P-2026-11-06-2350)
- `721afa8c5` docs(discovery): multi-tab viewpoints, header and census (P-2026-11-06-2350)
- `a743c3f37` merge: dcn-l21 into alfonso-frontend-jjtl (P-2026-11-06-2351)
- `34035b3a0` docs: Status flip and log entry for the step E discovery (P-2026-11-06-2337)
- `65852b291` docs: Status flip and log entry for the textual-d1-comment-guard merge (P-2026-11-06-2326)
- `82a4e8626` docs: add prompt P-2026-11-06-2351, merge dcn-l21 into alfonso-frontend-jjtl
- `f0a90f80f` docs(codegen): step E discovery, lane plan, decisions, risks (P-2026-11-06-2337)
- `ee1be6797` docs(codegen): step E discovery, verification (P-2026-11-06-2337)
- `6fcf5d5df` docs: open front multi-tab, R-MT-1..4, discovery prompt
- `65e74b522` docs(codegen): step E discovery, critical zone (P-2026-11-06-2337)
- `5d7fa1fe4` docs(codegen): step E discovery, loops and timing (P-2026-11-06-2337)
- `79dcae642` docs(codegen): step E discovery, canvas to text (P-2026-11-06-2337)
- `87a699491` docs(codegen): step E discovery, text to canvas (P-2026-11-06-2337)
- `f9f4ea965` docs(codegen): step E discovery, T10 and scenario 2 (P-2026-11-06-2337)
- `a5283f565` docs(codegen): step E discovery, objective and files read (P-2026-11-06-2337)
- `25a63f03f` docs: log entry and Status flip for builtin errors (P-2026-11-06-2305)
- `77732b93d` docs: report on builtin errors and a failed run's write-back (P-2026-11-06-2305)
- `e1d7dc9a1` docs: add prompt P-2026-11-06-2337, step E discovery
- and 21 more: `git log --oneline 8049bf81b..47b7b514f`

This branch brings, 6 commits:

- `8cf70e2ec` docs: Status flip and log entry for D3a (P-2026-11-06-2328)
- `99cb12a30` test(codegen): D3a (4), no fix without a shape; the corpus identity (P-2026-11-06-2328)
- `533eabcbc` feat(codegen): D3a (3), a misspelled keyword is replaced by a near one (P-2026-11-06-2328)
- `a9ff46da8` feat(codegen): D3a (2), near names for an unknown reference (P-2026-11-06-2328)
- `dcccb1d16` feat(codegen): D3a (1), a missing token carries its insert fix (P-2026-11-06-2328)
- `a16a8c45f` docs: add prompt P-2026-11-06-2328, D3a, structured fixes on parse errors

Measured by `lane-run merge --trunk-into` at 2026-11-07 01:17, trunk at `47b7b514f`:

- `git merge-tree --write-tree --name-only textual-d-writing-aids 47b7b514f`: 1 conflict: `docs/log-inbox/codegen.md`.
- Files changed since the base: 4 on the branch side, 39 on the trunk side; on both sides: `docs/log-inbox/codegen.md`.
- `git diff --name-only 8049bf81b 8cf70e2ec -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-06_2328_prompt_textual_d3a_fixes.md` (eseguito 2026-11-06 · lane full · dcccb1d16..99cb12a30 · gates green · no visual check (parser only) · log entry in docs/log-inbox/codegen.md).
- `git worktree list`: `textual-d-writing-aids` in `/Users/alfonso/jjodel-w-textd`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-11-07-0117/result.json`.

## COME

1. Preconditions above, plus: `47b7b514f` is the tip of `alfonso-frontend-jjtl` (if a docs-only commit moved it, say so and merge `47b7b514f` all the same); `git worktree list` shows `alfonso-frontend-jjtl` only in `/Users/alfonso/jjodel-release`.
2. Measure again: `git merge-tree --write-tree --name-only textual-d-writing-aids 47b7b514f` (measured above: 1 conflict: `docs/log-inbox/codegen.md`). A conflict in any file outside `docs/decisions.md` and `docs/log-inbox/*.md`: **stop** with `Outcome: question` and the conflict hunks quoted; do not resolve code by hand in this lane.
3. `git merge --no-ff --no-commit 47b7b514f`.
4. Resolve `docs/decisions.md`, if it conflicts, by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block, each section heading once. Resolve every `docs/log-inbox/*.md` that conflicts by union: preamble, the trunk's entries, then the branch's entries, all verbatim, each heading once. Probes on the resolved tree, each counted with `grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-TXT-54` (trunk), `R-DCN-9` (trunk), `R-DCN-10` (trunk), `R-DCN-11` (trunk), `R-DCN-12` (trunk), `R-DCN-13` (trunk), `R-DCN-14` (trunk), `R-DCN-15` (trunk), `R-DCN-16` (trunk), `R-DCN-17` (trunk), `R-DCN-18` (trunk), `R-DCN-19` (trunk), `R-DCN-20` (trunk), `R-DCN-21` (trunk), `R-MT-1` (trunk), `R-MT-2` (trunk), `R-MT-3` (trunk), `R-MT-4` (trunk), `R-MT-5` (trunk), `R-MT-6` (trunk), `R-MT-7` (trunk), `R-MT-8` (trunk), `R-MT-9` (trunk), `R-MT-10` (trunk), `R-MT-11` (trunk), `R-MT-12` (trunk), `R-MT-13` (trunk), `R-MT-14` (trunk), `R-MT-15` (trunk), `R-MT-16` (trunk), `R-MT-17` (trunk); control: `- **R-MT-18**` none.
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-06 — feat(codegen): D3a, structured fixes on parse errors (P-2026-11-06-2328)` once (branch).
   - `docs/decisions.md`: the heading `## R-MT: several tabs on models, each with its own viewpoint (decisions 2026-11-06)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-06 — feat(codegen): D1, commenting an object out asks first (P-2026-11-06-2301)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-06 — merge: textual-d1-comment-guard into alfonso-frontend-jjtl (P-2026-11-06-2326)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-06 — docs: step E discovery, T10 and synced selection (P-2026-11-06-2337)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — merge: textual-e-sync into alfonso-frontend-jjtl (P-2026-11-07-0017)` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-06 — feat: featureSources in the ontological binding, dormant slots in the feature closure` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-07 — merge: dcn-l21 into alfonso-frontend-jjtl (P-2026-11-06-2351)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-06 — fix(jjtl): a failing builtin names the rule and source element (P-2026-11-06-2305)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-07 — merge: jjtl-builtin-errors into alfonso-frontend-jjtl (P-2026-11-07-0011)` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-07 — merge: multi-tab into alfonso-frontend-jjtl (P-2026-11-07-0041)` once (trunk).
5. On the resolved tree, before committing, read every file changed on both sides once from top to bottom (`docs/log-inbox/codegen.md`); an auto-merge is a textual result, not a semantic one: no conflict marker, no duplicated declaration, hook or selector, one root per component.
6. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: textual-d-writing-aids takes alfonso-frontend-jjtl (P-2026-11-07-0117)`. Body: the two sides' shas, the merge-tree measurement, the union resolutions, the reading of step 5, `Model:` and `Co-Authored-By` trailers.
7. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: state the expectation first as the trunk tip's count (measure it read-only in `/Users/alfonso/jjodel-release` with `node /Users/alfonso/jjodel-w-textd/frontend/scripts/run-quiet.mjs vitest-trunk -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-release`/frontend`, the runner's log goes to this tree's `.agent-logs/`; do not write there) plus the tests this branch added, 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 8cf70e2ec` (this branch's own pre-merge tip; the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 8.
8. `Outcome: hard-stop`: the chat re-runs the visual probes of the branch on this tree and gives the GO. Do not start a server.
9. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane textual-d-writing-aids · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/codegen.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry, textual-d-writing-aids took the trunk (P-2026-11-07-0117)` (P16, RC-17). `Outcome: done`. The merge of `textual-d-writing-aids` into the trunk gets its own prompt (`lane-run merge textual-d-writing-aids --into alfonso-frontend-jjtl`).

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 7), `git checkout -- .`, `git clean`, `--no-verify`, a hand edit to a code file, editing any line inside a decision block or a log entry, rebase, squash, push, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-release`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge --trunk-into` from `frontend/scripts/lane-templates/trunk-into-branch.md`, in the shape of `claude_2026-09-27_0325_prompt_sim_profiles_take_trunk.md`.
