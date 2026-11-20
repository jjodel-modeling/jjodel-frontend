# Prompt: merge multi-tab-readers into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-20-1630
Chat: C-2026-11-18-2337
Request: https://claude.ai/code/session_01DQt9R5BmL7gprPWEQuuqbP (merge of multi-tab-readers launched by chat C-2026-11-18-2337)
Lane: full (merge; 1 conflict: `docs/log-inbox/multi-tab.md` measured)
Status: eseguito 2026-11-20 · lane merge · 04f913cba · verifica visiva passata 2026-11-20 (chat, unattended; Alfonso in the morning digest)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-20-1630 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `d2628b041`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `multi-tab-readers` into the trunk with one merge commit, `--no-ff`, of the explicit sha `b82fbe793`, in the shape of `4d390832f` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `d29dcd79c`. The branch carries, on top of the base, 4 commits:

- `b82fbe793` docs: Status flip of P-2026-11-19-2336 after the visual GO
- `7ea61dece` docs: close lane 6, remaining active-tab readers (P-2026-11-19-2336)
- `8f6d70f46` fix(multi-tab): last children[0] readers go through the active group (P-2026-11-19-2336)
- `b22eab871` docs: add prompt P-2026-11-19-2336, remaining active-tab readers

The trunk carries, since the base, 10 commits:

- `d2628b041` docs: Status flip and log entry for the multi-tab-persistence merge (P-2026-11-20-1611)
- `4d390832f` merge: multi-tab-persistence into alfonso-frontend-jjtl (P-2026-11-20-1611)
- `5de522975` docs: add prompt P-2026-11-20-1611, merge multi-tab-persistence into alfonso-frontend-jjtl
- `d4ddede1d` docs: add prompt P-2026-11-20-1610, editor chrome parity
- `7a10ea867` docs: close P-2026-11-19-2328, editor groups persist per project
- `93eebb0f5` docs: R-MT-33, editor groups persist per user and project (P-2026-11-19-2328)
- `5099d9d14` feat(multi-tab): editor groups persist per user and project (P-2026-11-19-2328)
- `7480c672d` docs: Status flip and log entry for the multi-tab-active-group merge (P-2026-11-19-2320)
- `6ba59e56f` feat(multi-tab): editor groups record, pure (P-2026-11-19-2328)
- `101a0ad66` docs: add prompt P-2026-11-19-2328, editor groups persistence

Measured by `lane-run merge` at 2026-11-20 16:30, trunk at `d2628b041`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl b82fbe793`: 1 conflict: `docs/log-inbox/multi-tab.md`.
- Files changed since the base: 9 on the branch side, 11 on the trunk side; on both sides: `docs/log-inbox/multi-tab.md`.
- `git diff --name-only d29dcd79c b82fbe793 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-19_2336_prompt_multi-tab-readers.md` (eseguito 2026-11-20 · lane full · 8f6d70f46, 7ea61dece · verifica visiva passata 2026-11-20 16:06).
- `git worktree list`: `multi-tab-readers` in `/Users/alfonso/jjodel-w-mtread`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `b82fbe793` is the tip of `multi-tab-readers`; the prompt files of the branch read `Status: eseguito` at `b82fbe793`; `git worktree list` shows `multi-tab-readers` only in `/Users/alfonso/jjodel-w-mtread`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl b82fbe793` (measured above: 1 conflict: `docs/log-inbox/multi-tab.md`). `git diff --name-only d29dcd79c b82fbe793 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only d29dcd79c alfonso-frontend-jjtl` with `git diff --name-only d29dcd79c b82fbe793` (measured above: `docs/log-inbox/multi-tab.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-MT-33` (trunk); control: `- **R-MT-34**` none.
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-20 — fix: the last children[0] readers go through the active group (multi-tab lane 6)` once (branch).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-19 — merge: multi-tab-active-group into alfonso-frontend-jjtl (P-2026-11-19-2320)` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-20 — feat: editor groups persist per user and project (multi-tab lane 3, G7)` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-20 — ticket: G7 residues for the width lane` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-20 — merge: multi-tab-persistence into alfonso-frontend-jjtl (P-2026-11-20-1611)` once (trunk).
4. `git merge --no-ff --no-commit b82fbe793`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: multi-tab-readers into alfonso-frontend-jjtl (P-2026-11-20-1630)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `b82fbe793` in `/Users/alfonso/jjodel-w-mtread`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-mtread`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard d2628b041` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only d2628b041 HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/multi-tab.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the multi-tab-readers merge (P-2026-11-20-1630)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-mtread`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
