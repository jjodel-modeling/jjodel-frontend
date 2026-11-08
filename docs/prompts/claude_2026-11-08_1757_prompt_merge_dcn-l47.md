# Prompt: merge dcn-l47 into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-08-1757
Chat: C-2026-11-06-2159
Request: https://claude.ai/code/session_01DQt9R4H8ma8MFTYqMZbPso (merge of dcn-l47 launched by chat C-2026-11-06-2159)
Lane: full (merge; zero conflicts measured)
Status: eseguito 2026-11-08 · lane merge · 4a75388f7 · verifica visiva passata 2026-11-08 (chat, unattended; Alfonso in the morning digest)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-08-1757 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `2274a79e7`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `dcn-l47` into the trunk with one merge commit, `--no-ff`, of the explicit sha `04d739dd4`, in the shape of `cc06d9f6d` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `4c51808e8`. The branch carries, on top of the base, 15 commits:

- `04d739dd4` docs(dcn): L4.7 closure, visual check passed (P-2026-11-08-1652)
- `722a38972` docs(dcn): L4.7 log entry and Status (P-2026-11-08-1652)
- `11f6f1c0b` test(dcn): run probe checks no defects line, initial state (P-2026-11-08-1652)
- `de1ff2fb8` test(dcn): drone fixture fills every empty slot (P-2026-11-08-1652)
- `149b2cdcf` docs(dcn): prompt P-2026-11-08-1652
- `956990177` docs(dcn): L4.6 closure, visual check passed (P-2026-11-08-1606)
- `f3e6028b5` docs(dcn): Status of the L4.6 prompt (P-2026-11-08-1606)
- `a08a63ede` docs(dcn): log entry of the L4.6 panel polish (P-2026-11-08-1606)
- `4bf647cf4` test(dcn): probe reads Tick, takeOff off in Charging, on in Ready (P-2026-11-08-1606)
- `4a7b147c6` fix(dcn): the arguments of an invocation reach its body (P-2026-11-08-1606)
- `040f431ee` fix(dcn): the classification title lists a multi-valued link (P-2026-11-08-1606)
- `69d4a4da7` feat(dcn): an input is on only when admissible (P-2026-11-08-1606)
- `fe041980c` fix(dcn): the last step says the input label once (P-2026-11-08-1606)
- `1af6fc775` fix(dcn): the Tick input reads Tick in the panel (P-2026-11-08-1606)
- `d8c4665dd` docs(dcn): prompt P-2026-11-08-1606

The trunk carries, since the base, 4 commits:

- `2274a79e7` docs: ticket blocks from the multi-tab chat (P-2026-11-08-1247, P-2026-11-08-1003)
- `266ebb690` docs: checkpoint update, afternoon round of the codegen front (C-2026-11-03-1037)
- `2df3c9a32` docs(dcn): R-DCN-25..28, slice 5 rendering, snapshot and coherence watches
- `f081ad4f2` docs: R-MT-26 order of the remaining multi-tab work, R-MT-23 amended, prompt P-2026-11-08-1608 (L6b)

Measured by `lane-run merge` at 2026-11-08 17:57, trunk at `2274a79e7`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 04d739dd4`: zero conflicts.
- Files changed since the base: 14 on the branch side, 5 on the trunk side; on both sides: none.
- `git diff --name-only 4c51808e8 04d739dd4 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-08_1606_prompt_dcn_l46_panel_polish.md` (eseguito 2026-11-08 · lane full · 4bf647cf4 · verifica visiva passata 2026-11-08), `claude_2026-11-08_1652_prompt_dcn_l47_drone_data.md` (eseguito 2026-11-08 · lane full · 11f6f1c0b · verifica visiva passata 2026-11-08).
- `git worktree list`: `dcn-l47` in `/Users/alfonso/jjodel-w-dcn-l47`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `04d739dd4` is the tip of `dcn-l47`; the prompt files of the branch read `Status: eseguito` at `04d739dd4`; `git worktree list` shows `dcn-l47` only in `/Users/alfonso/jjodel-w-dcn-l47`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 04d739dd4` (measured above: zero conflicts). `git diff --name-only 4c51808e8 04d739dd4 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 4c51808e8 alfonso-frontend-jjtl` with `git diff --name-only 4c51808e8 04d739dd4` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-DCN-25` (trunk), `R-DCN-26` (trunk), `R-DCN-27` (trunk), `R-DCN-28` (trunk), `R-MT-26` (trunk); control: `- **R-MT-27**` none.
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-08 — fix: DCN Simulation panel polish, findings of the L4.5 visual check (P-2026-11-08-1606)` once (branch).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-08 — test: DCN drone fixture fills the empty slots, exports regenerated (P-2026-11-08-1652)` once (branch).
   - `docs/log-inbox/harness.md`: the heading `## 2026-11-08 — ticket: lane-run merge template: rollback reset names the commit before the prompt commit` once (trunk).
   - `docs/log-inbox/jjodie-ui.md`: the heading `## 2026-11-08 — ticket: Refactoring finds no M1 target on the multi-tab demo project` once (trunk).
4. `git merge --no-ff --no-commit 04d739dd4`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: dcn-l47 into alfonso-frontend-jjtl (P-2026-11-08-1757)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `04d739dd4` in `/Users/alfonso/jjodel-w-dcn-l47`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-dcn-l47`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 2274a79e7` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only 2274a79e7 HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/dcn.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the dcn-l47 merge (P-2026-11-08-1757)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-dcn-l47`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
