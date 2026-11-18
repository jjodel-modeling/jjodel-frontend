# Prompt: merge feat/196-l6-consolidation into staging

Prompt-ID: P-2026-11-04-1602
Chat: C-2026-11-03-1227
Request: none (rendered by lane-run, no chat URL known for C-2026-11-03-1227)
Lane: full (merge; zero conflicts measured)
Status: eseguito 2026-11-04 · lane merge · c0e1e70dc · verifica visiva passata 2026-11-04 (chat, unattended; Alfonso in the morning digest)

Worktree: `/Users/juridirocco/development/jjodel`, branch `staging`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/juridirocco/development/jjodel` on `staging`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-04-1602 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `b443faf2b`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `feat/196-l6-consolidation` into the trunk with one merge commit, `--no-ff`, of the explicit sha `e7eacab7f`, in the shape of `7816c57ec` (the last merge commit on `staging`; read its body first). Merge base `b443faf2b`. The branch carries, on top of the base, 11 commits:

- `e7eacab7f` docs: #196 L6 closure, log entry and Status of three lanes (P-2026-11-03-1447)
- `cb0d2d77c` docs: CODEBASE-MAP §19.6 AI layer, #196 L6 (P-2026-11-03-1447)
- `f0764c4f1` docs: CLAUDE.md §16 for src/services/ai, #196 L6 (P-2026-11-03-1447)
- `f4e22ae97` docs: add prompt P-2026-11-03-1447, lane 3/3 of chain-P-2026-11-03-1445
- `3fe99ffc3` docs(changelog): AI runtime names unregistered, src/services/ai (P-2026-11-03-1446)
- `8fa7e2f87` refactor(ai): types moved, types/jodie.ts deleted, #196 L6 lane 2 (P-2026-11-03-1446)
- `f2beb5798` docs: add prompt P-2026-11-03-1446, lane 2/3 of chain-P-2026-11-03-1445
- `5865308ef` refactor(ai): readers off types/jodie.ts, bridge gone, #196 L6 lane 1 (P-2026-11-03-1445)
- `e658131be` refactor(ai): provider GUI table in providerVisuals.ts, #196 L6 lane 1 (P-2026-11-03-1445)
- `30f933e5b` docs: add prompt P-2026-11-03-1445, lane 1/3 of chain-P-2026-11-03-1445
- `77a703400` docs: R-AI-22..23, L4 merged now and the shape of #196 L6

The trunk carries, since the base, 0 commits:

- none

Measured by `lane-run merge` at 2026-11-04 16:02, trunk at `b443faf2b`:

- `git merge-tree --write-tree --name-only staging e7eacab7f`: zero conflicts.
- Files changed since the base: 39 on the branch side, 0 on the trunk side; on both sides: none.
- `git diff --name-only b443faf2b e7eacab7f -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: `AGENTS.md`, `CLAUDE.md`.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-03_1445_prompt_196_l6_runtime_readers.md` (eseguito 2026-11-03 · lane feat/196-l6-consolidation · 5865308ef), `claude_2026-11-03_1446_prompt_196_l6_types_and_deletion.md` (eseguito 2026-11-04 · lane feat/196-l6-consolidation · 3fe99ffc3), `claude_2026-11-03_1447_prompt_196_l6_docs_and_closure.md` (eseguito 2026-11-04 · lane feat/196-l6-consolidation · cb0d2d77c).
- `git worktree list`: `feat/196-l6-consolidation` in `/Users/juridirocco/development/jjodel-196-l6`; `staging` in `/Users/juridirocco/development/jjodel`.

**Findings.** governance files changed on the branch: `AGENTS.md`, `CLAUDE.md`; launch allowed by Alfonso's yes (`--governance-goahead`, 2026-11-04 16:02)

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `e7eacab7f` is the tip of `feat/196-l6-consolidation`; the prompt files of the branch read `Status: eseguito` at `e7eacab7f`; `git worktree list` shows `feat/196-l6-consolidation` only in `/Users/juridirocco/development/jjodel-196-l6`.
2. Measure again. `git merge-tree --write-tree --name-only staging e7eacab7f` (measured above: zero conflicts). `git diff --name-only b443faf2b e7eacab7f -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only b443faf2b staging` with `git diff --name-only b443faf2b e7eacab7f` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-AI-22` (branch), `R-AI-23` (branch); control: `- **R-AI-24**` none.
   - `docs/log-inbox/196-ai-refactor.md`: the heading `## 2026-11-04 — refactor: #196 L6, types/jodie.ts gone, AI layer consolidated in src/services/ai (P-2026-11-03-1445, P-2026-11-03-1446, P-2026-11-03-1447)` once (branch).
4. `git merge --no-ff --no-commit e7eacab7f`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: feat/196-l6-consolidation into staging (P-2026-11-04-1602)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `e7eacab7f` in `/Users/juridirocco/development/jjodel-196-l6`, read-only, `node /Users/juridirocco/development/jjodel/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/juridirocco/development/jjodel-196-l6`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard b443faf2b` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only b443faf2b HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/juridirocco/development/jjodel` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/196-ai-refactor.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the feat/196-l6-consolidation merge (P-2026-11-04-1602)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/juridirocco/development/jjodel-196-l6`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
