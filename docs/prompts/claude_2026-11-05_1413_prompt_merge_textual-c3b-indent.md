# Prompt: merge textual-c3b-indent into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-05-1413
Chat: https://claude.ai/code/session_01DQt9R5nh3m4Y234MPGL9kH
Request: none (rendered by lane-run, no chat URL known for https://claude.ai/code/session_01DQt9R5nh3m4Y234MPGL9kH)
Lane: full (merge; zero conflicts measured)
Status: eseguito 2026-11-05 · lane merge · 45fcd7233 · verifica visiva passata 2026-11-05 (crops c3b-* of P-2026-11-05-0843 and ll1-* of P-2026-11-05-0910 checked by the chat, RC-23; lane auto)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-05-1413 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `547bba697`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `textual-c3b-indent` into the trunk with one merge commit, `--no-ff`, of the explicit sha `e04259214`, in the shape of `4b858ee65` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `547bba697`. The branch carries, on top of the base, 16 commits:

- `e04259214` docs: fix the prompt name in the 0943 log entry (P-2026-11-05-0943)
- `ea37a1a77` docs: Status flips and log entry, textual-c3b-indent took the trunk (P-2026-11-05-0943)
- `38a49d347` merge: textual-c3b-indent takes alfonso-frontend-jjtl (P-2026-11-05-0943)
- `0d0be246e` docs: add prompt P-2026-11-05-0943, merge alfonso-frontend-jjtl into textual-c3b-indent
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

The trunk carries, since the base, 0 commits:

- none

Measured by `lane-run merge` at 2026-11-05 14:13, trunk at `547bba697`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl e04259214`: zero conflicts.
- Files changed since the base: 22 on the branch side, 0 on the trunk side; on both sides: none.
- `git diff --name-only 547bba697 e04259214 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-05_0748_prompt_textual_c3b_indent.md` (eseguito 2026-11-05 · hard-stop al tetto di contesto · lane textual-c3b-indent · 72389e089 · continuato da P-2026-11-05-0816 · chiuso da P-2026-11-05-0843), `claude_2026-11-05_0816_prompt_textual_c3b_cont.md` (eseguito 2026-11-05 · hard-stop al tetto di contesto · lane textual-c3b-indent · 7c004674a · continuato da P-2026-11-05-0843 · chiuso da P-2026-11-05-0843), `claude_2026-11-05_0843_prompt_textual_c3b_cont2.md` (eseguito 2026-11-05 · lane textual-c3b-indent · 506837dc1 · parziale (ticket: false LL(1) under Indentation) · app probe 15/15, verifica visiva in attesa del GO), `claude_2026-11-05_0910_prompt_textual_c3b_ll1_lines.md` (eseguito 2026-11-05 · lane textual-c3b-indent · 559b61194 · app probe 9/9, verifica visiva della chat passata 2026-11-05 (RC-23, crops ll1-*), lane auto), `claude_2026-11-05_0943_prompt_textual-c3b-indent_take_trunk.md` (eseguito 2026-11-05 · lane textual-c3b-indent · 38a49d347 · the session died in the bridge outage after the merge commit; gates run by the direct merge into the trunk).
- `git worktree list`: `textual-c3b-indent` in `/Users/alfonso/jjodel-w-textc3b`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-11-05-1413/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `e04259214` is the tip of `textual-c3b-indent`; the prompt files of the branch read `Status: eseguito` at `e04259214`; `git worktree list` shows `textual-c3b-indent` only in `/Users/alfonso/jjodel-w-textc3b`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl e04259214` (measured above: zero conflicts). `git diff --name-only 547bba697 e04259214 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 547bba697 alfonso-frontend-jjtl` with `git diff --name-only 547bba697 e04259214` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-05 — feat(codegen): C3b, the deletion guard, the Indentation style, Indentation in the picker and the form (P-2026-11-05-0748, P-2026-11-05-0816, P-2026-11-05-0843)` once (branch).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-05 — ticket: under Indentation the style check reports false LL(1) conflicts on every annotated grammar` once (branch).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-05 — fix(codegen): C3b, a line-aware LL(1) check under Indentation, the picker refuses a refused style (P-2026-11-05-0910)` once (branch).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-05 — merge: textual-c3b-indent takes alfonso-frontend-jjtl (P-2026-11-05-0943)` once (branch).
4. `git merge --no-ff --no-commit e04259214`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: textual-c3b-indent into alfonso-frontend-jjtl (P-2026-11-05-1413)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `e04259214` in `/Users/alfonso/jjodel-w-textc3b`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-textc3b`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 547bba697` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only 547bba697 HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/codegen.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the textual-c3b-indent merge (P-2026-11-05-1413)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-textc3b`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
