# Prompt: merge textual-c2g-align into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-08-1330
Chat: C-2026-11-03-1037
Request: https://claude.ai/code/session_01DQt9R5nh3m4Y234MPGL9kH (merge of textual-c2g-align launched by chat C-2026-11-03-1037)
Lane: full (merge; zero conflicts measured)
Status: eseguito 2026-11-08 · lane merge · ae7a149aa · verifica visiva passata 2026-11-08 (C2g crops 1-chip, 2-default-view, 3-same-form in ~/.jjodel-lanes/P-2026-11-08-1239/ checked by the chat)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-08-1330 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `4dd7f8b2a`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `textual-c2g-align` into the trunk with one merge commit, `--no-ff`, of the explicit sha `e0997544f`, in the shape of `bc4b137cd` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `3d0cc984d`. The branch carries, on top of the base, 5 commits:

- `e0997544f` docs: C2g log entry and Status flip (P-2026-11-08-1239)
- `5541ea46b` docs: R-TXT-59, a row header the register parses (P-2026-11-08-1239)
- `05dadce29` fix(editor-v2): C2g, one label for unnamed reference targets (P-2026-11-08-1239)
- `f0ecce336` docs: R-TXT-59 and the LIR of C2g, one unnamed label (P-2026-11-08-1239)
- `0ab860da1` docs: prompt for C2g, one label for unnamed reference targets (P-2026-11-08-1239)

The trunk carries, since the base, 14 commits:

- `4dd7f8b2a` docs: Status flip and log entry for the multi-tab-l6 merge (P-2026-11-08-1247)
- `bc4b137cd` merge: multi-tab-l6 into alfonso-frontend-jjtl (P-2026-11-08-1247)
- `af51a3094` docs: add prompt P-2026-11-08-1247, merge multi-tab-l6 into alfonso-frontend-jjtl
- `76f051677` docs: Status flip and log entry, multi-tab-l6 took the trunk (P-2026-11-08-1156)
- `7b4a75718` merge: multi-tab-l6 takes alfonso-frontend-jjtl (P-2026-11-08-1156)
- `bf98e6908` docs: add prompt P-2026-11-08-1156, merge alfonso-frontend-jjtl into multi-tab-l6
- `59c96355b` docs: L6 closure, app check tables and Status flips (P-2026-11-08-1003)
- `7f8e8c0fb` fix: paint a model tab opened beside another (P-2026-11-08-1003)
- `7ad9a6766` docs: prompt P-2026-11-08-1003, multi-tab L6 beside panel paint and closure
- `d65442ea9` docs: prompt P-2026-11-08-0852, multi-tab L6 app check and closure
- `c6ccbab4c` docs: L6 discovery, resolution and known limits (P-2026-11-08-0808)
- `89fa42c59` feat: a second tab on one model, Open in new tab and Open beside (P-2026-11-08-0808)
- `64b18a050` test: L6 second tab on one model, red (P-2026-11-08-0808)
- `46cde4fdc` docs: L6 discovery, a second tab on one model (P-2026-11-08-0808)

Measured by `lane-run merge` at 2026-11-08 13:30, trunk at `4dd7f8b2a`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl e0997544f`: zero conflicts.
- Files changed since the base: 6 on the branch side, 22 on the trunk side; on both sides: none.
- `git diff --name-only 3d0cc984d e0997544f -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-08_1239_prompt_textual_c2g_align.md` (eseguito 2026-11-08 · lane full · 05dadce29 · gates green (typecheck 0, build, check:docs, vitest 15344 passed with the 3 baseline import reds, smoke GREEN) · probe 18/18 on 3548, crops in ~/.jjodel-lanes/P-2026-11-08-1239/ · verifica visiva: GO di Alfonso in attesa).
- `git worktree list`: `textual-c2g-align` in `/Users/alfonso/jjodel-w-textc2g`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-11-08-1330/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `e0997544f` is the tip of `textual-c2g-align`; the prompt files of the branch read `Status: eseguito` at `e0997544f`; `git worktree list` shows `textual-c2g-align` only in `/Users/alfonso/jjodel-w-textc2g`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl e0997544f` (measured above: zero conflicts). `git diff --name-only 3d0cc984d e0997544f -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 3d0cc984d alfonso-frontend-jjtl` with `git diff --name-only 3d0cc984d e0997544f` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-TXT-59` (branch); control: `- **R-TXT-60**` none.
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — fix(editor-v2): C2g, one label for unnamed reference targets (P-2026-11-08-1239)` once (branch).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-08 — feat: a second tab on one model, Open in new tab and Open beside (multi-tab L6)` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-08 — ticket: the Console reads the dock tab id as a model id` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-08 — merge: alfonso-frontend-jjtl into multi-tab-l6 (P-2026-11-08-1156)` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-08 — merge: multi-tab-l6 into alfonso-frontend-jjtl (P-2026-11-08-1247)` once (trunk).
4. `git merge --no-ff --no-commit e0997544f`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: textual-c2g-align into alfonso-frontend-jjtl (P-2026-11-08-1330)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `e0997544f` in `/Users/alfonso/jjodel-w-textc2g`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-textc2g`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 4dd7f8b2a` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only 4dd7f8b2a HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/codegen.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the textual-c2g-align merge (P-2026-11-08-1330)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-textc2g`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
