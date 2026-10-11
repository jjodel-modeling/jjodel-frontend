# Prompt: merge gv-right-margin into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-11-0957
Chat: —
Lane: full (merge; zero conflicts measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-11-0957 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `3c5e97b88`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `gv-right-margin` into the trunk with one merge commit, `--no-ff`, of the explicit sha `9d9e0be57`, in the shape of `eb5600dbb` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `7523373cb`. The branch carries, on top of the base, 5 commits:

- `9d9e0be57` docs(prompts): Status flip, P-2026-10-11-0040
- `1ceda9802` docs(log): right-margin lane entry and two tickets (P-2026-10-11-0040)
- `dfa6f07ce` test(probe): graphVertex right margin acceptance probe (P-2026-10-11-0040)
- `aea222c46` fix(ir): partitions keep their content margin on the right (P-2026-10-11-0040)
- `b08fb3885` docs(prompts): graphVertex right margin, fast lane (P-2026-10-11-0040)

The trunk carries, since the base, 16 commits:

- `3c5e97b88` docs: Status flip and log entry for the ir-graphvertex merge (P-2026-10-11-0059)
- `eb5600dbb` merge: ir-graphvertex into alfonso-frontend-jjtl (P-2026-10-11-0059)
- `361a11224` docs: add prompt P-2026-10-11-0059, merge ir-graphvertex into alfonso-frontend-jjtl
- `aa9fd6701` docs: Status flip and log entry, ir-graphvertex took the trunk (P-2026-10-11-0011)
- `294a29084` merge: do-freeze into alfonso-frontend-jjtl (P-2026-10-11-0034)
- `90286184d` docs: add prompt P-2026-10-11-0034, merge do-freeze into alfonso-frontend-jjtl
- `72762297b` merge: jjodie-reserved into alfonso-frontend-jjtl (P-2026-10-11-0023)
- `7b670fc45` docs: add prompt P-2026-10-11-0023, merge jjodie-reserved into alfonso-frontend-jjtl
- `e5d95a99c` docs: log entry and freeze ticket pointer, reserved identifiers (P-2026-10-10-0045)
- `67b17ce5a` docs(discovery): Phase 2 addendum, reserved identifiers (P-2026-10-10-0045)
- `07bf5c3ee` feat(jodie): gate reserved identifiers in Jjodie's scripts (P-2026-10-10-0045)
- `b5e9ed415` fix(jodie): rule 8 lists every reserved word, from the lexer list (P-2026-10-10-0045)
- `377070258` refactor(jjscript): one list of reserved identifiers, read by the lexer (P-2026-10-10-0045)
- `592b12e9e` docs(log): the do-block freeze fix, inbox entry (P-2026-10-10-0810)
- `e5c8fa126` fix(jjscript): a block body that is not a command stops (P-2026-10-10-0810)
- `1153700ce` docs(discovery): Jjodie reserved identifiers, Phase 1 report (P-2026-10-10-0045)

Measured by `lane-run merge` at 2026-10-11 09:57, trunk at `3c5e97b88`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 9d9e0be57`: zero conflicts.
- Files changed since the base: 6 on the branch side, 19 on the trunk side; on both sides: none.
- `git diff --name-only 7523373cb 9d9e0be57 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-10-11_0040_prompt_graphvertex_right_margin.md` (eseguito 2026-10-11 · lane gv-right-margin · aea222c46, dfa6f07ce, 1ceda9802 · verifica visiva passata 2026-10-11 (Alfonso) · flip 2026-10-11 dalla chat).
- `git worktree list`: `gv-right-margin` in `/Users/alfonso/jjodel-w-gvmargin`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-10-11-0957/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `9d9e0be57` is the tip of `gv-right-margin`; the prompt files of the branch read `Status: eseguito` at `9d9e0be57`; `git worktree list` shows `gv-right-margin` only in `/Users/alfonso/jjodel-w-gvmargin`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 9d9e0be57` (measured above: zero conflicts). `git diff --name-only 7523373cb 9d9e0be57 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 7523373cb alfonso-frontend-jjtl` with `git diff --name-only 7523373cb 9d9e0be57` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/gv-right-margin.md`: the heading `## 2026-10-11 — fix(ir): partitions keep their content margin on the right (P-2026-10-11-0040)` once (branch).
   - `docs/log-inbox/gv-right-margin.md`: the heading `## 2026-10-11 — ticket: Auto layout writes a grown pool's size with its old position` once (branch).
   - `docs/log-inbox/gv-right-margin.md`: the heading `## 2026-10-11 — ticket: a stacked partition loses its bottom margin as it lost the right one` once (branch).
   - `docs/log-inbox/ir-graphvertex.md`: the heading `## 2026-10-11 — merge: ir-graphvertex takes alfonso-frontend-jjtl (P-2026-10-11-0011)` once (trunk).
   - `docs/log-inbox/ir-graphvertex.md`: the heading `## 2026-10-11 — merge: ir-graphvertex into alfonso-frontend-jjtl (P-2026-10-11-0059)` once (trunk).
   - `docs/log-inbox/jjodie-reserved.md`: the heading `## 2026-10-10 — feat(jodie): one list of reserved identifiers and a gate on Jjodie's scripts (P-2026-10-10-0045)` once (trunk).
   - `docs/log-inbox/jjscript.md`: the heading `## 2026-10-10 — fix(jjscript): a do block whose body is not a command stops (P-2026-10-10-0810)` once (trunk).
4. `git merge --no-ff --no-commit 9d9e0be57`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: gv-right-margin into alfonso-frontend-jjtl (P-2026-10-11-0957)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `9d9e0be57` in `/Users/alfonso/jjodel-w-gvmargin`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 3c5e97b88` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/gv-right-margin.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the gv-right-margin merge (P-2026-10-11-0957)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-gvmargin`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
