# Prompt: merge textual-d6-pinned-hover into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-09-1001
Chat: C-2026-11-08-1908
Request: https://claude.ai/code/session_01DQt9R3u8CMMnSgpf1kjf8V (merge of textual-d6-pinned-hover launched by chat C-2026-11-08-1908)
Lane: full (merge; zero conflicts measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-09-1001 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `733a67020`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `textual-d6-pinned-hover` into the trunk with one merge commit, `--no-ff`, of the explicit sha `dc070e33d`, in the shape of `ca4887172` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `788bb6e71`. The branch carries, on top of the base, 11 commits:

- `dc070e33d` docs: D6b log entry and Status (P-2026-11-09-0950)
- `5221842dd` fix(codegen): the pinned card binds a chord, not Option+H (P-2026-11-09-0950)
- `5af83948d` docs: add prompt P-2026-11-09-0950, D6b pin shortcut as a chord
- `8d2fa8843` docs: D6 log entry and Status (P-2026-11-08-2330, P-2026-11-09-0020)
- `34a586c28` fix(codegen): the hover comes back only off its own place (P-2026-11-09-0020)
- `0d9fd1fa9` fix(codegen): the pinned card clears Monaco's hover (P-2026-11-09-0020)
- `17e338094` docs: add prompt P-2026-11-09-0020, D6 placement fix and closure
- `e536fc071` feat(codegen): D6, the pinned hover card of the Text tab (P-2026-11-08-2330)
- `53680294f` docs: discovery for the textual D6 pinned hover card (P-2026-11-08-2330)
- `e081cd584` docs: renumber D6 prompt to P-2026-11-08-2330 (ID taken by another chat)
- `f97aefd06` docs: add prompt P-2026-11-08-2230, textual D6 pinned hover card

The trunk carries, since the base, 121 commits:

- `733a67020` docs: Status flip and log entry for the notices merge (P-2026-11-09-0930)
- `ca4887172` merge: notices-discovery into alfonso-frontend-jjtl (P-2026-11-09-0930)
- `ee9b26666` docs: add prompt P-2026-11-09-0930, merge notices-discovery into alfonso-frontend-jjtl
- `42debddb3` docs: close notices phase 2, visual check passed (P-2026-11-08-2340, P-2026-11-09-0036)
- `0f4909dd0` docs: DCN session checkpoint 2026-11-09, slice 5
- `c27abbb50` docs: Status flip and log entry for the dcn-s5 merge (P-2026-11-09-0350)
- `42a62568a` merge: dcn-s5 into alfonso-frontend-jjtl (P-2026-11-09-0350)
- `abc8ba96c` docs: add prompt P-2026-11-09-0350, merge dcn-s5 into alfonso-frontend-jjtl
- `faa7b952c` docs(dcn): closure of the coherence wiring, visual check passed (P-2026-11-09-0320)
- `25532aae7` test(dcn): drone probe of the coherence hit (P-2026-11-09-0320)
- `31744a717` feat(dcn): coherence constraints as watch hits (P-2026-11-09-0320)
- `9107a5350` docs(dcn): prompt P-2026-11-09-0320
- `e48f5b1b9` docs(dcn): closure of the coherence evaluation (P-2026-11-09-0259)
- `ae14c5fa9` feat(dcn): coherence constraints over a trajectory (P-2026-11-09-0259)
- `092878d2e` docs(dcn): prompt P-2026-11-09-0259
- `511017c89` docs(dcn): closure of the coherence constraints fixture (P-2026-11-09-0237)
- `48f296d16` docs(dcn): drone measures with the coherence constraints (P-2026-11-09-0237)
- `b139d21b6` test(dcn): coherence constraints in the drone fixture (P-2026-11-09-0237)
- `c2808acd6` docs(dcn): prompt P-2026-11-09-0237
- `b0d2d8e76` docs(dcn): coherence roles closure, no visual check (P-2026-11-09-0124)
- `f7859224e` docs(dcn): status of the coherence roles prompt (P-2026-11-09-0124)
- `47e4d9519` docs(dcn): log of the coherence roles (P-2026-11-09-0124)
- `d6e051d6c` feat(dcn): coherence roles and their reader (P-2026-11-09-0124)
- `63e3afd5d` docs: Status flip and log entry for the dcn-s5 merge (P-2026-11-09-0053)
- `0cbda346a` docs(dcn): prompt P-2026-11-09-0124
- `dfac90f9e` merge: dcn-s5 into alfonso-frontend-jjtl (P-2026-11-09-0053)
- `669c52ab8` docs(dcn): S5 tickets closure, visual check passed (P-2026-11-09-0055)
- `66385f44a` docs(dcn): status of the bare arguments prompt (P-2026-11-09-0055)
- `2d8ffeb45` docs(dcn): log of bare arguments and chips at step back (P-2026-11-09-0055)
- `93619a11a` test(dcn): drone probe reads the chips at step back (P-2026-11-09-0055)
- `10b207546` fix(dcn): Classification chips follow the step shown (P-2026-11-09-0055)
- `57a7fc6da` fix(dcn): invocation arguments readable by bare name (P-2026-11-09-0055)
- `c8c49c049` docs(dcn): prompt P-2026-11-09-0055
- `be5fc56f9` docs: add prompt P-2026-11-09-0053, merge dcn-s5 into alfonso-frontend-jjtl
- `013f2f912` docs(dcn): S5 lane 6 closure, visual check passed (P-2026-11-09-0017)
- `7cfa7e5d9` docs(dcn): status of the Save snapshot prompt (P-2026-11-09-0017)
- `f482dc9f1` docs(dcn): log of the Save snapshot button (P-2026-11-09-0017)
- `55fe8cbb8` test(dcn): snapshot probe presses the panel button (P-2026-11-09-0017)
- `0e71ec074` feat(dcn): Save snapshot button in the Simulation panel (P-2026-11-09-0017)
- `45d3b1794` fix(probe): library gallery closes the new tips card (P-2026-11-09-0036)
- and 81 more: `git log --oneline 788bb6e71..733a67020`

Measured by `lane-run merge` at 2026-11-09 10:01, trunk at `733a67020`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl dc070e33d`: zero conflicts.
- Files changed since the base: 11 on the branch side, 109 on the trunk side; on both sides: none.
- `git diff --name-only 788bb6e71 dc070e33d -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-08_2330_prompt_textual_d6_pinned_hover.md` (eseguito 2026-11-09 · lane textual-d6-pinned-hover · e536fc071 · verifica visiva passata 2026-11-09 (crops of P-2026-11-09-0020, Alfonso «go» 09:45; Option+H types ∆ on the Italian layout, shortcut replaced by the next lane)), `claude_2026-11-09_0020_prompt_textual_d6_placement_closure.md` (eseguito 2026-11-09 · lane textual-d6-pinned-hover · e536fc071 · verifica visiva passata 2026-11-09 (crops of P-2026-11-09-0020, Alfonso «go» 09:45; Option+H types ∆ on the Italian layout, shortcut replaced by the next lane)), `claude_2026-11-09_0950_prompt_textual_d6b_chord.md` (eseguito 2026-11-09 · lane textual-d6-pinned-hover · 5221842dd · verifica visiva passata 2026-11-09 by the chat on the lane DOM checks (12/12; keybinding and label only); crop 1-hover-chord.png for Alfonso (probe 12/12, crop 1-hover-chord.png)).
- `git worktree list`: `textual-d6-pinned-hover` in `/Users/alfonso/jjodel-w-textd6`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-11-09-1001/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `dc070e33d` is the tip of `textual-d6-pinned-hover`; the prompt files of the branch read `Status: eseguito` at `dc070e33d`; `git worktree list` shows `textual-d6-pinned-hover` only in `/Users/alfonso/jjodel-w-textd6`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl dc070e33d` (measured above: zero conflicts). `git diff --name-only 788bb6e71 dc070e33d -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 788bb6e71 alfonso-frontend-jjtl` with `git diff --name-only 788bb6e71 dc070e33d` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-NT-1` (trunk), `R-NT-2` (trunk), `R-NT-3` (trunk), `R-NT-4` (trunk), `R-NT-5` (trunk); control: `- **R-NT-6**` none.
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-09 — feat(codegen): D6, the pinned hover card of the Text tab (P-2026-11-08-2330, P-2026-11-09-0020)` once (branch).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-09 — fix(codegen): D6b, the pinned card binds a chord, not Option+H (P-2026-11-09-0950)` once (branch).
   - `docs/decisions.md`: the heading `## R-NT: notices and tips (decisions 2026-11-08)` once (trunk).
   - `docs/log-inbox/dashboard-drop-import.md`: the heading `## 2026-11-08 — discovery: dashboard drop import, stopped before Phase 2 (P-2026-11-08-1845)` once (trunk).
   - `docs/log-inbox/dashboard-drop-import.md`: the heading `## 2026-11-08 — fix(dashboard): shared .jjodel import, awaited transaction, failures reported (P-2026-11-08-2015)` once (trunk).
   - `docs/log-inbox/dashboard-drop-import.md`: the heading `## 2026-11-08 — feat(dashboard): import modal with drop area, empty state import (P-2026-11-08-2040)` once (trunk).
   - `docs/log-inbox/dashboard-drop-import.md`: the heading `## 2026-11-08 — feat(dashboard): drag tracking and drop overlay (P-2026-11-08-2115)` once (trunk).
   - `docs/log-inbox/dashboard-drop-import.md`: the heading `## 2026-11-08 — feat(dashboard): drop import panel and toasts (P-2026-11-08-2145)` once (trunk).
   - `docs/log-inbox/dashboard-drop-import.md`: the heading `## 2026-11-08 — feat(dashboard): imported card marker and modal feedback (P-2026-11-08-2215)` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-08 — feat: DCN snapshot copy, the pure plan (P-2026-11-08-2124)` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-08 — feat: DCN snapshot written as a new model, layout, exact match (P-2026-11-08-2355)` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-09 — feat: DCN Save snapshot button in the Simulation panel (P-2026-11-09-0017)` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-09 — merge: dcn-s5 into alfonso-frontend-jjtl (P-2026-11-09-0053)` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-09 — fix: DCN bare invocation arguments, chips at step back (P-2026-11-09-0055)` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-09 — feat: DCN coherence roles and their reader (P-2026-11-09-0124)` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-09 — test: DCN coherence constraints in the drone fixture (P-2026-11-09-0237)` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-09 — feat: DCN coherence constraints over a trajectory (P-2026-11-09-0259)` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-09 — feat: DCN coherence constraints in a run, as watch hits (P-2026-11-09-0320)` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-09 — merge: dcn-s5 into alfonso-frontend-jjtl (P-2026-11-09-0350)` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-08 — fix: the beside layout, rail column, width cap, app bar, minimap, toolbar (multi-tab L6b)` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-08 — merge: multi-tab-l6b into alfonso-frontend-jjtl (P-2026-11-08-2223)` once (trunk).
   - `docs/log-inbox/notices.md`: the heading `## 2026-11-08 — docs: notices and tips discovery, Phase 1 (P-2026-11-08-2230)` once (trunk).
   - `docs/log-inbox/notices.md`: the heading `## 2026-11-09 — ticket: donation banner ignores the right rail in the editor` once (trunk).
   - `docs/log-inbox/notices.md`: the heading `## 2026-11-09 — ticket: .notification-header is global and reaches the JjScript success notification` once (trunk).
   - `docs/log-inbox/notices.md`: the heading `## 2026-11-09 — ticket: Properties overlay covers the Help menu in the editor` once (trunk).
   - `docs/log-inbox/notices.md`: the heading `## 2026-11-09 — feat: notices and tips Phase 2, banner, tips card, tips browser (P-2026-11-08-2340)` once (trunk).
   - `docs/log-inbox/notices.md`: the heading `## 2026-11-09 — chore: notices Phase 2 closure, gates, stale probe, tickets (P-2026-11-09-0036)` once (trunk).
   - `docs/log-inbox/notices.md`: the heading `## 2026-11-09 — merge: notices-discovery into alfonso-frontend-jjtl (P-2026-11-09-0930)` once (trunk).
4. `git merge --no-ff --no-commit dc070e33d`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: textual-d6-pinned-hover into alfonso-frontend-jjtl (P-2026-11-09-1001)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `dc070e33d` in `/Users/alfonso/jjodel-w-textd6`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-textd6`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 733a67020` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only 733a67020 HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/codegen.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the textual-d6-pinned-hover merge (P-2026-11-09-1001)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-textd6`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
