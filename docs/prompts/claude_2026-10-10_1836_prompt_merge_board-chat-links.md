# Prompt: merge board-chat-links into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-10-1836
Chat: —
Lane: full (merge; 1 conflict: `docs/log-inbox/harness.md` measured)
Status: eseguito 2026-10-10 · lane merge · d77cd0c4e · verifica visiva passata 2026-10-10 (chat, unattended: scripts-only (lane board), app untouched; chat links verified on 4703 under P-2026-10-10-1816)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-10-1836 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `ffd37e8af`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `board-chat-links` into the trunk with one merge commit, `--no-ff`, of the explicit sha `6ae97ac36`, in the shape of `fd59eefaa` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `3339c11ee`. The branch carries, on top of the base, 4 commits:

- `6ae97ac36` docs: Status flip for the lane board chat links lane (P-2026-10-10-1816)
- `f08ffade3` docs: log entry for the lane board chat links (P-2026-10-10-1816)
- `226fce084` feat(harness): lane board links each lane to its chat
- `963d9290a` docs(prompts): lane board chat links (P-2026-10-10-1816)

The trunk carries, since the base, 52 commits:

- `ffd37e8af` docs: Status flip and log entry for the lane-board-columns merge (P-2026-10-10-1823)
- `fd59eefaa` merge: lane-board-columns into alfonso-frontend-jjtl (P-2026-10-10-1823)
- `21d8dc2e7` docs: Status flip for the JjEL lexer own-key lane (P-2026-10-10-1756)
- `bda3f8820` docs: Status flip and log entry for the jjel-lexer-own-keys merge (P-2026-10-10-1817)
- `fe34f0936` docs: add prompt P-2026-10-10-1823, merge lane-board-columns into alfonso-frontend-jjtl
- `0d2ad8f11` merge: jjel-lexer-own-keys into alfonso-frontend-jjtl (P-2026-10-10-1817)
- `e1b6ba715` docs: Status flip and log entry for the codegen-runner merge (P-2026-10-10-1802)
- `83e055d7e` docs: add prompt P-2026-10-10-1817, merge jjel-lexer-own-keys into alfonso-frontend-jjtl
- `834152b68` merge: stale-m1-edge into alfonso-frontend-jjtl (P-2026-10-10-1809)
- `18b072088` docs: add prompt P-2026-10-10-1809, merge stale-m1-edge into alfonso-frontend-jjtl
- `bf21aa74f` docs(prompts): Status flip, P-2026-10-10-1600
- `c28297230` docs: ticket, lane-run resume cannot carry the critical-zone go-ahead
- `f02a57d59` merge: codegen-runner into alfonso-frontend-jjtl (P-2026-10-10-1802)
- `e84cf1d16` docs: Status flip and log entry for the sim-event-attrs merge (P-2026-10-10-1753)
- `857c72139` docs: add prompt P-2026-10-10-1802, merge codegen-runner into alfonso-frontend-jjtl
- `b1b1599ba` docs: log-inbox entry and JjScript ticket for the lexer own-key lane (P-2026-10-10-1756)
- `455792c69` fix(jjel): lexer looks up OCL messages and keywords by own key (P-2026-10-10-1756)
- `45ad56bd6` merge: sim-event-attrs into alfonso-frontend-jjtl (P-2026-10-10-1753)
- `6ca224b68` docs: RC-45 starts now, lane-run draws; prompts for the first drawn lane and the draw (P-2026-10-10-1756, P-2026-10-10-1757)
- `d6448ef04` docs: stale M1 edge F1 measurements, addendum, LIR 4, inbox (P-2026-10-10-1600)
- `32740c8fb` docs: add prompt P-2026-10-10-1754, merge codegen-runner into alfonso-frontend-jjtl
- `9c81e28a1` docs: Status flip and log entry for the codegen-engine merge (P-2026-10-10-1747)
- `039ed6f62` docs: Status flip for the event attributes Phase 2 (P-2026-10-10-1630)
- `3e4ff8da1` docs: add prompt P-2026-10-10-1753, merge sim-event-attrs into alfonso-frontend-jjtl
- `82b4b71c6` chore(probe): stale M1 edge acceptance checks for F1 (P-2026-10-10-1600)
- `c43001de4` merge: codegen-engine into alfonso-frontend-jjtl (P-2026-10-10-1747)
- `7630ac06a` docs: add prompt P-2026-10-10-1747, merge codegen-engine into alfonso-frontend-jjtl
- `58f48506b` docs: Status flips for the codegen S2 and S4 lanes (P-2026-10-10-0945, P-2026-10-10-0950)
- `6ccf89d0e` docs: closure of the event attributes lane, R-SIM-144 (P-2026-10-10-1630)
- `c0d0cdef0` docs: Status flip and log entry for the sim-coverage-polish merge (P-2026-10-10-1737)
- `ad08a8519` fix(sync): a stale M1 reference edge leaves graph.subElements (P-2026-10-10-1600)
- `061c31707` docs: Status flip for the lane board span lane (P-2026-10-10-1717)
- `1d63b4909` docs: Status flip and log entry for the lane-board-span merge (P-2026-10-10-1731)
- `94d3a9739` docs: Status flip and log entry for the lane-tracking merge (P-2026-10-10-1648)
- `ce1a3465f` chore(probe): R-SIM-144 parity and visual checks (P-2026-10-10-1630)
- `a0289af13` merge: sim-coverage-polish into alfonso-frontend-jjtl (P-2026-10-10-1737)
- `aaff2de2e` docs: add prompt P-2026-10-10-1737, merge sim-coverage-polish into alfonso-frontend-jjtl
- `a2e854587` docs: Status flip and log entry for the sim-board-keys merge (P-2026-10-10-1726)
- `8141fa8a3` feat(sim): event reads checked at Reset, unset event attributes warned (P-2026-10-10-1630)
- `b7405daa2` test(sim): event reads at Reset and the unset warning, red (P-2026-10-10-1630)
- and 12 more: `git log --oneline 3339c11ee..ffd37e8af`

