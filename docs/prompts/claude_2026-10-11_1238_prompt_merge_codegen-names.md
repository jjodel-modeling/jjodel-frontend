# Prompt: merge codegen-names into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-11-1238
Chat: C-2026-10-10-0046
Lane: full (merge; zero conflicts measured)
Status: eseguito 2026-10-11 · lane merge · 4f117a0b0 · verifica visiva passata 2026-10-11 (RC-23 on the S7a crops ($ID table and named transitions for turnstile and Petri producer-consumer), GO by Alfonso 12:35; all trunk gates green)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-11-1238 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `9461bfd7c`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `codegen-names` into the trunk with one merge commit, `--no-ff`, of the explicit sha `9c5ccef5f`, in the shape of `9461bfd7c` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `276a69ac7`. The branch carries, on top of the base, 4 commits:

- `9c5ccef5f` docs: Status flip for the codegen S7a readable names lane (P-2026-10-11-1052)
- `716b2d36a` docs: log entry for codegen S7a, readable element names (P-2026-10-11-1052)
- `5b6bd3e01` feat(codegen): generated JavaScript names elements through one $ID table (P-2026-10-11-1052)
- `4b6e071a3` docs(prompts): add P-2026-10-11-1052, codegen S7a readable element names

The trunk carries, since the base, 28 commits:

- `9461bfd7c` merge: board-loading into alfonso-frontend-jjtl (P-2026-10-11-1221)
- `3c90527a9` docs: add prompt P-2026-10-11-1221, merge board-loading into alfonso-frontend-jjtl
- `f59f1ccd5` fix(harness): lane board keeps last good data, shows a loading indicator (P-2026-10-11-1205)
- `66ee3830d` docs: Status flip and log entry for the firstshot-time-axis merge (P-2026-10-11-1152)
- `1ec75cd32` docs(prompts): lane board loading indicator and last good data (P-2026-10-11-1205)
- `bc5b997c1` docs(prompts): graphVertex frame follows a dragged child on four sides, pool record position (P-2026-10-11-1156)
- `899d5aa07` merge: firstshot-time-axis into alfonso-frontend-jjtl (P-2026-10-11-1152)
- `7816e2da1` docs: add prompt P-2026-10-11-1152, merge firstshot-time-axis into alfonso-frontend-jjtl
- `7d7ba62e5` docs: Status flip and log entry for first-shot on the time axis (P-2026-10-11-1138)
- `cbbc1a204` docs(prompts): lane board Insights, more cards, discovery (P-2026-10-11-1150)
- `3f5e33827` feat(harness): first-shot squares on the time axis (P-2026-10-11-1138)
- `e47e456b1` docs(prompts): Front line for P-2026-10-11-1145
- `3e2a0ac34` docs(prompts): JjScript do-block follow-ups, lane auto (P-2026-10-11-1145)
- `8432b808f` docs(prompts): Status flip, P-2026-10-10-0045 and P-2026-10-10-0810
- `8bf53414a` docs: Status flip and log entry for the do-freeze merge (P-2026-10-11-0034)
- `35974e80f` docs: prompt for first-shot squares on the time axis (P-2026-10-11-1138)
- `ef42d3596` docs: Status flip and log entry for the jjodie-reserved merge (P-2026-10-11-0023)
- `be556435b` docs(prompts): new project, metaclasses cannot be instantiated, discovery (P-2026-10-11-1135)
- `274ed050d` docs: Status flip and log entry for the ticket-cards merge (P-2026-10-11-1127)
- `bcffa0c76` merge: ticket-cards into alfonso-frontend-jjtl (P-2026-10-11-1127)
- `8e1e5c7d8` docs: add prompt P-2026-10-11-1127, merge ticket-cards into alfonso-frontend-jjtl
- `db0390b33` docs(prompts): Status flip, P-2026-10-11-1017
- `1328e35ff` docs: Status flip and log entry for the board-requirements merge (P-2026-10-11-1119)
- `798e69779` docs(log): ticket cards entry and a status-writes-card ticket (P-2026-10-11-1017)
- `861dab55d` docs(discovery): ticket cards Phase 2 addendum, backfill (P-2026-10-11-1017)
- `11326b71a` docs(harness): the ticket backfill plan of the GO (P-2026-10-11-1017)
- `4cf89641e` feat(harness): lane-run ticket files tickets as Backlog cards (P-2026-10-11-1017)
- `7216c4464` docs(discovery): ticket cards, parser, fronts and backfill table (P-2026-10-11-1017)

Measured by `lane-run merge` at 2026-10-11 12:38, trunk at `9461bfd7c`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 9c5ccef5f`: zero conflicts.
- Files changed since the base: 16 on the branch side, 29 on the trunk side; on both sides: none.
- `git diff --name-only 276a69ac7 9c5ccef5f -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-10-11_1052_prompt_codegen_s7a_readable_names.md` (eseguito 2026-10-11 · lane codegen-names · code 5b6bd3e01 · log 716b2d36a · tsc 14 = base, vitest codegen + simulation 1004 (976 + 28), build exit 0, check:codegen-lazy green, probe 35/35, mutation bench 17/17 · visual check passata 2026-10-11 (RC-23 by the chat on 4 crops, GO by Alfonso 12:35); DOVE extended by the chat to four string literals in oracle/__tests__/examples.test.ts).
- `git worktree list`: `codegen-names` in `/Users/alfonso/jjodel-w-codegen-names`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-10-11-1238/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `9c5ccef5f` is the tip of `codegen-names`; the prompt files of the branch read `Status: eseguito` at `9c5ccef5f`; `git worktree list` shows `codegen-names` only in `/Users/alfonso/jjodel-w-codegen-names`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 9c5ccef5f` (measured above: zero conflicts). `git diff --name-only 276a69ac7 9c5ccef5f -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 276a69ac7 alfonso-frontend-jjtl` with `git diff --name-only 276a69ac7 9c5ccef5f` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/codegen-names.md`: the heading `## 2026-10-11 — feat(codegen): readable element names in the generated JavaScript (P-2026-10-11-1052)` once (branch).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-11 — merge: board-requirements into alfonso-frontend-jjtl (P-2026-10-11-1119)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-11 — ticket: lane-run status writes the GitHub card, while the lane skill calls status read-only` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-11 — feat(harness): lane-run ticket, tickets as Backlog cards, backfill (P-2026-10-11-1017)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-11 — merge: ticket-cards into alfonso-frontend-jjtl (P-2026-10-11-1127)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-11 — feat(harness): first-shot squares on the time axis (P-2026-10-11-1138)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-11 — merge: firstshot-time-axis into alfonso-frontend-jjtl (P-2026-10-11-1152)` once (trunk).
   - `docs/log-inbox/jjodie-reserved.md`: the heading `## 2026-10-11 — merge: jjodie-reserved into alfonso-frontend-jjtl (P-2026-10-11-0023)` once (trunk).
   - `docs/log-inbox/jjscript.md`: the heading `## 2026-10-11 — merge: do-freeze into alfonso-frontend-jjtl (P-2026-10-11-0034)` once (trunk).
4. `git merge --no-ff --no-commit 9c5ccef5f`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: codegen-names into alfonso-frontend-jjtl (P-2026-10-11-1238)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `9c5ccef5f` in `/Users/alfonso/jjodel-w-codegen-names`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 9461bfd7c` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/codegen-names.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the codegen-names merge (P-2026-10-11-1238)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-codegen-names`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
