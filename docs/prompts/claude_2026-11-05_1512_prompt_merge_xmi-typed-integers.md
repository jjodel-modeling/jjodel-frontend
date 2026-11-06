# Prompt: merge xmi-typed-integers into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-05-1512
Chat: C-2026-11-03-1202
Request: https://claude.ai/code/session_01DQt9R5EJe1reXq5Xut2Jif (merge of xmi-typed-integers launched by chat C-2026-11-03-1202)
Lane: full (merge; zero conflicts measured)
Status: eseguito 2026-11-05 · lane merge · 450864a4b · verifica visiva passata 2026-11-05 (#607 verified on the branch by the app probes of P-2026-11-05-1446: rv_mc4 and rv_pf4 byte-equal to the references)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-05-1512 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `d95d5b9ca`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `xmi-typed-integers` into the trunk with one merge commit, `--no-ff`, of the explicit sha `f1a3911d0`, in the shape of `6b98a59de` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `d95d5b9ca`. The branch carries, on top of the base, 4 commits:

- `f1a3911d0` docs: R-XMI-1, ticket and log entry for the XMI typed values (P-2026-11-05-1446)
- `31831a082` docs: XMI typed integers discovery, app and node measures (P-2026-11-05-1446)
- `36e67e7da` fix(xmi): type imported attribute values by the metamodel (#607) (P-2026-11-05-1446)
- `782262393` docs: add prompt P-2026-11-05-1446, XMI import typed integers (#607)

The trunk carries, since the base, 0 commits:

- none

Measured by `lane-run merge` at 2026-11-05 15:12, trunk at `d95d5b9ca`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl f1a3911d0`: zero conflicts.
- Files changed since the base: 6 on the branch side, 0 on the trunk side; on both sides: none.
- `git diff --name-only d95d5b9ca f1a3911d0 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-05_1446_prompt_xmi_typed_integers.md` (eseguito 2026-11-05 · lane full · 36e67e7da · fix #607, discovery, ticket R-FA-11 scope).
- `git worktree list`: `xmi-typed-integers` in `/Users/alfonso/jjodel-w-xmiints`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-11-05-1512/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `f1a3911d0` is the tip of `xmi-typed-integers`; the prompt files of the branch read `Status: eseguito` at `f1a3911d0`; `git worktree list` shows `xmi-typed-integers` only in `/Users/alfonso/jjodel-w-xmiints`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl f1a3911d0` (measured above: zero conflicts). `git diff --name-only d95d5b9ca f1a3911d0 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only d95d5b9ca alfonso-frontend-jjtl` with `git diff --name-only d95d5b9ca f1a3911d0` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-XMI-1` (branch); control: `- **R-XMI-2**` none.
   - `docs/decisions.md`: the heading `## R-XMI: attribute values of the XMI M1 import (decisions 2026-11-05)` once (branch).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-05 — ticket: JjTL: a JjEL method unknown for the value's type warns instead of R-FA-11's error` once (branch).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-05 — fix(xmi): attribute values typed by the metamodel (P-2026-11-05-1446)` once (branch).
4. `git merge --no-ff --no-commit f1a3911d0`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: xmi-typed-integers into alfonso-frontend-jjtl (P-2026-11-05-1512)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `f1a3911d0` in `/Users/alfonso/jjodel-w-xmiints`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-xmiints`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard d95d5b9ca` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only d95d5b9ca HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/hw-notation.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the xmi-typed-integers merge (P-2026-11-05-1512)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-xmiints`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
