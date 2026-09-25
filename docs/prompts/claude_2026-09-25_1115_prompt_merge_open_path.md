# Prompt: merge the project open path into the trunk

Prompt-ID: P-2026-09-25-1115
Chat: C-2026-09-25-1030
Lane: full (more than 3 files)
Status: da eseguire
Worktree: `~/jjodel-release`, branch `alfonso-frontend-jjtl`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop and say so. This lane reads `~/jjodel-open` (branch `open-path`) and does not write there. Do not touch `~/jjodel`, `~/jjodel-sim` (a step 3b discovery may be running there), `~/jjodel-gate` (the `harness-bypass` lane of `P-2026-09-25-1022` lives there, closed and not merged), or `~/jjodel-harness`.

Single phase, with hard stops. This is a merge, not a feature: no source file is edited by hand. The one hand resolution allowed is the inbox file named in COME step 3.

## COSA

Bring the open-path lane (`P-2026-09-25-0030`) into the trunk with one merge commit, `--no-ff`, in the shape of `2aecc1429`, `2dd17270b` and `94a72edba` (read the three bodies first and mirror them). Merge the explicit sha `bd8a29bb9`, not the branch name. It carries: Phase 1 report `d6918f467`, code `0609e9793` (a project that cannot be opened shows an error screen; one catch in `stateInitializer`, synchronous LOAD, save guard for a failed open, `PROJECT_OPEN_CHANGED`), closure `80599fb0f` (log entry, two tickets, report addendum A1-A5), Status `bd8a29bb9` (visual check passed 2026-09-25).

Why now: the lane closes a data loss (an in-page open that fails lets a save overwrite the stored project, measured 19 `idlookup` entries to 7), and the branch is a side lane that nothing else builds on.

## DOVE

The merge commit and one Status commit on `alfonso-frontend-jjtl` in `~/jjodel-release`. Measured from chat at 2026-09-25 11:10: merge base `2dd17270b`; the branch changes 10 files (7 code under `frontend/src/`: `redux/reducer/reducer.ts`, `components/topbar/SaveManager.ts`, `components/topbar/__tests__/saveManager_load.test.ts` new, `api/persistance/projects.ts`, `pages/Project.tsx`, `components/LoadingScreen/ProjectLoadingScreen.tsx`, `events/registry.ts`; 3 docs: the report, the prompt, `docs/log-inbox/versionfixer.md`); the trunk changed 26 files since the base; **one file on both sides, `docs/log-inbox/versionfixer.md`, and `git merge-tree` reports a content conflict there**. Cause: the trunk folded that inbox into the log in `dee18d69b` (the 1610 entry now lives in `docs/claude-code-log.md`, the inbox holds only its header), while the branch appended three entries to the unfolded file. Re-measure everything; do not inherit these claims.

## COME

1. Preconditions, each a hard stop if false: `git status` empty in `~/jjodel-release` and in `~/jjodel-open`; `bd8a29bb9` is the tip of `open-path`; its prompt Status reads `eseguito 2026-09-25 · lane open-path · 0609e9793 · verifica visiva passata 2026-09-25`; `git worktree list` shows `alfonso-frontend-jjtl` only in `~/jjodel-release`. If `harness-bypass` (or anything else) has been merged into the trunk since `afaea8756`, say so and re-measure step 2 against the new tip.
2. Re-measure both sides from the merge base, file by file, and run `git merge-tree --write-tree --name-only alfonso-frontend-jjtl bd8a29bb9`. The only conflict allowed is `docs/log-inbox/versionfixer.md`. Any other file on both sides or any other conflict: stop and report before merging. Confirm with `git diff --name-only 2dd17270b bd8a29bb9 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md` that the branch changes no normative file (P15); if it does, stop.
3. `git merge --no-ff bd8a29bb9`. Resolve `docs/log-inbox/versionfixer.md` as: the trunk's version (header only) followed, verbatim and in the branch's order, by the three entries the branch added (`git diff 2dd17270b bd8a29bb9 -- docs/log-inbox/versionfixer.md`): the `fix(redux)` entry of `P-2026-09-25-0030` and the two `ticket` entries (in-page hash change, `pointedBy`). The 1610 entry must not come back: it is already in the log. Check: `grep -c '^## ' docs/log-inbox/versionfixer.md` is 3, and `grep -c 'P-2026-09-24-1610' docs/log-inbox/versionfixer.md` is 0 outside cross-references inside the three entries (report what it finds). Then `npm run check:docs` from `frontend/` before committing the merge: the inbox lint must pass on the three entries; if it rejects one, `git merge --abort`, stop, report message and line, wait. Any other conflict: `git merge --abort`, stop, report.
4. Merge subject: `merge: project open path, error screen for a project that cannot be opened (P-2026-09-25-0030)`. Body in the shape of the precedents: the shas of COSA; what the trunk gained since `2dd17270b` (the 0910 merge of simulation step 2, R-SIM-21..26, the inbox fold and log rotation `dee18d69b`, RC-16..19 and their memo, the 1022 prompt); the inbox resolution in one sentence; the probe results of step 5; `Model:` and `Co-Authored-By` trailers.
5. Semantic probes (P14), before or right after the merge commit, read-only:
   - `reducer.ts` on the trunk since the base: `git log 2dd17270b..alfonso-frontend-jjtl -- frontend/src/redux/ frontend/src/components/topbar/ frontend/src/pages/Project.tsx frontend/src/api/persistance/ frontend/src/events/` must be empty. If not, list the commits and stop.
   - `PROJECT_OPEN_CHANGED`: `command grep -rn PROJECT_OPEN_CHANGED frontend/src` on the merge commit shows only the branch's uses (positive control: `PROJECT_SAVED` in `registry.ts`).
