# Prompt: merge jjel-lexer-own-keys into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-10-1817
Chat: —
Lane: full (merge; zero conflicts measured)
Status: eseguito 2026-10-10 · lane merge · 0d2ad8f11 · verifica visiva passata 2026-10-10 (non-visual: JjEL lexer own-key lookups, 20 tests green; RC-45 drawn lane (light))

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-10-1817 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `834152b68`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `jjel-lexer-own-keys` into the trunk with one merge commit, `--no-ff`, of the explicit sha `b1b1599ba`, in the shape of `834152b68` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `6ca224b68`. The branch carries, on top of the base, 2 commits:

- `b1b1599ba` docs: log-inbox entry and JjScript ticket for the lexer own-key lane (P-2026-10-10-1756)
- `455792c69` fix(jjel): lexer looks up OCL messages and keywords by own key (P-2026-10-10-1756)

The trunk carries, since the base, 21 commits:

- `834152b68` merge: stale-m1-edge into alfonso-frontend-jjtl (P-2026-10-10-1809)
- `18b072088` docs: add prompt P-2026-10-10-1809, merge stale-m1-edge into alfonso-frontend-jjtl
- `bf21aa74f` docs(prompts): Status flip, P-2026-10-10-1600
- `c28297230` docs: ticket, lane-run resume cannot carry the critical-zone go-ahead
- `f02a57d59` merge: codegen-runner into alfonso-frontend-jjtl (P-2026-10-10-1802)
- `e84cf1d16` docs: Status flip and log entry for the sim-event-attrs merge (P-2026-10-10-1753)
- `857c72139` docs: add prompt P-2026-10-10-1802, merge codegen-runner into alfonso-frontend-jjtl
- `45ad56bd6` merge: sim-event-attrs into alfonso-frontend-jjtl (P-2026-10-10-1753)
- `d6448ef04` docs: stale M1 edge F1 measurements, addendum, LIR 4, inbox (P-2026-10-10-1600)
- `039ed6f62` docs: Status flip for the event attributes Phase 2 (P-2026-10-10-1630)
- `82b4b71c6` chore(probe): stale M1 edge acceptance checks for F1 (P-2026-10-10-1600)
- `6ccf89d0e` docs: closure of the event attributes lane, R-SIM-144 (P-2026-10-10-1630)
- `ad08a8519` fix(sync): a stale M1 reference edge leaves graph.subElements (P-2026-10-10-1600)
- `ce1a3465f` chore(probe): R-SIM-144 parity and visual checks (P-2026-10-10-1630)
- `8141fa8a3` feat(sim): event reads checked at Reset, unset event attributes warned (P-2026-10-10-1630)
- `b7405daa2` test(sim): event reads at Reset and the unset warning, red (P-2026-10-10-1630)
- `df7904064` docs(lir): stale M1 edge F1, subElements scrub in the reconcile (P-2026-10-10-1600)
- `9e1b0b7b8` docs(discovery): stale M1 reference edge, root cause and F1 (P-2026-10-10-1600)
- `46bcfcb92` chore(probe): stale M1 reference edge, round trips and scrub control (P-2026-10-10-1600)
- `312927556` docs: log entry for the codegen S4 runner lane (P-2026-10-10-0950)
- `a588a27ae` feat(codegen): JavaScript target profile and sandboxed runner (P-2026-10-10-0950)

Measured by `lane-run merge` at 2026-10-10 18:17, trunk at `834152b68`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl b1b1599ba`: zero conflicts.
- Files changed since the base: 3 on the branch side, 50 on the trunk side; on both sides: none.
- `git diff --name-only 6ca224b68 b1b1599ba -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: none.
- `git worktree list`: `jjel-lexer-own-keys` in `/Users/alfonso/jjodel-w-jjellexer`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-10-10-1817/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `b1b1599ba` is the tip of `jjel-lexer-own-keys`; the prompt files of the branch read `Status: eseguito` at `b1b1599ba`; `git worktree list` shows `jjel-lexer-own-keys` only in `/Users/alfonso/jjodel-w-jjellexer`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl b1b1599ba` (measured above: zero conflicts). `git diff --name-only 6ca224b68 b1b1599ba -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 6ca224b68 alfonso-frontend-jjtl` with `git diff --name-only 6ca224b68 b1b1599ba` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/jjel-lexer-own-keys.md`: the heading `## 2026-10-10 — fix: JjEL lexer looks up OCL messages and keywords by own key` once (branch).
   - `docs/log-inbox/jjel-lexer-own-keys.md`: the heading `## 2026-10-10 — ticket: JjScript looks up tables and variable maps keyed by source text on plain objects` once (branch).
   - `docs/log-inbox/codegen-runner.md`: the heading `## 2026-10-10 — feat(codegen): JavaScript target profile and sandboxed runner (P-2026-10-10-0950)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — ticket: `lane-run resume` cannot carry the critical-zone go-ahead` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-10 — feat: event reads checked at Reset, the unset warning, R-SIM-144 (P-2026-10-10-1630)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-10 — merge: sim-event-attrs into alfonso-frontend-jjtl (P-2026-10-10-1753)` once (trunk).
   - `docs/log-inbox/stale-m1-edge.md`: the heading `## 2026-10-10 — docs(discovery): stale M1 reference edge, root cause and fix plan (P-2026-10-10-1600)` once (trunk).
   - `docs/log-inbox/stale-m1-edge.md`: the heading `## 2026-10-10 — ticket: a bare DeleteElementAction leaves the edge id in its vertices' edgesOut and edgesIn` once (trunk).
   - `docs/log-inbox/stale-m1-edge.md`: the heading `## 2026-10-10 — fix(sync): a stale M1 reference edge leaves graph.subElements, F1 (P-2026-10-10-1600)` once (trunk).
4. `git merge --no-ff --no-commit b1b1599ba`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: jjel-lexer-own-keys into alfonso-frontend-jjtl (P-2026-10-10-1817)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `b1b1599ba` in `/Users/alfonso/jjodel-w-jjellexer`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 834152b68` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/jjel-lexer-own-keys.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the jjel-lexer-own-keys merge (P-2026-10-10-1817)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-jjellexer`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
