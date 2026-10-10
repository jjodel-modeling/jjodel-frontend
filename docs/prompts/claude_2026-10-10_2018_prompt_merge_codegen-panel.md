# Prompt: merge codegen-panel into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-10-2018
Chat: C-2026-10-10-0046
Lane: full (merge; zero conflicts measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-10-2018 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `f753bf0d9`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `codegen-panel` into the trunk with one merge commit, `--no-ff`, of the explicit sha `715e7bee6`, in the shape of `e93cc0d0b` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `21d8dc2e7`. The branch carries, on top of the base, 4 commits:

- `715e7bee6` docs: Status flip for the codegen S5 panel lane (P-2026-10-10-1825)
- `7b83066e0` docs: log entry and ticket for the codegen panel slice (P-2026-10-10-1825)
- `f95d0a44f` feat(codegen): setting, lazy Code panel, navigable origin, lazy gate (P-2026-10-10-1825)
- `d7ac77f87` docs(prompts): code generation S5 panel (P-2026-10-10-1825)

The trunk carries, since the base, 55 commits:

- `f753bf0d9` docs: Status flip for the RC-45 tier draw lane (P-2026-10-10-1757)
- `b6fce902a` docs: Status flip and log entry for the lane-run-rc45-draw merge (P-2026-10-10-1937)
- `e93cc0d0b` merge: lane-run-rc45-draw into alfonso-frontend-jjtl (P-2026-10-10-1937)
- `cf8b1b1ca` docs: add prompt P-2026-10-10-1937, merge lane-run-rc45-draw into alfonso-frontend-jjtl
- `d63a4e8e6` docs: Status flip and log entry, lane-run-rc45-draw took the trunk (P-2026-10-10-1923)
- `2913eced0` merge: lane-run-rc45-draw takes alfonso-frontend-jjtl (P-2026-10-10-1923)
- `fc06723e8` docs: add prompt P-2026-10-10-1923, merge alfonso-frontend-jjtl into lane-run-rc45-draw
- `9d41d0bce` docs: Status flip and log entry for the board-kindof-merges merge (P-2026-10-10-1913)
- `2ad7460d0` merge: board-kindof-merges into alfonso-frontend-jjtl (P-2026-10-10-1913)
- `fb5ee3efe` docs: add prompt P-2026-10-10-1913, merge board-kindof-merges into alfonso-frontend-jjtl
- `f8d8c333d` docs: Status flip and log entry, board-kindof-merges took the trunk (P-2026-10-10-1851)
- `600eff1e1` docs: Status flip and log entry, lane-run-rc45-draw took the trunk (P-2026-10-10-1848)
- `e1eb53d43` docs: Status flip and log entry for the board-req-port-disc merge (P-2026-10-10-1852)
- `e388a90ee` docs: merge prompt P-2026-10-10-1754 superseded by P-2026-10-10-1802
- `74b52cd99` merge: board-req-port-disc into alfonso-frontend-jjtl (P-2026-10-10-1852)
- `43231854c` merge: board-kindof-merges takes alfonso-frontend-jjtl (P-2026-10-10-1851)
- `02b752d65` docs: add prompt P-2026-10-10-1852, merge board-req-port-disc into alfonso-frontend-jjtl
- `cc25ca8cd` docs: add prompt P-2026-10-10-1851, merge alfonso-frontend-jjtl into board-kindof-merges
- `995d7cb18` merge: lane-run-rc45-draw takes alfonso-frontend-jjtl (P-2026-10-10-1848)
- `c315460b0` docs: Status flip and log entry for the timeline-newest-first merge (P-2026-10-10-1843)
- `c97fe9b29` docs: add prompt P-2026-10-10-1848, merge alfonso-frontend-jjtl into lane-run-rc45-draw
- `31706d940` merge: timeline-newest-first into alfonso-frontend-jjtl (P-2026-10-10-1843)
- `06bd25bea` docs: Status flip and log entry for the stale-m1-edge merge (P-2026-10-10-1809)
- `0613c8c2b` docs: add prompt P-2026-10-10-1843, merge timeline-newest-first into alfonso-frontend-jjtl
- `b4f9ceb83` fix(harness): drawn view of the model card names the random tier (P-2026-10-10-1757)
- `5e218863b` docs: Status flip and log entry for the board-chat-links merge (P-2026-10-10-1836)
- `6abb5ea11` docs(decisions): RC-45 part 2 uses the check:docs sentinel for Corregge (P-2026-10-10-1757)
- `d77cd0c4e` merge: board-chat-links into alfonso-frontend-jjtl (P-2026-10-10-1836)
- `0a6081439` docs: add prompt P-2026-10-10-1836, merge board-chat-links into alfonso-frontend-jjtl
- `ffd37e8af` docs: Status flip and log entry for the lane-board-columns merge (P-2026-10-10-1823)
- `1ab2d5a49` docs: board README and log entry for the RC-45 draw (P-2026-10-10-1757)
- `8a1068660` feat(harness): lane-run draws the tier of eligible lanes (RC-45) (P-2026-10-10-1757)
- `345b14db7` docs: Status flip for the req-tab port discovery (P-2026-10-10-1806)
- `fd59eefaa` merge: lane-board-columns into alfonso-frontend-jjtl (P-2026-10-10-1823)
- `6ae97ac36` docs: Status flip for the lane board chat links lane (P-2026-10-10-1816)
- `f08ffade3` docs: log entry for the lane board chat links (P-2026-10-10-1816)
- `0d8180ebc` docs(discovery): what harness-req-tab still adds to the trunk board (P-2026-10-10-1806)
- `226fce084` feat(harness): lane board links each lane to its chat
- `963d9290a` docs(prompts): lane board chat links (P-2026-10-10-1816)
- `f4965b72f` docs: Status flip for the kindOf two-merge lane (P-2026-10-10-1803)
- and 15 more: `git log --oneline 21d8dc2e7..f753bf0d9`

Measured by `lane-run merge` at 2026-10-10 20:18, trunk at `f753bf0d9`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 715e7bee6`: zero conflicts.
- Files changed since the base: 13 on the branch side, 28 on the trunk side; on both sides: none.
- `git diff --name-only 21d8dc2e7 715e7bee6 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-10-10_1825_prompt_codegen_s5_panel.md` (eseguito 2026-10-10 · lane codegen-panel · code f95d0a44f · docs 7b83066e0 · tsc 14 = base, vitest 8064 (8052 + 12), build exit 0, check:codegen-lazy green (only setting.ts eager; CodePanel chunk 29.0 kB + 8.9 kB CSS, worker 1.8 kB), probe 41/41, mutation bench 6/6 · visual check passata 2026-10-10 (RC-23 by the chat on 8 crops, GO by Alfonso 20:18); follow-ups: long lines clipped without visible scroll, worker start counted in the run timeout, Backspace in editor textareas (ticket)).
- `git worktree list`: `codegen-panel` in `/Users/alfonso/jjodel-w-codegen-panel`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-10-10-2018/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `715e7bee6` is the tip of `codegen-panel`; the prompt files of the branch read `Status: eseguito` at `715e7bee6`; `git worktree list` shows `codegen-panel` only in `/Users/alfonso/jjodel-w-codegen-panel`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 715e7bee6` (measured above: zero conflicts). `git diff --name-only 21d8dc2e7 715e7bee6 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 21d8dc2e7 alfonso-frontend-jjtl` with `git diff --name-only 21d8dc2e7 715e7bee6` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `RC-45` (trunk); control: `- **RC-46**` none.
   - `docs/log-inbox/codegen-panel.md`: the heading `## 2026-10-10 — feat(codegen): experimental setting, lazy Code panel, navigable origin (P-2026-10-10-1825)` once (branch).
   - `docs/log-inbox/codegen-panel.md`: the heading `## 2026-10-10 — ticket: EditorV2's onKeyDown deletes the selection on Backspace typed in a TEXTAREA` once (branch).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — feat(harness): lane board tables with fixed column widths (P-2026-10-10-1742)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — merge: lane-board-columns into alfonso-frontend-jjtl (P-2026-10-10-1823)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — feat(harness): lane board links each lane to its chat (P-2026-10-10-1816)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — merge: board-chat-links into alfonso-frontend-jjtl (P-2026-10-10-1836)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — feat(harness): lane board timeline lists the newest lanes first (P-2026-10-10-1744)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — merge: timeline-newest-first into alfonso-frontend-jjtl (P-2026-10-10-1843)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — merge: board-req-port-disc into alfonso-frontend-jjtl (P-2026-10-10-1852)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — fix(harness): lane board counts a two-merge lane as a merge (P-2026-10-10-1803)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — merge: board-kindof-merges takes alfonso-frontend-jjtl (P-2026-10-10-1851)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — merge: board-kindof-merges into alfonso-frontend-jjtl (P-2026-10-10-1913)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — feat(harness): lane-run draws the tier of eligible lanes, RC-45 (P-2026-10-10-1757)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — merge: lane-run-rc45-draw takes alfonso-frontend-jjtl (P-2026-10-10-1848)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — merge: lane-run-rc45-draw takes alfonso-frontend-jjtl (P-2026-10-10-1923)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — merge: lane-run-rc45-draw into alfonso-frontend-jjtl (P-2026-10-10-1937)` once (trunk).
   - `docs/log-inbox/stale-m1-edge.md`: the heading `## 2026-10-10 — merge: stale-m1-edge into alfonso-frontend-jjtl (P-2026-10-10-1809)` once (trunk).
4. `git merge --no-ff --no-commit 715e7bee6`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: codegen-panel into alfonso-frontend-jjtl (P-2026-10-10-2018)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `715e7bee6` in `/Users/alfonso/jjodel-w-codegen-panel`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard f753bf0d9` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/codegen-panel.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the codegen-panel merge (P-2026-10-10-2018)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-codegen-panel`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
