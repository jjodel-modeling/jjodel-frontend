# Prompt: merge cg-generators into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-30-2200
Chat: —
Request: none (rendered by lane-run, no chat URL known for no --chat)
Lane: full (merge; zero conflicts measured)
Status: eseguito 2026-10-30 · lane merge · 52ff81621 · verifica visiva passata 2026-10-30 (3001 answers 200; branch probes on the same tree (cg-generators 5fdf3dc7a): codegen-leftbar ALL GREEN (GENERATORS above SCRIPTS), codegen-generator-tab ALL GREEN after 213b368a8; trunk merge clean, all gates green)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-30-2200 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `ab864b9b8`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `cg-generators` into the trunk with one merge commit, `--no-ff`, of the explicit sha `5fdf3dc7a`, in the shape of `3e2ae556e` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `9606c352a`. The branch carries, on top of the base, 60 commits:

- `5fdf3dc7a` docs: Status flip and log entry, cg-generators took the trunk (P-2026-10-30-1510)
- `213b368a8` fix(codegen): beside panel outranks the split cap again (P-2026-10-30-1510)
- `b38dccdac` fix(codegen): GENERATORS above SCRIPTS in the left bar (P-2026-10-30-1510)
- `574429a0f` merge: cg-generators takes alfonso-frontend-jjtl (P-2026-10-30-1510)
- `1dba845df` docs: add prompt P-2026-10-30-1510, merge alfonso-frontend-jjtl into cg-generators
- `87cbac5b7` docs(codegen): record Alfonso visual GO on cg-generators
- `1b8135c1a` docs: log 1510, flip its Status line (P-2026-10-25-1510)
- `8cf2bc758` test(codegen): probe one tab bar beside the canvas (P-2026-10-25-1510)
- `8e474b79a` fix(codegen): hide the nested rc-dock bar of the codegen panel (P-2026-10-25-1510)
- `214e5484e` fix(codegen): beside the canvas the tab is in the app bar, content only (P-2026-10-25-1510)
- `30bdd2573` docs: add prompt P-2026-10-25-1510, beside tab in the app bar
- `df26ad2c9` docs: log 1355 and 1441, flip both Status lines (P-2026-10-25-1441)
- `6a34b2104` test(codegen): probe the SELECT_NODE reveal on a narrowed canvas (P-2026-10-25-1441)
- `10abb57b3` fix(editor): SELECT_NODE centres on the flow viewport, stays if visible (P-2026-10-25-1441)
- `6ca598d5f` docs: renumber prompt P-2026-10-25-1435 to 1441 (id taken by another chat)
- `01cf6d3b8` docs: add prompt P-2026-10-25-1435, SELECT_NODE reveal (completes 1355)
- `d88d939bd` test(codegen): probe the divider beside the generator tab (P-2026-10-25-1355)
- `f141bb614` fix(codegen): a 7px grab area for the divider beside a generator tab (P-2026-10-25-1355)
- `2e436f68c` docs: add prompt P-2026-10-25-1355, divider and reveal on click
- `827818efc` docs(codegen): pill moves the tab beside, log entry, Status flip (P-2026-10-25-1310)
- `ddff3f6fc` test(codegen): probe the finding's sequence, pill and fragment beside (P-2026-10-25-1310)
- `007c4e106` fix(codegen): from a canvas the generator tab moves beside it (P-2026-10-25-1310)
- `68abdf93e` docs: add prompt P-2026-10-25-1310, pill moves the generator tab beside
- `0aadc69ef` docs(codegen): app-bar generator tab log entry, Status flip (P-2026-10-25-1200)
- `115cdbddd` test(codegen): probe the generator tab in the app bar and beside (P-2026-10-25-1200)
- `93cbd14fd` fix(codegen): generator tab in the app bar when no canvas is docked (P-2026-10-25-1200)
- `9c01225b6` docs: add prompt P-2026-10-25-1200, generator tab in the app bar
- `421c4391a` docs(codegen): tab header log entry, Status flip (P-2026-10-25-1045)
- `21cbf99e6` fix(codegen): generator tab with its header, scoped fragment highlight (P-2026-10-25-1045)
- `3aa7919c5` docs: add prompt P-2026-10-25-1045, tab header and fragment scope
- `47cebe9e2` docs(codegen): rail auto-collapse log entry, Status flip (P-2026-10-25-0925)
- `dd1b87b96` fix(codegen): Properties collapses beside a generator tab (P-2026-10-25-0925)
- `b9ed34b0d` docs: add prompt P-2026-10-25-0925, Properties auto-collapse
- `1518c11c0` docs(codegen): syntax colouring log entry, Status flip (P-2026-10-24-1516)
- `4cc4da0b6` feat(codegen): syntax colouring of the generated text (P-2026-10-24-1516)
- `09af5d200` docs(codegen): tab beside the canvas log entry, Status flips (P-2026-10-24-1630)
- `f0c8c77f7` test(codegen): probe crops the rail beside the tab, splitter in its tab (P-2026-10-24-1630)
- `81ed10a75` fix(codegen): splitter follows the pointer, minimums on outer widths (P-2026-10-24-1630)
- `826a0f6bc` fix(codegen): generator tab beside the canvas, resizable columns (P-2026-10-24-1515)
- `e4cc99dc6` docs: add prompt P-2026-10-24-1630, completion of 1515
- and 20 more: `git log --oneline 9606c352a..5fdf3dc7a`

