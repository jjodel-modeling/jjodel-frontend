# Prompt: merge open-viewport-empty into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-02-2112
Chat: C-2026-11-01-1434
Request: https://claude.ai/code/session_01DQt9R32KVprpjZZCfe6Sbp (merge of open-viewport-empty launched by chat C-2026-11-01-1434)
Lane: full (merge; 1 conflict: `docs/log-inbox/maintenance.md` measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-02-2112 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `1445849c7`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `open-viewport-empty` into the trunk with one merge commit, `--no-ff`, of the explicit sha `b319e15a2`, in the shape of `1a5e905b0` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `e5e60dca4`. The branch carries, on top of the base, 8 commits:

- `b319e15a2` docs: Status flip and log entry, open-viewport-empty took the trunk (P-2026-11-02-2028)
- `91033dfc9` merge: open-viewport-empty takes alfonso-frontend-jjtl (P-2026-11-02-2028)
- `d9acb9517` docs: add prompt P-2026-11-02-2028, merge alfonso-frontend-jjtl into open-viewport-empty
- `fe6d90b75` docs: close ticket #419, open viewport fix verified (P-2026-11-02-1856)
- `55e4d2703` fix(editor-v2): an open fit that frames no node pans onto one (P-2026-11-02-1856)
- `7d461c88c` docs: add prompt P-2026-11-02-1856, open viewport fix (ticket #419)
- `f6c512960` docs: discovery, open viewport on an empty area (P-2026-11-02-0646)
- `246edb1bc` docs: add prompt P-2026-11-02-0646, empty viewport at model open (ticket #419)

The trunk carries, since the base, 12 commits:

- `1445849c7` docs: tickets from the Q4 probe and A2 (P-2026-11-02-2021, P-2026-11-02-2024)
- `1a5e905b0` merge: textual-path-feature into alfonso-frontend-jjtl (P-2026-11-02-2057)
- `0cc672ff6` docs: add prompt P-2026-11-02-2057, merge textual-path-feature into alfonso-frontend-jjtl
- `43350d3cd` merge: jjscript-rename-expression into alfonso-frontend-jjtl (P-2026-11-02-2045)
- `07c916402` docs: add prompt P-2026-11-02-2045, merge jjscript-rename-expression into alfonso-frontend-jjtl
- `65e0acc62` docs: R-FA-9, JjScript rename takes an expression (P-2026-11-02-2030)
- `c5c9b3b32` docs: Status flip and log entry for rename to an expression (P-2026-11-02-2030)
- `62522c9bf` feat(jjscript): rename to a JjEL expression (P-2026-11-02-2030)
- `5edc759e0` docs: Status flip and log entry for text paths on feature keywords (P-2026-11-02-2029)
- `fb25f816a` feat(codegen): text paths follow feature keywords (P-2026-11-02-2029)
- `bd161d1a9` docs: discovery for JjScript rename to an expression (P-2026-11-02-2030)
- `4d1d32b8b` docs: R-TXT-29 and prompt P-2026-11-02-2029, paths follow feature keywords

Measured by `lane-run merge` at 2026-11-02 21:12, trunk at `1445849c7`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl b319e15a2`: 1 conflict: `docs/log-inbox/maintenance.md`.
- Files changed since the base: 9 on the branch side, 20 on the trunk side; on both sides: `docs/log-inbox/maintenance.md`.
- `git diff --name-only e5e60dca4 b319e15a2 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-02_0646_prompt_open_viewport_empty.md` (eseguito 2026-11-02 · lane open-viewport-empty · 55e4d2703 · verifica visiva passata 2026-11-02), `claude_2026-11-02_1856_prompt_open_viewport_fix.md` (eseguito 2026-11-02 · lane open-viewport-empty · 55e4d2703 · verifica visiva passata 2026-11-02), `claude_2026-11-02_2028_prompt_open-viewport-empty_take_trunk.md` (eseguito 2026-11-02 · lane open-viewport-empty · 91033dfc9 · verifica visiva passata 2026-11-02 (chat, unattended; Alfonso in the morning digest)).
- `git worktree list`: `open-viewport-empty` in `/Users/alfonso/jjodel-w-openvp`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `b319e15a2` is the tip of `open-viewport-empty`; the prompt files of the branch read `Status: eseguito` at `b319e15a2`; `git worktree list` shows `open-viewport-empty` only in `/Users/alfonso/jjodel-w-openvp`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl b319e15a2` (measured above: 1 conflict: `docs/log-inbox/maintenance.md`). `git diff --name-only e5e60dca4 b319e15a2 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only e5e60dca4 alfonso-frontend-jjtl` with `git diff --name-only e5e60dca4 b319e15a2` (measured above: `docs/log-inbox/maintenance.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-TXT-29` (trunk); control: `- **R-TXT-30**` none.
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-11-02 — fix(editor-v2): an open fit that frames no node pans onto one (P-2026-11-02-1856)` once (branch).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-11-02 — merge: open-viewport-empty takes alfonso-frontend-jjtl (P-2026-11-02-2028)` once (branch).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-02 — feat(codegen): text paths follow feature keywords (P-2026-11-02-2029)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-02 — ticket: Model dependencies: silent loss on delete, cycles and self-dependency accepted` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-02 — ticket: Undo after a JjTL run does nothing` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-11-02 — feat(jjscript): rename to a JjEL expression (P-2026-11-02-2030)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-11-02 — ticket: forall rename of same-named elements fails as ambiguous` once (trunk).
4. `git merge --no-ff --no-commit b319e15a2`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: open-viewport-empty into alfonso-frontend-jjtl (P-2026-11-02-2112)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `b319e15a2` in `/Users/alfonso/jjodel-w-openvp`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-openvp`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 1445849c7` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only 1445849c7 HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/maintenance.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the open-viewport-empty merge (P-2026-11-02-2112)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-openvp`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
