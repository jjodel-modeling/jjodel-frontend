# Prompt: textual-c3b-indent takes the trunk before its own merge

Prompt-ID: P-2026-11-05-0943
Chat: https://claude.ai/code/session_01DQt9R5nh3m4Y234MPGL9kH
Request: none (rendered by lane-run, no chat URL known for https://claude.ai/code/session_01DQt9R5nh3m4Y234MPGL9kH)
Lane: full (merge of the trunk into the branch; 1 conflict: `docs/log-inbox/codegen.md` measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-w-textc3b`, branch `textual-c3b-indent`, a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-textc3b`, branch `textual-c3b-indent`, `git log -1` is the commit that adds this file (its parent `9d41c6ed5`), `git status` empty apart from gitignored `frontend/scripts/smoke/_tmp_*`, `MERGE_HEAD` absent. Otherwise stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-05-0943 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

## COSA

RC-14: a branch resolves its conflicts with the trunk on the branch, before the trunk takes it. Bring the trunk `alfonso-frontend-jjtl` at the explicit sha `547bba697` into `textual-c3b-indent` with one merge commit, `--no-ff`, in the shape of `f1bef5364` (the last merge commit on `textual-c3b-indent`; read its body first). Merge base `c4e446a9e`. The trunk brings, since the base, 20 commits:

- `547bba697` docs: R-TXT-49, R-TXT-50 and R-TXT-51 (4) ratified (Alfonso 09:26)
- `3831e085c` docs: R-TXT-51, block tokens per element (Alfonso 09:22)
- `5fd33809e` docs: R-TXT-50, the line-aware LL(1) check under Indentation, provisional
- `b9d6382dd` docs: Status flip and log entry for the textual-ebnf-literals merge (P-2026-11-05-0906)
- `4b858ee65` merge: textual-ebnf-literals into alfonso-frontend-jjtl (P-2026-11-05-0906)
- `66c31e29a` docs: add prompt P-2026-11-05-0906, merge textual-ebnf-literals into alfonso-frontend-jjtl
- `2c0cec54b` docs(codegen): close EBNF literals L1a (P-2026-11-05-0841)
- `210c61ee1` feat(codegen): L1a, an EBNF literal's field, default and checks (P-2026-11-05-0841)
- `251e4e565` feat(codegen): L1a, the origin of each EBNF literal and its span (P-2026-11-05-0841)
- `870982ea6` docs: add prompt P-2026-11-05-0841, EBNF literals L1a
- `664929d03` Merge branch 'alfonso-frontend-jjtl' into textual-ebnf-literals
- `1cf342a50` docs: R-TXT-49, the EBNF literals decisions taken under lane auto, provisional
- `cd200cb55` docs: Status flips of the EBNF literals discovery (P-2026-11-05-0746, 0815)
- `50382685f` docs(codegen): EBNF literals discovery, lanes and decisions (P-2026-11-05-0815)
- `5f4841169` docs(codegen): EBNF literals discovery, style overrides (P-2026-11-05-0815)
- `781d36a91` docs: add prompt P-2026-11-05-0815, EBNF literals report continuation
- `a61e4fdfc` docs(codegen): EBNF literals discovery, back into the draft (P-2026-11-05-0746)
- `5ff84979b` docs(codegen): EBNF literals discovery, the editor (P-2026-11-05-0746)
- `a16a037a4` docs(codegen): EBNF literals discovery, the origins (P-2026-11-05-0746)
- `dddab23b9` docs: add prompt P-2026-11-05-0746, EBNF literals discovery

This branch brings, 12 commits:

- `9d41c6ed5` docs(codegen): close C3b, indentation, deletion guard, line-aware LL(1) (P-2026-11-05-0748, 0816, 0843, 0910)
- `559b61194` feat(codegen): C3b, the style picker refuses a style the check refuses (P-2026-11-05-0910)
- `53f8481f0` test(codegen): type the bare indent record in the LL(1) test (P-2026-11-05-0910)
- `e84d1c814` fix(codegen): C3b, a line-aware LL(1) check under Indentation (P-2026-11-05-0910)
- `971076903` docs: add prompt P-2026-11-05-0910, C3b line-aware LL(1) under Indentation
- `506837dc1` test(codegen): C3b item 4, the guard's bench and its two blind spots (P-2026-11-05-0843)
- `283b5dbd6` feat(codegen): C3b item 3, Indentation in the picker and the Syntax form (P-2026-11-05-0843)
- `7ee42be5c` docs: add prompt P-2026-11-05-0843, C3b continuation 2
- `7c004674a` feat(codegen): C3b item 2, the indentation style (P-2026-11-05-0816)
- `9ba41a867` docs: add prompt P-2026-11-05-0816, C3b continuation
- `72389e089` feat(codegen): C3b item 1, the deletion guard of the Text tab (P-2026-11-05-0748)
- `0c483f613` docs: add prompt P-2026-11-05-0748, C3b indentation with the deletion guard

Measured by `lane-run merge --trunk-into` at 2026-11-05 09:43, trunk at `547bba697`:

- `git merge-tree --write-tree --name-only textual-c3b-indent 547bba697`: 1 conflict: `docs/log-inbox/codegen.md`.
- Files changed since the base: 21 on the branch side, 10 on the trunk side; on both sides: `docs/log-inbox/codegen.md`, `frontend/src/codegen/textual/concreteGrammar.ts`, `frontend/src/codegen/textual/syntaxForm.ts`.
- `git diff --name-only c4e446a9e 9d41c6ed5 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-05_0748_prompt_textual_c3b_indent.md` (eseguito 2026-11-05 · hard-stop al tetto di contesto · lane textual-c3b-indent · 72389e089 · continuato da P-2026-11-05-0816 · chiuso da P-2026-11-05-0843), `claude_2026-11-05_0816_prompt_textual_c3b_cont.md` (eseguito 2026-11-05 · hard-stop al tetto di contesto · lane textual-c3b-indent · 7c004674a · continuato da P-2026-11-05-0843 · chiuso da P-2026-11-05-0843), `claude_2026-11-05_0843_prompt_textual_c3b_cont2.md` (eseguito 2026-11-05 · lane textual-c3b-indent · 506837dc1 · parziale (ticket: false LL(1) under Indentation) · app probe 15/15, verifica visiva in attesa del GO), `claude_2026-11-05_0910_prompt_textual_c3b_ll1_lines.md` (eseguito 2026-11-05 · lane textual-c3b-indent · 559b61194 · app probe 9/9, verifica visiva in attesa del GO).
- `git worktree list`: `textual-c3b-indent` in `/Users/alfonso/jjodel-w-textc3b`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

## COME

1. Preconditions above, plus: `547bba697` is the tip of `alfonso-frontend-jjtl` (if a docs-only commit moved it, say so and merge `547bba697` all the same); `git worktree list` shows `alfonso-frontend-jjtl` only in `/Users/alfonso/jjodel-release`.
2. Measure again: `git merge-tree --write-tree --name-only textual-c3b-indent 547bba697` (measured above: 1 conflict: `docs/log-inbox/codegen.md`). A conflict in any file outside `docs/decisions.md` and `docs/log-inbox/*.md`: **stop** with `Outcome: question` and the conflict hunks quoted; do not resolve code by hand in this lane.
3. `git merge --no-ff --no-commit 547bba697`.
4. Resolve `docs/decisions.md`, if it conflicts, by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block, each section heading once. Resolve every `docs/log-inbox/*.md` that conflicts by union: preamble, the trunk's entries, then the branch's entries, all verbatim, each heading once. Probes on the resolved tree, each counted with `grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-TXT-49` (trunk), `R-TXT-50` (trunk), `R-TXT-51` (trunk); control: `- **R-TXT-52**` none.
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-05 — feat(codegen): C3b, the deletion guard, the Indentation style, Indentation in the picker and the form (P-2026-11-05-0748, P-2026-11-05-0816, P-2026-11-05-0843)` once (branch).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-05 — ticket: under Indentation the style check reports false LL(1) conflicts on every annotated grammar` once (branch).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-05 — fix(codegen): C3b, a line-aware LL(1) check under Indentation, the picker refuses a refused style (P-2026-11-05-0910)` once (branch).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-05 — feat(codegen): L1a, the origin of each EBNF literal and its record field (P-2026-11-05-0841)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-05 — merge: textual-ebnf-literals into alfonso-frontend-jjtl (P-2026-11-05-0906)` once (trunk).
5. On the resolved tree, before committing, read every file changed on both sides once from top to bottom (`docs/log-inbox/codegen.md`, `frontend/src/codegen/textual/concreteGrammar.ts`, `frontend/src/codegen/textual/syntaxForm.ts`); an auto-merge is a textual result, not a semantic one: no conflict marker, no duplicated declaration, hook or selector, one root per component.
6. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: textual-c3b-indent takes alfonso-frontend-jjtl (P-2026-11-05-0943)`. Body: the two sides' shas, the merge-tree measurement, the union resolutions, the reading of step 5, `Model:` and `Co-Authored-By` trailers.
7. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: state the expectation first as the trunk tip's count (measure it read-only in `/Users/alfonso/jjodel-release` with `node /Users/alfonso/jjodel-w-textc3b/frontend/scripts/run-quiet.mjs vitest-trunk -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-release`/frontend`, the runner's log goes to this tree's `.agent-logs/`; do not write there) plus the tests this branch added, 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 9d41c6ed5` (this branch's own pre-merge tip; the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 8.
8. `Outcome: hard-stop`: the chat re-runs the visual probes of the branch on this tree and gives the GO. Do not start a server.
9. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane textual-c3b-indent · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/codegen.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry, textual-c3b-indent took the trunk (P-2026-11-05-0943)` (P16, RC-17). `Outcome: done`. The merge of `textual-c3b-indent` into the trunk gets its own prompt (`lane-run merge textual-c3b-indent --into alfonso-frontend-jjtl`).

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 7), `git checkout -- .`, `git clean`, `--no-verify`, a hand edit to a code file, editing any line inside a decision block or a log entry, rebase, squash, push, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-release`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge --trunk-into` from `frontend/scripts/lane-templates/trunk-into-branch.md`, in the shape of `claude_2026-09-27_0325_prompt_sim_profiles_take_trunk.md`.