The trunk carries, since the base, 45 commits:

- `ab864b9b8` docs: Status flip and log entry for a direct merge (P-2026-10-30-2149)
- `3e2ae556e` merge: jjtl-nested-materialization into alfonso-frontend-jjtl (P-2026-10-30-2149)
- `e74d12078` docs: add prompt P-2026-10-30-2149, merge jjtl-nested-materialization into alfonso-frontend-jjtl
- `49a89c430` docs(log): ticket entries #367 and #368 (C-2026-10-30-1253)
- `80d016562` docs: Status flips and log entry, nested materialization (P-2026-10-30-1545)
- `62301b8e5` docs(jjtl): SPEC §9.2, nested creations to any depth (P-2026-10-30-1440)
- `e169b2bf3` fix(jjtl): materialize nested creations to any depth (P-2026-10-30-1440)
- `263e86492` docs(prompts): P-2026-10-30-1545 nested materialization closure
- `bb04b8737` merge: origin/staging into alfonso-frontend-jjtl (C-2026-10-30-1529)
- `7d12f5232` docs(decisions): R-S1-6 JjTL output bypasses the R-S1-2 name guard
- `db39dfaf5` docs(discovery): JjTL nested materialization, Phase 1 report and LIR (P-2026-10-30-1440)
- `77b2af9b8` docs(prompts): P-2026-10-30-1440 nested materialization, Phase 1 cont.
- `ad73e5f39` docs: log entry, dotnet-backend-integration merge (C-2026-10-29-1805)
- `5dbd55dc7` merge: origin/dotnet-backend-integration into staging (C-2026-10-29-1805)
- `ead81b47e` docs: Status flip and log entry for the feat/186-customize-element merge (P-2026-10-29-1720)
- `b5e914168` merge: feat/186-customize-element into staging (P-2026-10-29-1720)
- `1ac0d22fe` docs: add prompt P-2026-10-29-1720, merge feat/186-customize-element into staging
- `b1d105144` docs(#186): lane closure, entry and Status (P-2026-10-17-1053)
- `57c5e8e27` feat(#186): Customize element in Roles, the popup (P-2026-10-17-1053)
- `008991364` feat(#186): the Configurator panel reads the role's presentation (P-2026-10-17-1053)
- `c34713aac` docs: Status flip and log entry, feat/186-customize-element took trunk (P-2026-10-27-1449)
- `87b540ece` merge: feat/186-customize-element takes staging (P-2026-10-27-1449)
- `385480445` docs: add prompt P-2026-10-27-1449, merge staging into feat/186-customize-element
- `a334addac` docs: Status flip and log entry for the fix/187-tmaog-round1 merge (P-2026-10-27-1438)
- `1beb964eb` merge: fix/187-tmaog-round1 into staging (P-2026-10-27-1438)
- `9503df51a` docs: add prompt P-2026-10-27-1438, merge fix/187-tmaog-round1 into staging
- `dfab20207` docs(#187): lane closure, entry and Status (P-2026-10-20-1123)
- `5fbfb68aa` Merge pull request #195 from jjodel-modeling/alfonso-frontend-jjtl
- `4bdf69ed6` feat(#186): Cancel and arrows in the Endpoints window (P-2026-10-20-1123)
- `669ac5e65` fix(#187): the Configurator remembers the instance of each type (P-2026-10-20-1123)
- `0fd775d28` fix(#187): the element on screen extends its components (P-2026-10-20-1123)
- `dacdb8a31` merge: origin/staging (PR #191) into local staging (C-2026-10-14-1020)
- `dd23b757e` fix(#187): a remove on every single reference, Save's look (P-2026-10-20-1123)
- `23be59136` docs(#186): LIR addendum, the emitted field measured (P-2026-10-17-1053)
- `f2867dc3d` feat(#186): optional typePresentation on DProfile (P-2026-10-17-1053)
- `20c8b4a54` docs(#186): Layer Impact Report, typePresentation on DProfile (P-2026-10-17-1053)
- `492546b1c` feat(#186): typePresentation helpers and CSS sanitiser (P-2026-10-17-1053)
- `e9c5f232e` docs(#187): Phase 1 report after @tmaog's test (P-2026-10-20-1123)
- `28467e73f` docs(#186): Phase 1 report on Customize element (P-2026-10-17-1053)
- `850d50359` docs: add prompt P-2026-10-20-1123, #187 #186 after @tmaog's test
- and 5 more: `git log --oneline 9606c352a..ab864b9b8`

Measured by `lane-run merge` at 2026-10-30 22:00, trunk at `ab864b9b8`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 5fdf3dc7a`: zero conflicts.
- Files changed since the base: 57 on the branch side, 43 on the trunk side; on both sides: `docs/decisions.md`.
- `git diff --name-only 9606c352a 5fdf3dc7a -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-10-24_0000_prompt_codegen_decisions_port.md` (eseguito 2026-10-24 · lane codegen · 0b05fb9ad · rows 19..43), `claude_2026-10-24_0001_prompt_codegen_g1_generator_codec.md` (eseguito 2026-10-24 · lane codegen · f41de8b23 · bench 6/6), `claude_2026-10-24_0002_prompt_codegen_g2_generate_files.md` (eseguito 2026-10-24 · lane codegen · 8bdead3c5 · bench 5/5), `claude_2026-10-24_0003_prompt_codegen_g3_generator_tab.md` (eseguito 2026-10-24 · lane codegen · e4be12d09 · completed by P-2026-10-24-0045), `claude_2026-10-24_0004_prompt_codegen_g4_leftbar_generators.md` (eseguito 2026-10-24 · lane codegen · 51620011c · bench 10/10 · crops in the lane folder), `claude_2026-10-24_0045_prompt_codegen_g3_completion.md` (eseguito 2026-10-24 · lane codegen · 8e598441f · bench 7/7 · crops in the lane folder), `claude_2026-10-24_0318_prompt_codegen_empty_generator_state.md` (eseguito 2026-10-24 · lane codegen · eae105d89 · bench 4/4 · crops in the lane folder), `claude_2026-10-24_1515_prompt_codegen_tab_beside_canvas.md` (eseguito 2026-10-24 · lane codegen · 826a0f6bc · completed by P-2026-10-24-1630), `claude_2026-10-24_1516_prompt_codegen_generated_syntax_colours.md` (eseguito 2026-10-25 · lane codegen · 4cc4da0b6 · bench 8/8 · crops in the lane folder), `claude_2026-10-24_1630_prompt_codegen_tab_beside_canvas_completion.md` (eseguito 2026-10-24 · lane codegen · f0c8c77f7 · bench 8/8 · crops in the lane folder), `claude_2026-10-25_0925_prompt_codegen_properties_autocollapse.md` (eseguito 2026-10-25 · lane codegen · dd1b87b96 · bench 9/9 · crops in the lane folder), `claude_2026-10-25_1045_prompt_codegen_tab_header_and_fragment_scope.md` (eseguito 2026-10-25 · lane codegen · 21cbf99e6 · bench 8/8 · crops in the lane folder · committed by the chat after the context ceiling), `claude_2026-10-25_1200_prompt_codegen_generator_in_app_bar.md` (eseguito 2026-10-25 · lane codegen · 93cbd14fd · bench 7/7 · crops in the lane folder), `claude_2026-10-25_1310_prompt_codegen_pill_moves_tab_beside.md` (eseguito 2026-10-25 · lane codegen · 007c4e106 · bench 7/7 · crops in the lane folder), `claude_2026-10-25_1355_prompt_codegen_divider_and_reveal.md` (eseguito 2026-10-25 · lane codegen · f141bb614 · item 2 completed by P-2026-10-25-1441), `claude_2026-10-25_1441_prompt_codegen_select_node_reveal.md` (eseguito 2026-10-25 · lane codegen · 10abb57b3 · bench 8/8 · crops in the lane folder), `claude_2026-10-25_1510_prompt_codegen_beside_tab_in_app_bar.md` (eseguito 2026-10-25 · lane codegen · 214e5484e · bench 5/5 · crops in the lane folder), `claude_2026-10-30_1510_prompt_cg-generators_take_trunk.md` (eseguito 2026-10-30 · lane cg-generators · 574429a0f · verifica visiva passata 2026-10-30 (chat, unattended; Alfonso in the morning digest)).
- `git worktree list`: `cg-generators` in `/Users/alfonso/jjodel-w-cggen`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-10-30-2200/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `5fdf3dc7a` is the tip of `cg-generators`; the prompt files of the branch read `Status: eseguito` at `5fdf3dc7a`; `git worktree list` shows `cg-generators` only in `/Users/alfonso/jjodel-w-cggen`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 5fdf3dc7a` (measured above: zero conflicts). `git diff --name-only 9606c352a 5fdf3dc7a -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 9606c352a alfonso-frontend-jjtl` with `git diff --name-only 9606c352a 5fdf3dc7a` (measured above: `docs/decisions.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-GEN-19` (branch), `R-GEN-20` (branch), `R-GEN-21` (branch), `R-GEN-22` (branch), `R-GEN-23` (branch), `R-GEN-24` (branch), `R-GEN-25` (branch), `R-GEN-26` (branch), `R-GEN-27` (branch), `R-GEN-28` (branch), `R-GEN-29` (branch), `R-GEN-30` (branch), `R-GEN-31` (branch), `R-GEN-32` (branch), `R-GEN-33` (branch), `R-GEN-34` (branch), `R-GEN-35` (branch), `R-GEN-36` (branch), `R-GEN-37` (branch), `R-GEN-38` (branch), `R-GEN-39` (branch), `R-GEN-40` (branch), `R-GEN-41` (branch), `R-GEN-42` (branch), `R-GEN-43` (branch); control: `- **R-GEN-44**` none.
   - `docs/log-inbox/codegen.md`: the heading `## 2026-10-24 — docs(decisions): R-GEN-19..43 to the register (P-2026-10-24-0000)` once (branch).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-10-24 — feat(codegen): generator codec, genGenerators beside genTemplates (P-2026-10-24-0001)` once (branch).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-10-24 — feat(codegen): generation per file with the generator's target (P-2026-10-24-0002)` once (branch).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-10-24 — ticket: codegen-panel.ts probe drives the removed floating panel` once (branch).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-10-24 — feat(codegen): generator tab, panel as launcher, two-way provenance (P-2026-10-24-0003, P-2026-10-24-0045)` once (branch).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-10-24 — feat(codegen): GENERATORS section in the project left bar (P-2026-10-24-0004)` once (branch).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-10-24 — fix(codegen): empty state for a generator with no templates (P-2026-10-24-0318)` once (branch).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-10-24 — fix(codegen): generator tab beside the canvas, resizable columns (P-2026-10-24-1515, P-2026-10-24-1630)` once (branch).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-10-25 — feat(codegen): syntax colouring of the generated text (P-2026-10-24-1516)` once (branch).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-10-25 — fix(codegen): Properties collapses beside a generator tab (P-2026-10-25-0925)` once (branch).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-10-25 · fix: generator tab with its header, scoped fragment highlight (P-2026-10-25-1045)` once (branch).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-10-25 — fix(codegen): generator tab in the app bar when no canvas is docked (P-2026-10-25-1200)` once (branch).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-10-25 — fix(codegen): from a canvas the generator tab moves beside it (P-2026-10-25-1310)` once (branch).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-10-25 — fix(codegen): divider grab area, SELECT_NODE reveal beside a generator tab (P-2026-10-25-1355, P-2026-10-25-1441)` once (branch).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-10-25 — fix(codegen): beside the canvas the generator tab is in the app bar (P-2026-10-25-1510)` once (branch).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-10-30 — merge: cg-generators takes alfonso-frontend-jjtl (P-2026-10-30-1510)` once (branch).
   - `docs/log-inbox/configurator-panel.md`: the heading `## 2026-10-27 — fix(#187, #186): the Configurator after @tmaog's test, R-CFG-6..9` once (trunk).
   - `docs/log-inbox/configurator-panel.md`: the heading `## 2026-10-27 — merge: fix/187-tmaog-round1 into staging (P-2026-10-27-1438)` once (trunk).
   - `docs/log-inbox/customize-element.md`: the heading `## 2026-10-28 — merge: feat/186-customize-element takes staging (P-2026-10-27-1449)` once (trunk).
   - `docs/log-inbox/customize-element.md`: the heading `## 2026-10-29 — feat(#186): Customize element, the per-role presentation of a type` once (trunk).
   - `docs/log-inbox/customize-element.md`: the heading `## 2026-10-29 — merge: feat/186-customize-element into staging (P-2026-10-29-1720)` once (trunk).
   - `docs/log-inbox/jjtl-nested-materialization.md`: the heading `## 2026-10-30 — fix(jjtl): materialize nested creations to any depth (P-2026-10-30-1440)` once (trunk).
   - `docs/log-inbox/jjtl-nested-materialization.md`: the heading `## 2026-10-30 — merge: jjtl-nested-materialization into alfonso-frontend-jjtl (P-2026-10-30-2149)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-10-30 — ticket: JjTL: a transformation run is many undo steps, not one` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-10-30 — ticket: Rename via the $name slot bypasses the R-S1-2 same-name guard` once (trunk).
   - `docs/log-inbox/merge-dotnet-backend.md`: the heading `## 2026-10-29 — merge: origin/dotnet-backend-integration into staging (C-2026-10-29-1805)` once (trunk).
4. `git merge --no-ff --no-commit 5fdf3dc7a`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: cg-generators into alfonso-frontend-jjtl (P-2026-10-30-2200)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `5fdf3dc7a` in `/Users/alfonso/jjodel-w-cggen`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-cggen`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard ab864b9b8` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only ab864b9b8 HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/codegen.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the cg-generators merge (P-2026-10-30-2200)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-cggen`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
