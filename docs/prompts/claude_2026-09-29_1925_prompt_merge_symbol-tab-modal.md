# Prompt: merge symbol-tab-modal into alfonso-frontend-jjtl

Prompt-ID: P-2026-09-29-1925
Chat: C-2026-09-29-1826
Lane: full (merge; 1 conflict: `docs/log-inbox/symbol-editor.md` measured)
Status: eseguito 2026-09-29 · lane merge · f7c5fd910 · verifica visiva passata 2026-09-29 (Code under frontend/src on the trunk equals the branch tip a4d9c7ab3 (merge conflict only in docs/log-inbox); visual checks a-e and all rail tab bars passed on the branch with Playwright probes on :3002 (P-2026-09-29-1826); gates green on the merge)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-09-29-1925 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `70b580af4`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `symbol-tab-modal` into the trunk with one merge commit, `--no-ff`, of the explicit sha `a4d9c7ab3`, in the shape of `7b5c807b8` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `7b5c807b8`. The branch carries, on top of the base, 7 commits:

- `a4d9c7ab3` docs: closure of the symbol tab lane, entry, ticket and Status (P-2026-09-29-1826)
- `6e606fa3d` fix(editors): rail tab padding 10px -> 8px so the vertex bar fits (P-2026-09-29-1826)
- `25d350167` fix(authoring): Symbol tab icon takes the label colour (P-2026-09-29-1826)
- `90e41df6a` feat(authoring): relabel Form tab as Layout (P-2026-09-29-1826)
- `f8bd58ae0` feat(authoring): open Symbol Editor directly from the Symbol tab (P-2026-09-29-1826)
- `8ca549c5d` docs: discovery for the Symbol tab opening the modal (P-2026-09-29-1826)
- `d1e435da4` docs: add prompt P-2026-09-29-1826, symbol tab opens modal

The trunk carries, since the base, 2 commits:

- `70b580af4` docs: Status flip and log entry for the sim-random-disc merge (P-2026-09-29-1832)
- `e44b1bbfc` docs: Status flip and log entry for the label-outside-pos merge (P-2026-09-29-1827)

Measured by `lane-run merge` at 2026-09-29 19:25, trunk at `70b580af4`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl a4d9c7ab3`: 1 conflict: `docs/log-inbox/symbol-editor.md`.
- Files changed since the base: 7 on the branch side, 4 on the trunk side; on both sides: `docs/log-inbox/symbol-editor.md`.
- `git diff --name-only 7b5c807b8 a4d9c7ab3 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-09-29_1826_prompt_symbol_tab_opens_modal.md` (eseguito 2026-09-29 · lane symbol-tab-modal · f8bd58ae0, 90e41df6a, 25d350167, 6e606fa3d · verifica visiva passata 2026-09-29 (lane Playwright probes on :3002, checks a-e and every rail tab bar; crops in frontend/scripts/smoke/_tmp_symtab/, gitignored) · non fuso).
- `git worktree list`: `symbol-tab-modal` in `/Users/alfonso/jjodel-w-symbol-tab`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-09-29-1925/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `a4d9c7ab3` is the tip of `symbol-tab-modal`; the prompt files of the branch read `Status: eseguito` at `a4d9c7ab3`; `git worktree list` shows `symbol-tab-modal` only in `/Users/alfonso/jjodel-w-symbol-tab`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl a4d9c7ab3` (measured above: 1 conflict: `docs/log-inbox/symbol-editor.md`). `git diff --name-only 7b5c807b8 a4d9c7ab3 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 7b5c807b8 alfonso-frontend-jjtl` with `git diff --name-only 7b5c807b8 a4d9c7ab3` (measured above: `docs/log-inbox/symbol-editor.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/symbol-editor.md`: the heading `## 2026-09-29 — ticket: Symbol Editor Border swatch paints black for a CSS-variable colour` once (branch).
   - `docs/log-inbox/symbol-editor.md`: the heading `## 2026-09-29 — feat(authoring): the Symbol tab opens the Symbol Editor, Form becomes Layout (P-2026-09-29-1826)` once (branch).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-29 — merge: sim-random-disc into alfonso-frontend-jjtl (P-2026-09-29-1832)` once (trunk).
   - `docs/log-inbox/symbol-editor.md`: the heading `## 2026-09-29 — merge: label-outside-pos into alfonso-frontend-jjtl (P-2026-09-29-1827)` once (trunk).
4. `git merge --no-ff --no-commit a4d9c7ab3`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: symbol-tab-modal into alfonso-frontend-jjtl (P-2026-09-29-1925)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `a4d9c7ab3` in `/Users/alfonso/jjodel-w-symbol-tab`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 70b580af4` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/symbol-editor.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the symbol-tab-modal merge (P-2026-09-29-1925)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-symbol-tab`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
