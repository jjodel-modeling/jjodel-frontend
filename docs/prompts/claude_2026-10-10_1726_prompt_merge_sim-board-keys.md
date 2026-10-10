# Prompt: merge sim-board-keys into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-10-1726
Chat: C-2026-10-10-1620
Lane: full (merge; 1 conflict: `docs/log-inbox/simulation.md` measured)
Status: eseguito 2026-10-10 · lane merge · bd97bae49 · verifica visiva passata 2026-10-10 (RC-23 already passed on the lane crops (P-2026-10-10-1645); all merge gates green)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-10-1726 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `ae50f7459`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `sim-board-keys` into the trunk with one merge commit, `--no-ff`, of the explicit sha `88f6093a4`, in the shape of `bf252c036` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `3bf8d201a`. The branch carries, on top of the base, 6 commits:

- `88f6093a4` docs: Status flip for P-2026-10-10-1645
- `0132e7149` docs(log): closure entry, board editor keys and CSS (P-2026-10-10-1645)
- `0f724e1c5` chore(probe): board editor keys and styles, base against after (P-2026-10-10-1645)
- `8a7d60355` feat(sim): board editor arrows move, Shift and an arrow select (P-2026-10-10-1645)
- `22596e50b` refactor(sim): delete the old board editor's dead rules (P-2026-10-10-1645)
- `6e1dd0ddd` test(sim): arrows move, Shift and an arrow select, in the board editor (P-2026-10-10-1645)

The trunk carries, since the base, 40 commits:

- `ae50f7459` docs(prompts): event attributes, Phase 2 GO (P-2026-10-10-1630)
- `2b670ddd4` docs(decisions): R-SIM-144, event attributes in guards and actions; spec section 8 row
- `19b77131c` docs: Status flip and log entry for the sim-event-attrs merge (P-2026-10-10-1718)
- `bf252c036` merge: sim-event-attrs into alfonso-frontend-jjtl (P-2026-10-10-1718)
- `a2941670e` docs: add prompt P-2026-10-10-1718, merge sim-event-attrs into alfonso-frontend-jjtl
- `7dec869e8` docs(prompts): graphVertex S6 GO, Auto layout for containers (P-2026-10-10-0105)
- `30be4d558` docs(prompts): lane board span column (P-2026-10-10-1717)
- `21947f80e` docs(prompts): stale M1 reference edge, Phase 2 GO for F1 (P-2026-10-10-1600)
- `01f833e32` docs: Status flip for the event attributes discovery (P-2026-10-10-1630)
- `f1adc914d` docs(prompts): Status flips, P-2026-10-10-1155 and 1156
- `744beefbb` docs(discovery): addendum on cumulative session cost (P-2026-10-10-1520)
- `484157ff5` docs: Status flip for the lane board model insights lane (P-2026-10-10-1520)
- `5e974221c` docs: Status flip and log entry for the lane-board-model-insights merge (P-2026-10-10-1708)
- `549409422` merge: lane-board-model-insights into alfonso-frontend-jjtl (P-2026-10-10-1708)
- `5420e4989` docs: add prompt P-2026-10-10-1708, merge lane-board-model-insights into alfonso-frontend-jjtl
- `c7b5bd751` merge: lane-tracking into alfonso-frontend-jjtl (P-2026-10-10-1648)
- `325cfafec` docs(discovery): event attributes in guards and actions (P-2026-10-10-1630)
- `4aa8e3b80` docs: Status flip and log entry, lane-board-model-insights took trunk (P-2026-10-10-1635)
- `c3b4d6c11` docs: add prompt P-2026-10-10-1648, merge lane-tracking into alfonso-frontend-jjtl
- `413f0096d` chore(probe): event attribute reads in guards and actions (P-2026-10-10-1630)
- `25383392a` merge: lane-board-model-insights takes alfonso-frontend-jjtl (P-2026-10-10-1635)
- `ea4f01c17` docs: add prompt P-2026-10-10-1635, merge alfonso-frontend-jjtl into lane-board-model-insights
- `285356563` fix(harness): Insights marker labels laid out in rows (P-2026-10-10-1520)
- `443e86910` docs: Status flip and log entry for lane tracking C (P-2026-10-10-1612)
- `1d94d279a` docs(harness): the front rule binds from P-2026-10-11-0000 (RC-44)
- `0955ef140` fix(harness): cut-off P-2026-10-11-0000, auto-intake renders Front
- `479fbab01` docs: log entry for the lane board Insights lane (P-2026-10-10-1520)
- `e3590d682` feat(harness): lane board Insights, models, code areas, first-shot (P-2026-10-10-1520)
- `ab3a04f42` merge: alfonso-frontend-jjtl into lane-tracking (P-2026-10-10-1612)
- `6d018b1fa` docs(prompts): lane tracking C, trunk sync, cut-off and auto-intake Front (P-2026-10-10-1612)
- `09e62e6ee` docs: Status flip and log entry for lane tracking B
- `c9d0bb68d` docs(harness): HARNESS-DOCS gains Check E and the lane card (RC-44)
- `d52b06c4d` feat(harness): lane-run projects each lane onto its GitHub card (RC-44)
- `da062a727` docs(discovery): lane board model and code-area insights (P-2026-10-10-1520)
- `17a83329e` docs(prompts): lane tracking B, GitHub projection of lane state (P-2026-10-10-1532)
- `e843be28a` docs: Status flips and log entry for lane tracking A
- `8ab16688f` docs(harness): front registry, P13 Front bullet, RC-44
- `73af7bbac` feat(harness): every prompt names its front, Check E (RC-44)
- `56039f229` docs(prompts): lane tracking A, front registry and Check E (P-2026-10-10-1500)
- `6ec3c3f8e` docs(discovery): lane tracking on GitHub Projects (P-2026-10-10-1330)