Measured by `lane-run merge` at 2026-10-10 18:36, trunk at `ffd37e8af`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 6ae97ac36`: 1 conflict: `docs/log-inbox/harness.md`.
- Files changed since the base: 3 on the branch side, 86 on the trunk side; on both sides: `docs/log-inbox/harness.md`.
- `git diff --name-only 3339c11ee 6ae97ac36 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-10-10_1816_prompt_board_chat_links.md` (eseguito 2026-10-10, lane P-2026-10-10-1816 (board-chat-links, 226fce084); visual check passed (chat, built-in browser on 4703, RC-23)).
- `git worktree list`: `board-chat-links` in `/Users/alfonso/jjodel-w-chatlinks`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-10-10-1836/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `6ae97ac36` is the tip of `board-chat-links`; the prompt files of the branch read `Status: eseguito` at `6ae97ac36`; `git worktree list` shows `board-chat-links` only in `/Users/alfonso/jjodel-w-chatlinks`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 6ae97ac36` (measured above: 1 conflict: `docs/log-inbox/harness.md`). `git diff --name-only 3339c11ee 6ae97ac36 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 3339c11ee alfonso-frontend-jjtl` with `git diff --name-only 3339c11ee 6ae97ac36` (measured above: `docs/log-inbox/harness.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `RC-45` (trunk); control: `- **RC-46**` none.
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — feat(harness): lane board links each lane to its chat (P-2026-10-10-1816)` once (branch).
   - `docs/log-inbox/codegen-engine.md`: the heading `## 2026-10-10 — feat(codegen): template engine, Text with origin, block indentation, codec (P-2026-10-10-0945)` once (trunk).
   - `docs/log-inbox/codegen-engine.md`: the heading `## 2026-10-10 — merge: codegen-engine into alfonso-frontend-jjtl (P-2026-10-10-1747)` once (trunk).
   - `docs/log-inbox/codegen-runner.md`: the heading `## 2026-10-10 — feat(codegen): JavaScript target profile and sandboxed runner (P-2026-10-10-0950)` once (trunk).
   - `docs/log-inbox/codegen-runner.md`: the heading `## 2026-10-10 — merge: codegen-runner into alfonso-frontend-jjtl (P-2026-10-10-1802)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — merge: lane-tracking into alfonso-frontend-jjtl (P-2026-10-10-1648)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — ticket: merge-into-trunk.md misreads a governance go-ahead and counts check:docs as 4/4` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — merge: lane-board-span into alfonso-frontend-jjtl (P-2026-10-10-1731)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — ticket: `lane-run resume` cannot carry the critical-zone go-ahead` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — merge: lane-board-columns into alfonso-frontend-jjtl (P-2026-10-10-1823)` once (trunk).
   - `docs/log-inbox/jjel-lexer-own-keys.md`: the heading `## 2026-10-10 — fix: JjEL lexer looks up OCL messages and keywords by own key` once (trunk).
   - `docs/log-inbox/jjel-lexer-own-keys.md`: the heading `## 2026-10-10 — ticket: JjScript looks up tables and variable maps keyed by source text on plain objects` once (trunk).
   - `docs/log-inbox/jjel-lexer-own-keys.md`: the heading `## 2026-10-10 — merge: jjel-lexer-own-keys into alfonso-frontend-jjtl (P-2026-10-10-1817)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-10 — merge: sim-board-keys into alfonso-frontend-jjtl (P-2026-10-10-1726)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-10 — feat: fixed-width Coverage switch, Clear sees the live marking (P-2026-10-10-1646)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-10 — merge: sim-coverage-polish into alfonso-frontend-jjtl (P-2026-10-10-1737)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-10 — feat: event reads checked at Reset, the unset warning, R-SIM-144 (P-2026-10-10-1630)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-10 — merge: sim-event-attrs into alfonso-frontend-jjtl (P-2026-10-10-1753)` once (trunk).
   - `docs/log-inbox/stale-m1-edge.md`: the heading `## 2026-10-10 — docs(discovery): stale M1 reference edge, root cause and fix plan (P-2026-10-10-1600)` once (trunk).
   - `docs/log-inbox/stale-m1-edge.md`: the heading `## 2026-10-10 — ticket: a bare DeleteElementAction leaves the edge id in its vertices' edgesOut and edgesIn` once (trunk).
   - `docs/log-inbox/stale-m1-edge.md`: the heading `## 2026-10-10 — fix(sync): a stale M1 reference edge leaves graph.subElements, F1 (P-2026-10-10-1600)` once (trunk).
4. `git merge --no-ff --no-commit 6ae97ac36`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: board-chat-links into alfonso-frontend-jjtl (P-2026-10-10-1836)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `6ae97ac36` in `/Users/alfonso/jjodel-w-chatlinks`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard ffd37e8af` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/harness.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the board-chat-links merge (P-2026-10-10-1836)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-chatlinks`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
