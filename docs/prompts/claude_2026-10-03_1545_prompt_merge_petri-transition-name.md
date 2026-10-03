# Prompt: merge petri-transition-name into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-03-1545
Chat: C-2026-10-01-2215
Lane: full (merge; 1 conflict: `docs/log-inbox/views.md` measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-03-1545 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `433594c84`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `petri-transition-name` into the trunk with one merge commit, `--no-ff`, of the explicit sha `44f7e9f3d`, in the shape of `f614230e8` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `764e00502`. The branch carries, on top of the base, 6 commits:

- `44f7e9f3d` docs: R-VP-53, log entry, report addendum and Status flip (P-2026-10-03-1415)
- `db2ae3577` feat(editor-v2): pass outside vertex labels to the toolbar layout (P-2026-10-03-1415)
- `1c33f3f46` feat(elk): reserve outside vertex labels in the toolbar layout (P-2026-10-03-1415)
- `79e18efb9` feat(derive): Petri classic transition name above the bar (P-2026-10-03-1415)
- `909c67588` docs: discovery report, Petri classic transition name (P-2026-10-03-1415)
- `4f43eb718` docs: add prompt P-2026-10-03-1415, Petri classic transition name

The trunk carries, since the base, 22 commits:

- `433594c84` docs: Status flip and log entry for the sim-initial-default merge (P-2026-10-03-1535)
- `f614230e8` merge: sim-initial-default into alfonso-frontend-jjtl (P-2026-10-03-1535)
- `d6afaceff` docs: add prompt P-2026-10-03-1535, merge sim-initial-default into alfonso-frontend-jjtl
- `095840d88` docs: Status flip and log entry for the initial default (P-2026-10-03-1520)
- `777a5da2f` fix(sim): a state attribute's initial value follows its domain (P-2026-10-03-1520)
- `4fd388c80` docs: add prompt P-2026-10-03-1520, initial value follows the domain
- `cceec3f05` docs: Status flip and log entry for the sim-profile-hint merge (P-2026-10-03-1452)
- `aefaddcf5` merge: sim-profile-hint into alfonso-frontend-jjtl (P-2026-10-03-1452)
- `cc465e85a` docs: add prompt P-2026-10-03-1452, merge sim-profile-hint into alfonso-frontend-jjtl
- `91c8964ae` docs: Status flip and log entry for the state hint wrap fix (P-2026-10-03-1420)
- `1c4212b43` fix(sim): the state hint wraps in two rows so its remedy is readable (P-2026-10-03-1420)
- `ccb15ff9c` docs: R-SIM-110..115, the I/O board of the simulator
- `c76659c4c` docs: Status flip and log entry for the profile state hint (P-2026-10-03-1420)
- `ff8e22e22` fix(sim): explain a profile without state attributes in the panel (P-2026-10-03-1420)
- `9ff95bede` docs: Status flip and log entry for the viewpoint-panel-naming merge (P-2026-10-03-1421)
- `7e856190d` merge: viewpoint-panel-naming into alfonso-frontend-jjtl (P-2026-10-03-1421)
- `703fe5323` docs: add prompt P-2026-10-03-1421, merge viewpoint-panel-naming into alfonso-frontend-jjtl
- `0b9c1edb9` docs: add prompt P-2026-10-03-1420, profile without state attributes explained in the panel
- `2bf3c10ad` docs: log entry and Status for viewpoint_panel_naming (P-2026-10-03-1302)
- `ace72caec` fix(viewpoint-panel): Border uses the design-system checkbox (P-2026-10-03-1302)
- `ff2f39c99` fix(derive): name a derived viewpoint after its notation (P-2026-10-03-1302)
- `078394794` docs: prompt for viewpoint_panel_naming (P-2026-10-03-1302)

Measured by `lane-run merge` at 2026-10-03 15:45, trunk at `433594c84`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 44f7e9f3d`: 1 conflict: `docs/log-inbox/views.md`.
- Files changed since the base: 11 on the branch side, 18 on the trunk side; on both sides: `docs/decisions.md`, `docs/log-inbox/views.md`.
- `git diff --name-only 764e00502 44f7e9f3d -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-10-03_1415_prompt_petri_transition_name.md` (eseguito 2026-10-03 · lane petri-transition-name · 79e18efb9, 1c33f3f46, db2ae3577 · non fuso: hard-stop, Petri net (classic) transition names above the bars and outside vertex labels reserved in ELK, lane probe on 3241 after a real auto-layout 17/17 twice with every scene at 0 collisions (Petri label-edge 2 → 0), rest 10/10, mutation bench 28/29 (the survivor equivalent), crops in frontend/scripts/smoke/_tmp_petriname_crops/ (gitignored), R-VP-53, verifica visiva alla chat).
- `git worktree list`: `petri-transition-name` in `/Users/alfonso/jjodel-w-petriname`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-10-03-1545/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `44f7e9f3d` is the tip of `petri-transition-name`; the prompt files of the branch read `Status: eseguito` at `44f7e9f3d`; `git worktree list` shows `petri-transition-name` only in `/Users/alfonso/jjodel-w-petriname`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 44f7e9f3d` (measured above: 1 conflict: `docs/log-inbox/views.md`). `git diff --name-only 764e00502 44f7e9f3d -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 764e00502 alfonso-frontend-jjtl` with `git diff --name-only 764e00502 44f7e9f3d` (measured above: `docs/decisions.md`, `docs/log-inbox/views.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-VP-53` (branch), `R-SIM-110` (trunk), `R-SIM-111` (trunk), `R-SIM-112` (trunk), `R-SIM-113` (trunk), `R-SIM-114` (trunk), `R-SIM-115` (trunk); control: `- **R-SIM-116**` none.
   - `docs/log-inbox/views.md`: the heading `## 2026-10-03 — feat(derive, elk): Petri classic transition name above the bar, outside vertex labels reserved in ELK (P-2026-10-03-1415)` once (branch).
   - `docs/decisions.md`: the heading `### Decisions 2026-10-03: the I/O board (R-SIM-110..115)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-03 — fix: the panel and the inspector explain a profile without state attributes (P-2026-10-03-1420)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-03 — fix: the state hint wraps in two rows so its remedy is readable (P-2026-10-03-1420)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-03 — merge: sim-profile-hint into alfonso-frontend-jjtl (P-2026-10-03-1452)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-03 — fix: a state attribute's initial value follows its domain (P-2026-10-03-1520)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-03 — merge: sim-initial-default into alfonso-frontend-jjtl (P-2026-10-03-1535)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-03 — fix(viewpoint): derived viewpoints named after their notation, Border as ui Checkbox (P-2026-10-03-1302)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-03 — merge: viewpoint-panel-naming into alfonso-frontend-jjtl (P-2026-10-03-1421)` once (trunk).
4. `git merge --no-ff --no-commit 44f7e9f3d`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: petri-transition-name into alfonso-frontend-jjtl (P-2026-10-03-1545)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `44f7e9f3d` in `/Users/alfonso/jjodel-w-petriname`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 433594c84` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/views.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the petri-transition-name merge (P-2026-10-03-1545)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-petriname`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
