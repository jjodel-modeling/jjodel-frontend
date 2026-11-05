# Prompt: textual-ebnf-literals-step2 takes the trunk before its own merge

Prompt-ID: P-2026-11-05-1538
Chat: https://claude.ai/code/session_01DQt9R5nh3m4Y234MPGL9kH
Request: none (rendered by lane-run, no chat URL known for https://claude.ai/code/session_01DQt9R5nh3m4Y234MPGL9kH)
Lane: full (merge of the trunk into the branch; 1 conflict: `docs/log-inbox/codegen.md` measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-w-ebnflit2`, branch `textual-ebnf-literals-step2`, a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-ebnflit2`, branch `textual-ebnf-literals-step2`, `git log -1` is the commit that adds this file (its parent `2c15d1761`), `git status` empty apart from gitignored `frontend/scripts/smoke/_tmp_*`, `MERGE_HEAD` absent. Otherwise stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-05-1538 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

## COSA

RC-14: a branch resolves its conflicts with the trunk on the branch, before the trunk takes it. Bring the trunk `alfonso-frontend-jjtl` at the explicit sha `95359d75e` into `textual-ebnf-literals-step2` with one merge commit, `--no-ff`, in the shape of `45fcd7233` (the last merge commit on `textual-ebnf-literals-step2`; read its body first). Merge base `8565e3e84`. The trunk brings, since the base, 25 commits:

- `95359d75e` docs: Status flip and log entry for the textual-ebnf-literals merge (P-2026-11-05-1522)
- `eddaf1e6d` merge: textual-ebnf-literals into alfonso-frontend-jjtl (P-2026-11-05-1522)
- `34168b38a` docs: add prompt P-2026-11-05-1522, merge textual-ebnf-literals into alfonso-frontend-jjtl
- `df8678701` docs: Status flip and log entry, textual-ebnf-literals took the trunk (P-2026-11-05-1455)
- `f4751483b` docs: Status flip and log entry for the xmi-typed-integers merge (P-2026-11-05-1512)
- `450864a4b` merge: xmi-typed-integers into alfonso-frontend-jjtl (P-2026-11-05-1512)
- `62fc7d950` merge: textual-ebnf-literals takes alfonso-frontend-jjtl (P-2026-11-05-1455)
- `452c602a7` docs: add prompt P-2026-11-05-1512, merge xmi-typed-integers into alfonso-frontend-jjtl
- `f1a3911d0` docs: R-XMI-1, ticket and log entry for the XMI typed values (P-2026-11-05-1446)
- `31831a082` docs: XMI typed integers discovery, app and node measures (P-2026-11-05-1446)
- `07ce98735` docs: add prompt P-2026-11-05-1455, textual-ebnf-literals takes the trunk
- `6ef8fbd10` docs(codegen): close EBNF literals L1b, editable literal islands (P-2026-11-05-0921, 0945, 1415)
- `36e67e7da` fix(xmi): type imported attribute values by the metamodel (#607) (P-2026-11-05-1446)
- `782262393` docs: add prompt P-2026-11-05-1446, XMI import typed integers (#607)
- `d95d5b9ca` docs: Status flip and log entry for the hw-core-jjtl-app merge (P-2026-11-05-1431)
- `6b98a59de` merge: hw-core-jjtl-app into alfonso-frontend-jjtl (P-2026-11-05-1431)
- `0aef5bfab` docs: add prompt P-2026-11-05-1431, merge hw-core-jjtl-app into alfonso-frontend-jjtl
- `c637ebf5f` feat(codegen): L1b item 2, the editable literals of the EBNF mode (P-2026-11-05-0921)
- `8d0eae1bd` docs: tickets #607-#610, log entry and Status for core JjTL in app (P-2026-11-05-1400)
- `e68d12776` docs: discovery, core JjTL with called rules in node and in the app (P-2026-11-05-1400)
- `c948c1e17` docs: add prompt P-2026-11-05-1415, L1b continuation 2
- `5c744b50c` docs: add prompt P-2026-11-05-1400, core JjTL with called rules in the app
- `5b15dd1f7` docs: add prompt P-2026-11-05-0945, L1b continuation
- `a44ff8319` feat(codegen): L1b item 1, the syntax draft lifted into useSyntaxDraft (P-2026-11-05-0921)
- `1853f9425` docs: add prompt P-2026-11-05-0921, EBNF literals L1b

This branch brings, 8 commits:

- `2c15d1761` docs(codegen): close EBNF literals L2a, style token overrides (P-2026-11-05-1430, 1457)
- `f87481236` test(codegen): L2a (5), round trips under style token overrides (P-2026-11-05-1457)
- `eb73f7b49` feat(codegen): L2a (4), a form field per style token (P-2026-11-05-1457)
- `6d18953e1` docs: add prompt P-2026-11-05-1457, L2a continuation
- `612626c76` feat(codegen): L2a (3), the style-tokens rule (P-2026-11-05-1430)
- `e34070b3b` feat(codegen): L2a (2), base switch drops token overrides, fixed order (P-2026-11-05-1430)
- `1794d0dd0` feat(codegen): L2a (1), style token overrides resolved and applied (P-2026-11-05-1430)
- `9dc755f13` docs: add prompt P-2026-11-05-1430, EBNF literals L2a

Measured by `lane-run merge --trunk-into` at 2026-11-05 15:38, trunk at `95359d75e`:

- `git merge-tree --write-tree --name-only textual-ebnf-literals-step2 95359d75e`: 1 conflict: `docs/log-inbox/codegen.md`.
- Files changed since the base: 9 on the branch side, 22 on the trunk side; on both sides: `docs/log-inbox/codegen.md`.
- `git diff --name-only 8565e3e84 2c15d1761 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-05_1430_prompt_textual_ebnf_literals_l2a.md` (eseguito 2026-11-05 · lane full · 1794d0dd0, e34070b3b, 612626c76 (stopped at the ceiling, continued by P-2026-11-05-1457, RC-51) · verifica visiva non eseguita (style literals editable in the EBNF mode, no app probe)), `claude_2026-11-05_1457_prompt_textual_ebnf_literals_l2a_cont.md` (eseguito 2026-11-05 · lane full · eb73f7b49, f87481236 · closes P-2026-11-05-1430 · verifica visiva non eseguita (style literals editable in the EBNF mode, no app probe)).
- `git worktree list`: `textual-ebnf-literals-step2` in `/Users/alfonso/jjodel-w-ebnflit2`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-11-05-1538/result.json`.

## COME

1. Preconditions above, plus: `95359d75e` is the tip of `alfonso-frontend-jjtl` (if a docs-only commit moved it, say so and merge `95359d75e` all the same); `git worktree list` shows `alfonso-frontend-jjtl` only in `/Users/alfonso/jjodel-release`.
2. Measure again: `git merge-tree --write-tree --name-only textual-ebnf-literals-step2 95359d75e` (measured above: 1 conflict: `docs/log-inbox/codegen.md`). A conflict in any file outside `docs/decisions.md` and `docs/log-inbox/*.md`: **stop** with `Outcome: question` and the conflict hunks quoted; do not resolve code by hand in this lane.
3. `git merge --no-ff --no-commit 95359d75e`.
4. Resolve `docs/decisions.md`, if it conflicts, by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block, each section heading once. Resolve every `docs/log-inbox/*.md` that conflicts by union: preamble, the trunk's entries, then the branch's entries, all verbatim, each heading once. Probes on the resolved tree, each counted with `grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-XMI-1` (trunk); control: `- **R-XMI-2**` none.
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-05 — feat(codegen): L2a, the style tokens as overrides on the base, a form field per token (P-2026-11-05-1430, P-2026-11-05-1457)` once (branch).
   - `docs/decisions.md`: the heading `## R-XMI: attribute values of the XMI M1 import (decisions 2026-11-05)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-05 — feat(codegen): L1b, the editable literals of the EBNF mode over the shared syntax draft (P-2026-11-05-0921, P-2026-11-05-0945, P-2026-11-05-1415)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-05 — merge: textual-ebnf-literals takes alfonso-frontend-jjtl (P-2026-11-05-1455)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-05 — merge: textual-ebnf-literals into alfonso-frontend-jjtl (P-2026-11-05-1522)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-05 — ticket: XMI-imported integer attributes reach JjTL as strings` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-05 — ticket: JjTL: one-line 'attr := expr -> feature {...}' fails to parse with the source text` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-05 — ticket: EInt value above 2^31-1 silently clamped on L-layer read` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-05 — ticket: Smoke seed sets a stale welcome-modal key` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-05 — discovery: core JjTL with called rules, node on the trunk and the app write-back (P-2026-11-05-1400)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-05 — merge: hw-core-jjtl-app into alfonso-frontend-jjtl (P-2026-11-05-1431)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-05 — ticket: JjTL: a JjEL method unknown for the value's type warns instead of R-FA-11's error` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-05 — fix(xmi): attribute values typed by the metamodel (P-2026-11-05-1446)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-05 — merge: xmi-typed-integers into alfonso-frontend-jjtl (P-2026-11-05-1512)` once (trunk).
5. On the resolved tree, before committing, read every file changed on both sides once from top to bottom (`docs/log-inbox/codegen.md`); an auto-merge is a textual result, not a semantic one: no conflict marker, no duplicated declaration, hook or selector, one root per component.
6. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: textual-ebnf-literals-step2 takes alfonso-frontend-jjtl (P-2026-11-05-1538)`. Body: the two sides' shas, the merge-tree measurement, the union resolutions, the reading of step 5, `Model:` and `Co-Authored-By` trailers.
7. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: state the expectation first as the trunk tip's count (measure it read-only in `/Users/alfonso/jjodel-release` with `node /Users/alfonso/jjodel-w-ebnflit2/frontend/scripts/run-quiet.mjs vitest-trunk -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-release`/frontend`, the runner's log goes to this tree's `.agent-logs/`; do not write there) plus the tests this branch added, 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 2c15d1761` (this branch's own pre-merge tip; the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 8.
8. `Outcome: hard-stop`: the chat re-runs the visual probes of the branch on this tree and gives the GO. Do not start a server.
9. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane textual-ebnf-literals-step2 · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/codegen.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry, textual-ebnf-literals-step2 took the trunk (P-2026-11-05-1538)` (P16, RC-17). `Outcome: done`. The merge of `textual-ebnf-literals-step2` into the trunk gets its own prompt (`lane-run merge textual-ebnf-literals-step2 --into alfonso-frontend-jjtl`).

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 7), `git checkout -- .`, `git clean`, `--no-verify`, a hand edit to a code file, editing any line inside a decision block or a log entry, rebase, squash, push, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-release`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge --trunk-into` from `frontend/scripts/lane-templates/trunk-into-branch.md`, in the shape of `claude_2026-09-27_0325_prompt_sim_profiles_take_trunk.md`.