6. Gates on the merge commit, from `frontend/`, with the P14 temporary `node_modules` symlink if needed, leaving the tree as found:
   - `npm run typecheck`: 14 errors, the `CLAUDE.md` §17 set by file and code.
   - `npm run typecheck:scripts`: exit 0.
   - `npx vitest run`: state the expected total before running. The trunk alone should give 4530 (as measured on `simulation-engine` at `dee18d69b`, a fast-forward of the trunk then, docs only since); the branch adds 3 (`saveManager_load.test.ts`): expected 4533, 0 failed, the same 9 files red at import.
   - `npm run build`: exit 0.
   - `npm run check:docs`: 4/4; report the telemetry lines (inboxes, Check D).
   - `npm run check:agents`: green.
   - `npm run check:scripts`: 0 hits expected in this tree; a hit in a tracked file is a stop.
7. **Visual regression, hard stop.** The lane changes the load path of every project. After the gates, tell Alfonso to hard-refresh `http://localhost:3001/` (the trunk's dev server; if it is not running, say so and let Alfonso start it) and check: (a) a healthy project opens from the list, unchanged; (b) a reload on the project page reopens it; (c) `http://localhost:3001/#/project?id=Pointer_NOPE` shows «This project was not found.»; (d) back to the list from that screen. Wait for his answer. On a failure, report it and stop; do not revert without instruction.
8. After Alfonso's OK, one docs commit on the trunk: this prompt's Status flipped to `eseguito 2026-09-25 · lane merge · <merge sha> · verifica visiva passata 2026-09-25`, pathspec after `--`, subject `docs: Status flip for the open path merge (P-2026-09-25-1115)`, `Model:` trailer. No log entry for the merge (precedents): the merge body is the record. The three inbox entries stay in the inbox for the next P13 fold.
9. Closing report, opening with `[P-2026-09-25-1115 · session <id>]`: merge sha, inbox resolution, probe outputs, gate numbers, visual result, and the push state without pushing (the trunk, 1 merge and 1 Status ahead of origin; `open-path` has never been on origin and stays local unless Alfonso says otherwise).

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, merging the branch name instead of the sha, squash, rebase, any commit in `~/jjodel-open`, push.

## RIFERIMENTI

- `docs/PROTOCOL.md` P13, P14, P15; `docs/decisions.md` RC-13, RC-14, RC-17.
- Merge precedents `2aecc1429`, `2dd17270b`, `94a72edba`; prompt `docs/prompts/claude_2026-09-25_0910_prompt_merge_sim_step2.md` (same shape, its probe of the inbox lint).
- On `open-path`: `docs/prompts/claude_2026-09-25_0030_prompt_project_open_path.md`, `docs/discovery/discovery_2026-09-25_project_open_path.md` (with addendum A1-A5), `docs/log-inbox/versionfixer.md`.
