# Prompt: merge lane-board-model-insights into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-10-1708
Chat: —
Lane: full (merge; 1 conflict: `docs/log-inbox/harness.md` measured)
Status: eseguito 2026-10-10 · lane merge · 549409422 · verifica visiva passata 2026-10-10 (scripts-only (lane board), app untouched; live board on 4700 restarted on 549409422, /api/insights 200 in 2.1 s, Insights tab shows Code areas, Model by area and by size and First-shot over time, no console errors (chat, built-in browser, RC-23))

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-10-1708 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `c7b5bd751`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `lane-board-model-insights` into the trunk with one merge commit, `--no-ff`, of the explicit sha `4aa8e3b80`, in the shape of `c7b5bd751` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `f13f6f489`. The branch carries, on top of the base, 7 commits:

- `4aa8e3b80` docs: Status flip and log entry, lane-board-model-insights took trunk (P-2026-10-10-1635)
- `25383392a` merge: lane-board-model-insights takes alfonso-frontend-jjtl (P-2026-10-10-1635)
- `ea4f01c17` docs: add prompt P-2026-10-10-1635, merge alfonso-frontend-jjtl into lane-board-model-insights
- `285356563` fix(harness): Insights marker labels laid out in rows (P-2026-10-10-1520)
- `479fbab01` docs: log entry for the lane board Insights lane (P-2026-10-10-1520)
- `e3590d682` feat(harness): lane board Insights, models, code areas, first-shot (P-2026-10-10-1520)
- `da062a727` docs(discovery): lane board model and code-area insights (P-2026-10-10-1520)

The trunk carries, since the base, 18 commits:

- `c7b5bd751` merge: lane-tracking into alfonso-frontend-jjtl (P-2026-10-10-1648)
- `c3b4d6c11` docs: add prompt P-2026-10-10-1648, merge lane-tracking into alfonso-frontend-jjtl
- `3bf8d201a` docs(prompts): board editor keys and CSS, coverage polish (P-2026-10-10-1645, P-2026-10-10-1646)
- `1d0208c35` docs(decisions): R-SIM-146, the RC-26 points of 2026-10-06
- `443e86910` docs: Status flip and log entry for lane tracking C (P-2026-10-10-1612)
- `1d94d279a` docs(harness): the front rule binds from P-2026-10-11-0000 (RC-44)
- `0955ef140` fix(harness): cut-off P-2026-10-11-0000, auto-intake renders Front
- `ab3a04f42` merge: alfonso-frontend-jjtl into lane-tracking (P-2026-10-10-1612)
- `6d018b1fa` docs(prompts): lane tracking C, trunk sync, cut-off and auto-intake Front (P-2026-10-10-1612)
- `09e62e6ee` docs: Status flip and log entry for lane tracking B
- `c9d0bb68d` docs(harness): HARNESS-DOCS gains Check E and the lane card (RC-44)
- `d52b06c4d` feat(harness): lane-run projects each lane onto its GitHub card (RC-44)
- `17a83329e` docs(prompts): lane tracking B, GitHub projection of lane state (P-2026-10-10-1532)
- `e843be28a` docs: Status flips and log entry for lane tracking A
- `8ab16688f` docs(harness): front registry, P13 Front bullet, RC-44
- `73af7bbac` feat(harness): every prompt names its front, Check E (RC-44)
- `56039f229` docs(prompts): lane tracking A, front registry and Check E (P-2026-10-10-1500)
- `6ec3c3f8e` docs(discovery): lane tracking on GitHub Projects (P-2026-10-10-1330)

Measured by `lane-run merge` at 2026-10-10 17:08, trunk at `c7b5bd751`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 4aa8e3b80`: 1 conflict: `docs/log-inbox/harness.md`.
- Files changed since the base: 6 on the branch side, 24 on the trunk side; on both sides: `docs/log-inbox/harness.md`.
- `git diff --name-only f13f6f489 4aa8e3b80 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-10-10_1635_prompt_lane-board-model-insights_take_trunk.md` (eseguito 2026-10-10 · lane lane-board-model-insights · 25383392a · verifica visiva passata 2026-10-10 (chat, unattended; Alfonso in the morning digest)).
- `git worktree list`: `lane-board-model-insights` in `/Users/alfonso/jjodel-w-modelinsights`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-10-10-1708/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `4aa8e3b80` is the tip of `lane-board-model-insights`; the prompt files of the branch read `Status: eseguito` at `4aa8e3b80`; `git worktree list` shows `lane-board-model-insights` only in `/Users/alfonso/jjodel-w-modelinsights`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 4aa8e3b80` (measured above: 1 conflict: `docs/log-inbox/harness.md`). `git diff --name-only f13f6f489 4aa8e3b80 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only f13f6f489 alfonso-frontend-jjtl` with `git diff --name-only f13f6f489 4aa8e3b80` (measured above: `docs/log-inbox/harness.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `RC-44` (trunk), `R-SIM-146` (trunk); control: `- **R-SIM-147**` none.
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — feat(harness): lane board Insights, models, code areas, first-shot (P-2026-10-10-1520)` once (branch).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — merge: lane-board-model-insights takes alfonso-frontend-jjtl (P-2026-10-10-1635)` once (branch).
   - `docs/decisions.md`: the heading `### Decisions 2026-10-10: the RC-26 points of 2026-10-06 (R-SIM-146)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — feat(harness): every prompt names its front, Check E (P-2026-10-10-1500)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — feat(harness): lane-run projects each lane onto its GitHub card (P-2026-10-10-1532)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — ticket: trunk prompts after FRONT_FROM lack Front:, Check E fails them at the merge` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — ticket: issue-discovery.md renders no Front:, start --auto will refuse auto-intake lanes` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — fix(harness): front cut-off to P-2026-10-11-0000, auto-intake renders Front (P-2026-10-10-1612)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — ticket: the moved cut-off leaves this lane's GitHub card open, In progress` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — ticket: issue-discovery.md renders no Depends: line (RC-42)` once (trunk).
4. `git merge --no-ff --no-commit 4aa8e3b80`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: lane-board-model-insights into alfonso-frontend-jjtl (P-2026-10-10-1708)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `4aa8e3b80` in `/Users/alfonso/jjodel-w-modelinsights`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard c7b5bd751` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/harness.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the lane-board-model-insights merge (P-2026-10-10-1708)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-modelinsights`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