Measured by `lane-run merge` at 2026-10-10 17:26, trunk at `ae50f7459`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 88f6093a4`: 1 conflict: `docs/log-inbox/simulation.md`.
- Files changed since the base: 7 on the branch side, 45 on the trunk side; on both sides: `docs/log-inbox/simulation.md`.
- `git diff --name-only 3bf8d201a 88f6093a4 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: none.
- `git worktree list`: `sim-board-keys` in `/Users/alfonso/jjodel-w-boardkeys`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-10-10-1726/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `88f6093a4` is the tip of `sim-board-keys`; the prompt files of the branch read `Status: eseguito` at `88f6093a4`; `git worktree list` shows `sim-board-keys` only in `/Users/alfonso/jjodel-w-boardkeys`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 88f6093a4` (measured above: 1 conflict: `docs/log-inbox/simulation.md`). `git diff --name-only 3bf8d201a 88f6093a4 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 3bf8d201a alfonso-frontend-jjtl` with `git diff --name-only 3bf8d201a 88f6093a4` (measured above: `docs/log-inbox/simulation.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `RC-44` (trunk), `R-SIM-144` (trunk); control: `- **R-SIM-147**` none.
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-10 — feat: board editor arrows move, Shift and an arrow select, old CSS removed (P-2026-10-10-1645)` once (branch).
   - `docs/decisions.md`: the heading `### Decisions 2026-10-10: the attributes of the event that fired the step (R-SIM-144)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — feat(harness): every prompt names its front, Check E (P-2026-10-10-1500)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — feat(harness): lane-run projects each lane onto its GitHub card (P-2026-10-10-1532)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — ticket: trunk prompts after FRONT_FROM lack Front:, Check E fails them at the merge` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — ticket: issue-discovery.md renders no Front:, start --auto will refuse auto-intake lanes` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — fix(harness): front cut-off to P-2026-10-11-0000, auto-intake renders Front (P-2026-10-10-1612)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — ticket: the moved cut-off leaves this lane's GitHub card open, In progress` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — ticket: issue-discovery.md renders no Depends: line (RC-42)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — feat(harness): lane board Insights, models, code areas, first-shot (P-2026-10-10-1520)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — merge: lane-board-model-insights takes alfonso-frontend-jjtl (P-2026-10-10-1635)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — merge: lane-board-model-insights into alfonso-frontend-jjtl (P-2026-10-10-1708)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-10 — discovery: event attributes read by guards and actions (P-2026-10-10-1630)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-10 — merge: sim-event-attrs into alfonso-frontend-jjtl (P-2026-10-10-1718)` once (trunk).
4. `git merge --no-ff --no-commit 88f6093a4`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: sim-board-keys into alfonso-frontend-jjtl (P-2026-10-10-1726)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `88f6093a4` in `/Users/alfonso/jjodel-w-boardkeys`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard ae50f7459` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/simulation.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the sim-board-keys merge (P-2026-10-10-1726)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-boardkeys`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
