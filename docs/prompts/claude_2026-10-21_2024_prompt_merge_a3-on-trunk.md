# Prompt: merge a3-on-trunk into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-21-2024
Chat: —
Request: none (rendered by lane-run, no chat URL known for no --chat)
Lane: full (merge; zero conflicts measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-21-2024 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `3c3c2874c`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `a3-on-trunk` into the trunk with one merge commit, `--no-ff`, of the explicit sha `a994b7d24`, in the shape of `460d77437` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `992b457db`. The branch carries, on top of the base, 9 commits:

- `a994b7d24` docs: A3 on the trunk, closure; R-VP-60 ratified (P-2026-10-21-1925)
- `2c2a20895` docs(lir): A3 on the 2026-10-21 trunk, addendum (P-2026-10-21-1925)
- `7ae59d306` merge: elk-handles-a3 into a3-on-trunk, A3 on the trunk (P-2026-10-21-1925)
- `7ecaa5c45` docs(prompts): A3 on the current trunk (P-2026-10-21-1925)
- `5c578ba53` docs: A3 back, closure; R-VP-60 provisional, Petri loop ticket (P-2026-10-10-0915)
- `a57bd4d53` probe: A3 assertions in petri-ink-ports, the update-depth loop check (P-2026-10-10-0915)
- `dd21d2e45` revert: A3 back, handles on ELK-routed ends, R-VP-60 reinstated (P-2026-10-10-0915)
- `10f92eea9` docs(lir): A3 back, handles of an ELK-routed edge on its drawn ends (P-2026-10-10-0915)
- `c14082de9` docs: add prompt P-2026-10-10-0915

The trunk carries, since the base, 2 commits:

- `3c3c2874c` docs: S3b Phase 1 closed, R-OI-15..16, prompts P-2026-10-21-1955 and 1956
- `cefa91df0` docs(tack): ticket, stale Outcome after a resumed run dies (found by P-2026-10-20-0030)

Measured by `lane-run merge` at 2026-10-21 20:24, trunk at `3c3c2874c`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl a994b7d24`: zero conflicts.
- Files changed since the base: 12 on the branch side, 5 on the trunk side; on both sides: `docs/decisions.md`.
- `git diff --name-only 992b457db a994b7d24 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-10-10_0915_prompt_elk_handles_a3.md` (eseguito 2026-10-10 · lane elk-handles-a3 · LIR 10f92eea9 (docs/lir/lir_2026-10-10_elk_handles_a3.md), revert of 04c13e039 dd21d2e45, probe a57bd4d53 · non fuso: hard-stop · R-VP-60 reinstated provisional, awaits Alfonso · gates: typecheck 14 (the §17 set), vitest 7676 passed with the §17 nine red at import (criticalZone.test.ts green, variable unset), build exit 0 · probe petri-ink-ports on 3081 73/73 (trunk code 63/73, the 10 A3 checks red as their control): handles off the drawn end after Auto layout 33 of 68 → 2 (work->d1, 6 px), on another side 5 → 0, extra bends 0, A1 16.3:1 and A2 distances as the trunk, the four default panes identical to the trunk run · loop check on 3080: Flowchart, Activity (UML), Statechart (PEST) 60 drags and 20 edge selections each, 0 crashes, nested depth ≤ 3, DynamicHandles renders per drag 12.4, 7.9, 12.9 (trunk 12.2, 14.3, 12.7); Petri net (classic) crashes («Maximum update depth», StoreUpdater) on 5 of 5 fresh pages on the branch and on the trunk alike, 3/3 without instrumentation, 3/3 at rest (ticket) · DemoESM ten presses, events hidden: panel lines equal to the trunk's in the default viewpoint and the derived Statechart, 0 page errors, pins and handles unmoved by the run and by Stop), `claude_2026-10-21_1925_prompt_a3_refresh_on_trunk.md` (eseguito 2026-10-21 · lane a3-on-trunk · 7ae59d306 · verifica visiva passata 2026-10-21 (RC-23 by the chat on the side-by-side crops; GO of the chat)).
- `git worktree list`: `a3-on-trunk` in `/Users/alfonso/jjodel-w-a3trunk`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-10-21-2024/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `a994b7d24` is the tip of `a3-on-trunk`; the prompt files of the branch read `Status: eseguito` at `a994b7d24`; `git worktree list` shows `a3-on-trunk` only in `/Users/alfonso/jjodel-w-a3trunk`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl a994b7d24` (measured above: zero conflicts). `git diff --name-only 992b457db a994b7d24 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 992b457db alfonso-frontend-jjtl` with `git diff --name-only 992b457db a994b7d24` (measured above: `docs/decisions.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-VP-60` (branch), `R-OI-15` (trunk), `R-OI-16` (trunk); control: `- **R-OI-17**` none.
   - `docs/log-inbox/views.md`: the heading `## 2026-10-21 — merge: elk-handles-a3 onto the 2026-10-21 trunk, A3 re-measured (P-2026-10-21-1925)` once (branch).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-10 — revert(editor-v2): A3 back, handles of an ELK-routed edge on its drawn ends (P-2026-10-10-0915)` once (branch).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-10 — ticket: a Petri net (classic) derived viewpoint loops on a node drag («Maximum update depth»)` once (branch).
   - `docs/log-inbox/tack.md`: the heading `## 2026-10-21 — ticket: Tack collector shows a stale Outcome after a resumed run dies` once (trunk).
4. `git merge --no-ff --no-commit a994b7d24`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: a3-on-trunk into alfonso-frontend-jjtl (P-2026-10-21-2024)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `a994b7d24` in `/Users/alfonso/jjodel-w-a3trunk`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-a3trunk`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 3c3c2874c` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only 3c3c2874c HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/views.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the a3-on-trunk merge (P-2026-10-21-2024)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-a3trunk`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
