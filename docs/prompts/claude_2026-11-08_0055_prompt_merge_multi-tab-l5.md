# Prompt: merge multi-tab-l5 into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-08-0055
Chat: C-2026-11-07-0425
Request: https://claude.ai/code/session_01DQt9R2jWxTfKXT19Kf4HUW (Alfonso 2026-11-07 18:58 ok on the L5 crops, 2026-11-08 00:03 go to merge)
Lane: full (merge; zero conflicts measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-08-0055 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `23b47e83c`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `multi-tab-l5` into the trunk with one merge commit, `--no-ff`, of the explicit sha `5bcafa843`, in the shape of `23b47e83c` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `5c15e491e`. The branch carries, on top of the base, 8 commits:

- `5bcafa843` docs: Status flip and log entry, multi-tab-l5 took the trunk (P-2026-11-08-0012)
- `f2b5d1934` merge: multi-tab-l5 takes alfonso-frontend-jjtl (P-2026-11-08-0012)
- `ddf8631ef` docs: add prompt P-2026-11-08-0012, merge alfonso-frontend-jjtl into multi-tab-l5
- `73e6441fd` docs: multi-tab L5 app check, log entry and Status (P-2026-11-07-1730)
- `3bb82e75e` docs: prompt P-2026-11-07-1730, multi-tab L5 check and closure
- `f2ddead3d` feat(editor-v2): IR resolution follows the tab's viewpoint (P-2026-11-07-1516)
- `7b3cf6d2a` test(editor-v2): IR resolution by the tab's viewpoint, red (P-2026-11-07-1516)
- `a87146a64` docs: Layer Impact Report for multi-tab L5, IR resolution by tab (P-2026-11-07-1516)

The trunk carries, since the base, 7 commits:

- `23b47e83c` merge: dcn-conf into alfonso-frontend-jjtl (P-2026-11-08-0040)
- `106fbc1a5` docs: add prompt P-2026-11-08-0040, merge dcn-conf into alfonso-frontend-jjtl
- `577368897` docs(dcn): log entry and Status of P-2026-11-08-0010 (P-2026-11-08-0010)
- `9e5452556` fix(dcn): DCN bodies in DCN action mode; W1 names association ends (P-2026-11-08-0010)
- `819c700b5` docs: checkpoint update, textual steps D, E, F (C-2026-11-03-1037)
- `8e57a1aef` docs: Status flip and log entry for the textual-d3c-rules merge (P-2026-11-08-0004)
- `e7a12d229` docs(dcn): prompt P-2026-11-08-0010

Measured by `lane-run merge` at 2026-11-08 00:55, trunk at `23b47e83c`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 5bcafa843`: zero conflicts.
- Files changed since the base: 16 on the branch side, 11 on the trunk side; on both sides: none.
- `git diff --name-only 5c15e491e 5bcafa843 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-07_1730_prompt_multi_tab_l5_check.md` (eseguito 2026-11-07 · lane full · no source change · build exit 0 · demo two tabs 18/18 and 25/25 nodes, own colours, x3 · L3 pair 6/6 (was 6/10) · single tab 3/3 every step x3, container 0 failures, 0457 scenes unchanged · Symbol Editor: no node-side opener, contract by dispatch · LIR §7 · hard-stop: visual check due · non fuso), `claude_2026-11-08_0012_prompt_multi-tab-l5_take_trunk.md` (eseguito 2026-11-08 · lane multi-tab-l5 · f2b5d1934 · verifica visiva passata 2026-11-08 (chat, unattended; Alfonso in the morning digest)).
- `git worktree list`: `multi-tab-l5` in `/Users/alfonso/jjodel-w-mtl5`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `5bcafa843` is the tip of `multi-tab-l5`; the prompt files of the branch read `Status: eseguito` at `5bcafa843`; `git worktree list` shows `multi-tab-l5` only in `/Users/alfonso/jjodel-w-mtl5`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 5bcafa843` (measured above: zero conflicts). `git diff --name-only 5c15e491e 5bcafa843 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 5c15e491e alfonso-frontend-jjtl` with `git diff --name-only 5c15e491e 5bcafa843` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-07 — feat: IR resolution follows the tab's viewpoint (multi-tab L5)` once (branch).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-07 — ticket: publishedChannelSlots is one module-level list for every IR canvas` once (branch).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-08 — merge: alfonso-frontend-jjtl into multi-tab-l5 (P-2026-11-08-0012)` once (branch).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — merge: textual-d3c-rules into alfonso-frontend-jjtl (P-2026-11-08-0004)` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-08 — fix: conformance parses DCN bodies in DCN mode; W1 names association-owned ends` once (trunk).
4. `git merge --no-ff --no-commit 5bcafa843`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: multi-tab-l5 into alfonso-frontend-jjtl (P-2026-11-08-0055)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `5bcafa843` in `/Users/alfonso/jjodel-w-mtl5`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-mtl5`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 23b47e83c` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only 23b47e83c HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/multi-tab.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the multi-tab-l5 merge (P-2026-11-08-0055)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-mtl5`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
