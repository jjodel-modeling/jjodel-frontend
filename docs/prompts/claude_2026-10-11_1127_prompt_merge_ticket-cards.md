# Prompt: merge ticket-cards into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-11-1127
Chat: —
Lane: full (merge; 1 conflict: `docs/log-inbox/harness.md` measured)
Status: eseguito 2026-10-11 · lane merge · bcffa0c76 · verifica visiva passata 2026-10-11 (scripts-only; chat check: 925/925 scripts tests, bench 29/29, backfill 42 cards)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-11-1127 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `1328e35ff`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `ticket-cards` into the trunk with one merge commit, `--no-ff`, of the explicit sha `db0390b33`, in the shape of `1fe9439d8` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `96d38b2bf`. The branch carries, on top of the base, 6 commits:

- `db0390b33` docs(prompts): Status flip, P-2026-10-11-1017
- `798e69779` docs(log): ticket cards entry and a status-writes-card ticket (P-2026-10-11-1017)
- `861dab55d` docs(discovery): ticket cards Phase 2 addendum, backfill (P-2026-10-11-1017)
- `11326b71a` docs(harness): the ticket backfill plan of the GO (P-2026-10-11-1017)
- `4cf89641e` feat(harness): lane-run ticket files tickets as Backlog cards (P-2026-10-11-1017)
- `7216c4464` docs(discovery): ticket cards, parser, fronts and backfill table (P-2026-10-11-1017)

The trunk carries, since the base, 28 commits:

- `1328e35ff` docs: Status flip and log entry for the board-requirements merge (P-2026-10-11-1119)
- `276a69ac7` docs(decisions): R-GEN-17, generated JavaScript names elements through one id table
- `ec8dc082d` docs: Status flip and log entry for the codegen-oracle merge (P-2026-10-11-1056)
- `1fe9439d8` merge: board-requirements into alfonso-frontend-jjtl (P-2026-10-11-1119)
- `64877424c` docs: add prompt P-2026-10-11-1119, merge board-requirements into alfonso-frontend-jjtl
- `fe87ea447` docs: Status flip and log entry for the codegen-ready merge (P-2026-10-11-1112)
- `42337a06f` merge: codegen-ready into alfonso-frontend-jjtl (P-2026-10-11-1112)
- `e9b736e9d` docs: add prompt P-2026-10-11-1112, merge codegen-ready into alfonso-frontend-jjtl
- `63369a3dc` docs: Status flip for the codegen-ready lane (P-2026-10-11-1105)
- `764758224` docs: log entry for the oracle in-process worker ready fix (P-2026-10-11-1105)
- `47a0d95a3` fix(codegen): the oracle tests' in-process worker posts ready (P-2026-10-11-1105)
- `3ca590840` docs(prompts): add P-2026-10-11-1105, the oracle tests' in-process worker posts ready
- `28c9b0aad` merge: codegen-oracle into alfonso-frontend-jjtl (P-2026-10-11-1056)
- `3287fd99e` docs: add prompt P-2026-10-11-1056, merge codegen-oracle into alfonso-frontend-jjtl
- `bc6894a22` docs: Status flip and log entry for the codegen-fix merge (P-2026-10-11-1049)
- `b82802d10` docs: Status flip and log entry for the Requirements tab (P-2026-10-11-0008)
- `ac2471ab0` fix(harness): Requirements tab splits unassigned pairs by softgoal (P-2026-10-11-0008)
- `bd73d6e54` merge: codegen-fix into alfonso-frontend-jjtl (P-2026-10-11-1049)
- `73a313128` docs: add prompt P-2026-10-11-1049, merge codegen-fix into alfonso-frontend-jjtl
- `d8233842b` docs: Status flip for the codegen S6 oracle lane (P-2026-10-10-2029)
- `f8992c4d0` docs: Status flip for the codegen S5b fixes lane (P-2026-10-10-2027)
- `1aee982fa` feat(harness): lane board Requirements tab (P-2026-10-11-0008)
- `dd75987f5` docs: log entry for the codegen S6 oracle lane (P-2026-10-10-2029)
- `a40c39948` feat(codegen): oracle against the simulator, JS target, two examples (P-2026-10-10-2029)
- `93ea5fb4d` docs: log entry for the codegen S5b fixes (P-2026-10-10-2027)
- `a880e5ab8` fix(codegen): run clock starts at worker ready; output scrolls (P-2026-10-10-2027)
- `6288ec111` docs(prompts): code generation S6 oracle (P-2026-10-10-2029)
- `e142a13c4` docs(prompts): code generation S5b fixes (P-2026-10-10-2027)

Measured by `lane-run merge` at 2026-10-11 11:27, trunk at `1328e35ff`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl db0390b33`: 1 conflict: `docs/log-inbox/harness.md`.
- Files changed since the base: 8 on the branch side, 38 on the trunk side; on both sides: `docs/log-inbox/harness.md`.
- `git diff --name-only 96d38b2bf db0390b33 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: none.
- `git worktree list`: `ticket-cards` in `/Users/alfonso/jjodel-w-ticketcards`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-10-11-1127/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `db0390b33` is the tip of `ticket-cards`; the prompt files of the branch read `Status: eseguito` at `db0390b33`; `git worktree list` shows `ticket-cards` only in `/Users/alfonso/jjodel-w-ticketcards`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl db0390b33` (measured above: 1 conflict: `docs/log-inbox/harness.md`). `git diff --name-only 96d38b2bf db0390b33 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 96d38b2bf alfonso-frontend-jjtl` with `git diff --name-only 96d38b2bf db0390b33` (measured above: `docs/log-inbox/harness.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-GEN-17` (trunk); control: `- **R-GEN-18**` none.
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-11 — ticket: lane-run status writes the GitHub card, while the lane skill calls status read-only` once (branch).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-11 — feat(harness): lane-run ticket, tickets as Backlog cards, backfill (P-2026-10-11-1017)` once (branch).
   - `docs/log-inbox/codegen-fix.md`: the heading `## 2026-10-10 — fix(codegen): run clock starts at worker ready; output scrolls (P-2026-10-10-2027)` once (trunk).
   - `docs/log-inbox/codegen-fix.md`: the heading `## 2026-10-11 — merge: codegen-fix into alfonso-frontend-jjtl (P-2026-10-11-1049)` once (trunk).
   - `docs/log-inbox/codegen-oracle.md`: the heading `## 2026-10-10 — feat(codegen): oracle against the simulator, JS target profile, two lecture examples (P-2026-10-10-2029)` once (trunk).
   - `docs/log-inbox/codegen-oracle.md`: the heading `## 2026-10-11 — merge: codegen-oracle into alfonso-frontend-jjtl (P-2026-10-11-1056)` once (trunk).
   - `docs/log-inbox/codegen-ready.md`: the heading `## 2026-10-11 — fix(codegen): the oracle tests' in-process worker posts ready (P-2026-10-11-1105)` once (trunk).
   - `docs/log-inbox/codegen-ready.md`: the heading `## 2026-10-11 — merge: codegen-ready into alfonso-frontend-jjtl (P-2026-10-11-1112)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-11 — feat(harness): lane board Requirements tab (P-2026-10-11-0008)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-11 — merge: board-requirements into alfonso-frontend-jjtl (P-2026-10-11-1119)` once (trunk).
4. `git merge --no-ff --no-commit db0390b33`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: ticket-cards into alfonso-frontend-jjtl (P-2026-10-11-1127)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `db0390b33` in `/Users/alfonso/jjodel-w-ticketcards`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 1328e35ff` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/harness.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the ticket-cards merge (P-2026-10-11-1127)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-ticketcards`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
