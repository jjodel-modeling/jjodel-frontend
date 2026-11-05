# Prompt: merge textual-ebnf-literals-step2 into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-05-2247
Chat: https://claude.ai/code/session_01DQt9R5nh3m4Y234MPGL9kH
Request: none (rendered by lane-run, no chat URL known for https://claude.ai/code/session_01DQt9R5nh3m4Y234MPGL9kH)
Lane: full (merge; zero conflicts measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-05-2247 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `1b70ba7f3`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `textual-ebnf-literals-step2` into the trunk with one merge commit, `--no-ff`, of the explicit sha `abbdf419d`, in the shape of `1b70ba7f3` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `95359d75e`. The branch carries, on top of the base, 16 commits:

- `abbdf419d` docs: Status flip and log entry for B0 (P-2026-11-05-2220)
- `e12db26dc` test(codegen): B0, style tokens are EBNF islands, linked by origin (P-2026-11-05-2220)
- `f28661bdd` fix(codegen): B0, a tokens input for the style token rows (P-2026-11-05-2220)
- `9d506acfb` docs: add prompt P-2026-11-05-2220, B0 token fields and style-token islands
- `d01f05e5e` docs: Status flips and log entry, textual-ebnf-literals-step2 took the trunk (P-2026-11-05-1537, 1538)
- `2f6c8111d` merge: textual-ebnf-literals-step2 takes alfonso-frontend-jjtl (P-2026-11-05-1537)
- `828d8d2d0` docs: add prompt P-2026-11-05-1538, merge alfonso-frontend-jjtl into textual-ebnf-literals-step2
- `ea1680e06` docs: add prompt P-2026-11-05-1537, merge alfonso-frontend-jjtl into textual-ebnf-literals-step2
- `2c15d1761` docs(codegen): close EBNF literals L2a, style token overrides (P-2026-11-05-1430, 1457)
- `f87481236` test(codegen): L2a (5), round trips under style token overrides (P-2026-11-05-1457)
- `eb73f7b49` feat(codegen): L2a (4), a form field per style token (P-2026-11-05-1457)
- `6d18953e1` docs: add prompt P-2026-11-05-1457, L2a continuation
- `612626c76` feat(codegen): L2a (3), the style-tokens rule (P-2026-11-05-1430)
- `e34070b3b` feat(codegen): L2a (2), base switch drops token overrides, fixed order (P-2026-11-05-1430)
- `1794d0dd0` feat(codegen): L2a (1), style token overrides resolved and applied (P-2026-11-05-1430)
- `9dc755f13` docs: add prompt P-2026-11-05-1430, EBNF literals L2a

The trunk carries, since the base, 11 commits:

- `1b70ba7f3` merge: jjtl-method-failure-error into alfonso-frontend-jjtl (P-2026-11-05-2234)
- `b636d655f` docs: add prompt P-2026-11-05-2234, merge jjtl-method-failure-error into alfonso-frontend-jjtl
- `3ff841fc3` docs: Status flip and log entry, R-FA-12 closes the ticket (P-2026-11-05-2225)
- `2a14b3e72` docs: discovery report, a failing JjEL method in JjTL (P-2026-11-05-2225)
- `8746cb976` docs: register R-FA-12, mark R-XMI-1 ratified (P-2026-11-05-1530)
- `097410e34` docs(jjtl): SPEC §10, a failing JjEL method is an error (P-2026-11-05-1530)
- `32e777031` fix(jjtl): a failing JjEL method stops the mapping (P-2026-11-05-1530)
- `9c123c45a` docs: add prompt P-2026-11-05-2225, close R-FA-12 after the context ceiling
- `cd3620be8` docs: ratify R-TXT-52, the block tokens decisions
- `72d2dabb2` docs: R-TXT-52, the block tokens decisions taken under lane auto, provisional
- `5f18f7e19` docs: add prompt P-2026-11-05-1530, a failing JjEL method stops a JjTL mapping

Measured by `lane-run merge` at 2026-11-05 22:47, trunk at `1b70ba7f3`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl abbdf419d`: zero conflicts.
- Files changed since the base: 14 on the branch side, 11 on the trunk side; on both sides: none.
- `git diff --name-only 95359d75e abbdf419d -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-05_1430_prompt_textual_ebnf_literals_l2a.md` (eseguito 2026-11-05 · lane full · 1794d0dd0, e34070b3b, 612626c76 (stopped at the ceiling, continued by P-2026-11-05-1457, RC-51) · verifica visiva non eseguita (style literals editable in the EBNF mode, no app probe)), `claude_2026-11-05_1457_prompt_textual_ebnf_literals_l2a_cont.md` (eseguito 2026-11-05 · lane full · eb73f7b49, f87481236 · closes P-2026-11-05-1430 · verifica visiva non eseguita (style literals editable in the EBNF mode, no app probe)), `claude_2026-11-05_1537_prompt_textual-ebnf-literals-step2_take_trunk.md` (eseguito 2026-11-05 · lane textual-ebnf-literals-step2 · 2f6c8111d · vitest red on one genuine conflict (ebnfIslands.test.ts pins style tokens read only, L2a makes them editable), fixed in P-2026-11-05-2220 (B0); the other 45 failures were load, 973/974 alone), `claude_2026-11-05_1538_prompt_textual-ebnf-literals-step2_take_trunk.md` (eseguito 2026-11-05 · superseded by P-2026-11-05-1537, duplicate launch during the bridge outage, no commit of its own), `claude_2026-11-05_2220_prompt_textual_ebnf_literals_b0.md` (eseguito 2026-11-05 · lane full · f28661bdd, e12db26dc · app probe 13/13 pass; verifica visiva in attesa del GO (crops b0-1..9 in ~/.jjodel-lanes/P-2026-11-05-2220/)).
- `git worktree list`: `textual-ebnf-literals-step2` in `/Users/alfonso/jjodel-w-ebnflit2`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-11-05-2247/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `abbdf419d` is the tip of `textual-ebnf-literals-step2`; the prompt files of the branch read `Status: eseguito` at `abbdf419d`; `git worktree list` shows `textual-ebnf-literals-step2` only in `/Users/alfonso/jjodel-w-ebnflit2`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl abbdf419d` (measured above: zero conflicts). `git diff --name-only 95359d75e abbdf419d -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 95359d75e alfonso-frontend-jjtl` with `git diff --name-only 95359d75e abbdf419d` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-TXT-52` (trunk), `R-FA-12` (trunk), `R-XMI-1` (trunk); control: `- **R-XMI-2**` none.
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-05 — feat(codegen): L2a, the style tokens as overrides on the base, a form field per token (P-2026-11-05-1430, P-2026-11-05-1457)` once (branch).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-05 — merge: textual-ebnf-literals-step2 takes alfonso-frontend-jjtl (P-2026-11-05-1537)` once (branch).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-05 — fix(codegen): B0, a tokens input for the style token rows, style-token islands after L2a (P-2026-11-05-2220)` once (branch).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-05 — fix(jjtl): a failing JjEL method stops the mapping (P-2026-11-05-1530, P-2026-11-05-2225)` once (trunk).
4. `git merge --no-ff --no-commit abbdf419d`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: textual-ebnf-literals-step2 into alfonso-frontend-jjtl (P-2026-11-05-2247)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `abbdf419d` in `/Users/alfonso/jjodel-w-ebnflit2`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-ebnflit2`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 1b70ba7f3` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only 1b70ba7f3 HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/codegen.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the textual-ebnf-literals-step2 merge (P-2026-11-05-2247)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-ebnflit2`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
