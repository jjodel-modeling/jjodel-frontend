# Prompt: jjtl-called-rules takes the trunk before its own merge

Prompt-ID: P-2026-11-03-0045
Chat: C-2026-11-02-1541
Request: https://claude.ai/code/session_01DQt9R6PwbdyvU1szY334kM (merge of jjtl-called-rules launched by chat C-2026-11-02-1541)
Lane: full (merge of the trunk into the branch; zero conflicts measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-w-jjtlcalled`, branch `jjtl-called-rules`, a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-jjtlcalled`, branch `jjtl-called-rules`, `git log -1` is the commit that adds this file (its parent `3ace5cb34`), `git status` empty apart from gitignored `frontend/scripts/smoke/_tmp_*`, `MERGE_HEAD` absent. Otherwise stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-03-0045 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

## COSA

RC-14: a branch resolves its conflicts with the trunk on the branch, before the trunk takes it. Bring the trunk `alfonso-frontend-jjtl` at the explicit sha `b200ccbc8` into `jjtl-called-rules` with one merge commit, `--no-ff`, in the shape of `c58e00349` (the last merge commit on `jjtl-called-rules`; read its body first). Merge base `8f5355b74`. The trunk brings, since the base, 53 commits:

- `b200ccbc8` docs: Status flip and log entry for the jjscript-console-defects merge (P-2026-11-03-0020)
- `5b186217f` merge: jjscript-console-defects into alfonso-frontend-jjtl (P-2026-11-03-0020)
- `2d169b390` docs: add prompt P-2026-11-03-0020, merge jjscript-console-defects into alfonso-frontend-jjtl
- `e1b35c188` docs: add prompt P-2026-11-03-0021, textual syntax T6b
- `b1f46890d` docs: Status flip and log entry for the textual-t6a merge (P-2026-11-03-0011)
- `b0bfeb221` merge: textual-t6a into alfonso-frontend-jjtl (P-2026-11-03-0011)
- `25f79520f` docs: add prompt P-2026-11-03-0011, merge textual-t6a into alfonso-frontend-jjtl
- `fe85c80cb` docs: log entry, ticket and Status flip for the JjScript console defects (P-2026-11-03-0000)
- `d52bb1c58` docs: Status flip and log entry for a direct merge (P-2026-11-02-2357)
- `217b931da` fix(jjscript): a let value keeps the bindings of its forall or exists (P-2026-11-03-0000)
- `c3fcb4e0a` fix(jjscript): eval hands JjEL the source text, not joined tokens (P-2026-11-03-0000)
- `b9c45587a` fix(jjscript): create package passes DPackage.new the kind of its father (P-2026-11-03-0000)
- `2decd2160` fix(jjscript): create refuses a named parent that resolves nowhere (P-2026-11-03-0000)
- `9ff3f733b` docs: discovery for the four JjScript console defects (P-2026-11-03-0000)
- `dfc34e2b1` docs: close T6a, Status flips, log entry, ticket (P-2026-11-02-2355)
- `98d34c9c4` merge: jjtl-forall-collection-jjel into alfonso-frontend-jjtl (P-2026-11-02-2357)
- `c258151f9` docs: add prompt P-2026-11-03-0000, JjScript console defects
- `be4a90587` feat(codegen): diff an edited text against its model (P-2026-11-02-2327)
- `34b82af49` docs: add prompt P-2026-11-02-2357, merge jjtl-forall-collection-jjel into alfonso-frontend-jjtl
- `b4378e231` docs: Status flip of P-2026-11-02-2345
- `5556bd53b` docs: add prompt P-2026-11-02-2355, close T6a (RC-51)
- `00910d6a4` docs: log entry for the JjEL forall collection lane (P-2026-11-02-2345)
- `9c0ac6c3d` feat(jjtl): JjEL parses a forall collection the legacy parser cannot (P-2026-11-02-2345)
- `df916d615` docs: add prompt P-2026-11-02-2345, JjTL forall collection parsed by JjEL
- `54fbfa71e` docs: R-FA-9 and R-FA-10 ratified by Alfonso
- `d5de57715` docs: lesson on load generators in the log entry of P-2026-11-02-2330
- `98218fc30` docs: Status flip and log entry for the codegen-tests-budget merge (P-2026-11-02-2330)
- `8b4afae3d` docs: R-JTG-9, close merge P-2026-11-02-2245
- `7536db524` merge: codegen-tests-budget into alfonso-frontend-jjtl (P-2026-11-02-2330)
- `d91ab2e41` chore: version 3.1.1, aligned with production
- `ba91b6360` docs: add prompt P-2026-11-02-2330, merge codegen-tests-budget into alfonso-frontend-jjtl
- `52e49d05c` docs: add prompt P-2026-11-02-2327, textual syntax T6a
- `006a9da38` docs: Status flip and log entry for the textual-unprinted merge (P-2026-11-02-2317)
- `2951a72a6` merge: textual-unprinted into alfonso-frontend-jjtl (P-2026-11-02-2317)
- `4ff50a926` docs: add prompt P-2026-11-02-2317, merge textual-unprinted into alfonso-frontend-jjtl
- `7d66c7420` docs: note on R-TXT-30, measured by P-2026-11-02-2113
- `e13326d89` docs: log entry and Status flip for the load-proof test budget (P-2026-11-02-2250)
- `ac2ee82f8` test: give codegen and trace-monitor tests a load-proof time budget (P-2026-11-02-2250)
- `0da32d9a7` docs: add prompt P-2026-11-02-2250, tests that fail under load
- `8a2490c20` merge: jjtl-notation-measure into alfonso-frontend-jjtl (P-2026-11-02-2245)
- and 13 more: `git log --oneline 8f5355b74..b200ccbc8`

This branch brings, 22 commits:

- `3ace5cb34` docs: Status lines of P-2026-11-02-2338 and P-2026-11-03-0009
- `00335dd54` docs: log entry and three tickets, JjTL B2 closed (P-2026-11-03-0009)
- `b1d1c45fd` docs(jjtl): SPEC 5.3.3, B2 list closed but item 4 (P-2026-11-03-0009)
- `bbaf4f1fc` docs: add prompt P-2026-11-03-0009, close JjTL B2
- `7e96a4e1c` feat(jjtl): B2 write-back by target identity (P-2026-11-02-2338)
- `e02dbbe10` docs: add prompt P-2026-11-02-2338, JjTL B2 write-back
- `ed7a4614f` docs: Status line of P-2026-11-02-2321
- `7cee663cc` docs: log entry, JjTL B1 steps 4 and 5 (P-2026-11-02-2321)
- `b0ad73715` docs(jjtl): SPEC 5.3.3 lazy rules and containment under B, 12, B2 list (P-2026-11-02-2321)
- `6bf6e6578` feat(jjtl): B1 step 5, containment under B (P-2026-11-02-2321)
- `105140d39` feat(jjtl): B1 step 4, lazy rules (P-2026-11-02-2321)
- `d95f2e215` docs: add prompt P-2026-11-02-2321, JjTL B1 steps 4 and 5
- `0dfcc89eb` docs: Status lines of P-2026-11-02-2224 and P-2026-11-02-2247
- `d50f048ad` docs: log entry, JjTL B1 steps 2 and 3 (P-2026-11-02-2247)
- `0c2e9d071` docs(jjtl): SPEC 5.3.3, called rules and the environment (P-2026-11-02-2247)
- `8ddcc744f` feat(jjtl): B1 step 3, the environment (P-2026-11-02-2247)
- `4e2891bc3` test(jjtl): B1 step 2, called rules tested (P-2026-11-02-2247)
- `97bf1e8fb` docs: add prompt P-2026-11-02-2247, JjTL B1 steps 2 and 3
- `bacc6839d` wip(jjtl): B1 step 2 from the handoff, untested (P-2026-11-02-2224)
- `8c8da7b10` docs(jjtl): SPEC 2.1 and 3.4b, grammar of called and lazy rules (P-2026-11-02-2224)
- `89b7c86e5` feat(jjtl): B1 step 1, grammar of called, lazy and delegating rules (P-2026-11-02-2224)
- `bb01c8060` docs: add prompt P-2026-11-02-2224, JjTL B1 called and lazy rules

Measured by `lane-run merge --trunk-into` at 2026-11-03 00:45, trunk at `b200ccbc8`:

- `git merge-tree --write-tree --name-only jjtl-called-rules b200ccbc8`: zero conflicts.
- Files changed since the base: 19 on the branch side, 56 on the trunk side; on both sides: `docs/log-inbox/hw-notation.md`, `frontend/src/jjtl/SPEC.md`, `frontend/src/jjtl/parser/parser.ts`.
- `git diff --name-only 8f5355b74 3ace5cb34 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-02_2224_prompt_jjtl_b1_called_lazy_rules.md` (eseguito in parte 2026-11-02 · lane hw-notation · steps 1-3 (89b7c86e5, 4e2891bc3, 8ddcc744f) · steps 4-5 to a next lane), `claude_2026-11-02_2247_prompt_jjtl_b1_steps_2_3.md` (eseguito 2026-11-02 · lane hw-notation · 4e2891bc3, 8ddcc744f), `claude_2026-11-02_2321_prompt_jjtl_b1_steps_4_5.md` (eseguito 2026-11-02 · lane hw-notation · 105140d39, 6bf6e6578, b0ad73715), `claude_2026-11-02_2338_prompt_jjtl_b2_writeback.md` (eseguito 2026-11-03 · lane hw-notation · 7e96a4e1c, closed by P-2026-11-03-0009), `claude_2026-11-03_0009_prompt_jjtl_b2_close.md` (eseguito 2026-11-03 · lane hw-notation · b1d1c45fd, 00335dd54).
- `git worktree list`: `jjtl-called-rules` in `/Users/alfonso/jjodel-w-jjtlcalled`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

## COME

1. Preconditions above, plus: `b200ccbc8` is the tip of `alfonso-frontend-jjtl` (if a docs-only commit moved it, say so and merge `b200ccbc8` all the same); `git worktree list` shows `alfonso-frontend-jjtl` only in `/Users/alfonso/jjodel-release`.
2. Measure again: `git merge-tree --write-tree --name-only jjtl-called-rules b200ccbc8` (measured above: zero conflicts). A conflict in any file outside `docs/decisions.md` and `docs/log-inbox/*.md`: **stop** with `Outcome: question` and the conflict hunks quoted; do not resolve code by hand in this lane.
3. `git merge --no-ff --no-commit b200ccbc8`.
4. Resolve `docs/decisions.md`, if it conflicts, by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block, each section heading once. Resolve every `docs/log-inbox/*.md` that conflicts by union: preamble, the trunk's entries, then the branch's entries, all verbatim, each heading once. Probes on the resolved tree, each counted with `grep -c -F`:
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-02 — feat(jjtl): B1 steps 2 and 3, called rules tested, the environment (P-2026-11-02-2247)` once (branch).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-02 — feat(jjtl): B1 steps 4 and 5, lazy rules and containment under B (P-2026-11-02-2321)` once (branch).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-03 — ticket: JjTL source serializer unwraps a one-element many-valued reference` once (branch).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-03 — ticket: JjTL source serializer drops a repeated pointer of a many-valued reference` once (branch).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-03 — ticket: JjTL write-back of a 2,559-object tree takes 17 s against 603 ms in the executor` once (branch).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-03 — feat(jjtl): B2 closed, probes rerun, SPEC 5.3.3 (P-2026-11-03-0009)` once (branch).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-02 — feat(codegen): report objects the text does not print (P-2026-11-02-2113)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-02 — ticket: R-TXT-30 warning rarely reachable for an enum grouping (P-2026-11-02-2113)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-02 — merge: textual-unprinted into alfonso-frontend-jjtl (P-2026-11-02-2317)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-03 — feat(codegen): diff an edited text against its model (P-2026-11-02-2327, P-2026-11-02-2355)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-03 — ticket: a text edit of a model with a single-valued reference outside the text is always refused` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-03 — merge: textual-t6a into alfonso-frontend-jjtl (P-2026-11-03-0011)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-02 — discovery: can an M1 model depend on another M1 model (P-2026-11-02-2021)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-02 — ticket: the textual printer writes a bare reference keyword when the target is not in the text, and the text does not parse` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-02 — discovery: how far the default textual notation goes for template and library models (P-2026-11-02-1942)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-11-02 — discovery: forall body by element id, stopped before Phase 2 (P-2026-11-02-2105)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-11-02 — feat(jjscript): forall body acts on the element by id (P-2026-11-02-2140)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-11-02 — merge: jjscript-forall-by-id into alfonso-frontend-jjtl (P-2026-11-02-2222)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-11-02 — test: codegen and trace-monitor tests get a load-proof time budget (P-2026-11-02-2250)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-11-02 — merge: codegen-tests-budget into alfonso-frontend-jjtl (P-2026-11-02-2330)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-11-02 — feat(jjtl): JjEL parses a forall collection the legacy parser cannot (P-2026-11-02-2345)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-11-03 — merge: jjtl-forall-collection-jjel into alfonso-frontend-jjtl (P-2026-11-02-2357)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-11-03 — fix(jjscript): four JjScript console defects (P-2026-11-03-0000)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-11-03 — ticket: Info.tsx creates a package without fatherType` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-11-03 — merge: jjscript-console-defects into alfonso-frontend-jjtl (P-2026-11-03-0020)` once (trunk).
5. On the resolved tree, before committing, read every file changed on both sides once from top to bottom (`docs/log-inbox/hw-notation.md`, `frontend/src/jjtl/SPEC.md`, `frontend/src/jjtl/parser/parser.ts`); an auto-merge is a textual result, not a semantic one: no conflict marker, no duplicated declaration, hook or selector, one root per component.
6. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: jjtl-called-rules takes alfonso-frontend-jjtl (P-2026-11-03-0045)`. Body: the two sides' shas, the merge-tree measurement, the union resolutions, the reading of step 5, `Model:` and `Co-Authored-By` trailers.
7. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: state the expectation first as the trunk tip's count (measure it read-only in `/Users/alfonso/jjodel-release` with `node /Users/alfonso/jjodel-w-jjtlcalled/frontend/scripts/run-quiet.mjs vitest-trunk -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-release`/frontend`, the runner's log goes to this tree's `.agent-logs/`; do not write there) plus the tests this branch added, 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 3ace5cb34` (this branch's own pre-merge tip; the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 8.
8. `Outcome: hard-stop`: the chat re-runs the visual probes of the branch on this tree and gives the GO. Do not start a server.
9. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane jjtl-called-rules · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/hw-notation.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry, jjtl-called-rules took the trunk (P-2026-11-03-0045)` (P16, RC-17). `Outcome: done`. The merge of `jjtl-called-rules` into the trunk gets its own prompt (`lane-run merge jjtl-called-rules --into alfonso-frontend-jjtl`).

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 7), `git checkout -- .`, `git clean`, `--no-verify`, a hand edit to a code file, editing any line inside a decision block or a log entry, rebase, squash, push, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-release`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge --trunk-into` from `frontend/scripts/lane-templates/trunk-into-branch.md`, in the shape of `claude_2026-09-27_0325_prompt_sim_profiles_take_trunk.md`.
