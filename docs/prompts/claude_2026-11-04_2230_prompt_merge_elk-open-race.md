# Prompt: merge elk-open-race into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-04-2230
Chat: C-2026-11-03-2317
Request: https://claude.ai/code/session_01DQt9R6hbytx4vz5aAdzQ8i (merge of elk-open-race launched by chat C-2026-11-03-2317)
Lane: full (merge; zero conflicts measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-04-2230 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `091e62bac`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `elk-open-race` into the trunk with one merge commit, `--no-ff`, of the explicit sha `a49e829fe`, in the shape of `091e62bac` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `091e62bac`. The branch carries, on top of the base, 12 commits:

- `a49e829fe` docs: Status flip and log entry, elk-open-race took the trunk (P-2026-11-04-2204)
- `9ef2eeab5` merge: elk-open-race takes alfonso-frontend-jjtl (P-2026-11-04-2204)
- `d0fac4902` docs: add prompt P-2026-11-04-2204, merge alfonso-frontend-jjtl into elk-open-race
- `db35bbe5f` docs: Status flip and log entry, production figure of the settled view (P-2026-11-04-2131)
- `4eddada43` docs: add prompt P-2026-11-04-2131, production figure of the settled view
- `0fa85f830` docs: Status flips and log entry, ELK open race closed (P-2026-11-04-1616)
- `6bf758834` docs: add prompt P-2026-11-04-1616, close the ELK open race
- `2b3ca5dc0` fix(editor-v2): open settle also waits for every object to have a vertex (P-2026-11-04-1500)
- `470719b0d` fix(editor-v2): open-time callback waits for the open to settle (P-2026-11-04-1500)
- `e78ebdffd` docs: Layer Impact Report, the open-time ELK race in useJjomSync (P-2026-11-04-1500)
- `385f25a9d` docs: add prompt P-2026-11-04-1500, ELK open race continued
- `ffa99aa32` docs: add prompt P-2026-11-04-1444, remove the ELK open race

The trunk carries, since the base, 0 commits:

- none

Measured by `lane-run merge` at 2026-11-04 22:30, trunk at `091e62bac`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl a49e829fe`: zero conflicts.
- Files changed since the base: 9 on the branch side, 0 on the trunk side; on both sides: none.
- `git diff --name-only 091e62bac a49e829fe -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-04_1444_prompt_elk_open_race.md` (eseguito 2026-11-04 · lane elk-open-race · commits 470719b0d, 2b3ca5dc0 · continued by P-2026-11-04-1500 and P-2026-11-04-1616 · app probes, no hand run), `claude_2026-11-04_1500_prompt_elk_open_race_cont.md` (eseguito 2026-11-04 · lane elk-open-race · commits 470719b0d, 2b3ca5dc0 · open-time layout once the open settles, 10 s deadline · closed by P-2026-11-04-1616 · app probes, no hand run), `claude_2026-11-04_1616_prompt_elk_open_race_close.md` (eseguito 2026-11-04 · lane fast · no code change · b10_8 x7 (3 under load 15): 0 ELK, undo 0->1, fit on 2,559 of 2,559 nodes, same view 7/7 · gallery 17 diagrams unchanged), `claude_2026-11-04_2131_prompt_elk_race_prod.md` (eseguito 2026-11-04 · lane fast · no code change · production b10_8 x5 (all under load 15 at start): settled view stable 5/5: zoom 0.5, 21 on screen, RF holding 2,559 of 2,559 at the fit), `claude_2026-11-04_2204_prompt_elk-open-race_take_trunk.md` (eseguito 2026-11-04 · lane elk-open-race · 9ef2eeab5 · verifica visiva passata 2026-11-04 (chat, unattended; Alfonso in the morning digest)).
- `git worktree list`: `elk-open-race` in `/Users/alfonso/jjodel-w-elkrace`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-11-04-2230/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `a49e829fe` is the tip of `elk-open-race`; the prompt files of the branch read `Status: eseguito` at `a49e829fe`; `git worktree list` shows `elk-open-race` only in `/Users/alfonso/jjodel-w-elkrace`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl a49e829fe` (measured above: zero conflicts). `git diff --name-only 091e62bac a49e829fe -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 091e62bac alfonso-frontend-jjtl` with `git diff --name-only 091e62bac a49e829fe` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-04 — fix(editor-v2): open-time ELK layout waits for the open to settle (P-2026-11-04-1444, P-2026-11-04-1500, P-2026-11-04-1616)` once (branch).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-04 — measure: production b10_8 figure of the settled view after the ELK open race fix (P-2026-11-04-2131)` once (branch).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-04 — merge: elk-open-race takes alfonso-frontend-jjtl (P-2026-11-04-2204)` once (branch).
4. `git merge --no-ff --no-commit a49e829fe`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: elk-open-race into alfonso-frontend-jjtl (P-2026-11-04-2230)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `a49e829fe` in `/Users/alfonso/jjodel-w-elkrace`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-elkrace`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 091e62bac` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only 091e62bac HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/hw-notation.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the elk-open-race merge (P-2026-11-04-2230)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-elkrace`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
