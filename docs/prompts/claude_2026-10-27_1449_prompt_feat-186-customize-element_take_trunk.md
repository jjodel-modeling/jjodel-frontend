# Prompt: feat/186-customize-element takes the trunk before its own merge

Prompt-ID: P-2026-10-27-1449
Chat: C-2026-10-14-1020
Lane: full (merge of the trunk into the branch; zero conflicts measured)
Status: da eseguire

Worktree: `/Users/juridirocco/development/jjodel-186c`, branch `feat/186-customize-element`, a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/juridirocco/development/jjodel-186c`, branch `feat/186-customize-element`, `git log -1` is the commit that adds this file (its parent `23be59136`), `git status` empty apart from gitignored `frontend/scripts/smoke/_tmp_*`, `MERGE_HEAD` absent. Otherwise stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-27-1449 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

## COSA

RC-14: a branch resolves its conflicts with the trunk on the branch, before the trunk takes it. Bring the trunk `staging` at the explicit sha `a334addac` into `feat/186-customize-element` with one merge commit, `--no-ff`, in the shape of `df67afbf5` (the last merge commit on `feat/186-customize-element`; read its body first). Merge base `4fe736878`. The trunk brings, since the base, 151 commits:

- `a334addac` docs: Status flip and log entry for the fix/187-tmaog-round1 merge (P-2026-10-27-1438)
- `1beb964eb` merge: fix/187-tmaog-round1 into staging (P-2026-10-27-1438)
- `9503df51a` docs: add prompt P-2026-10-27-1438, merge fix/187-tmaog-round1 into staging
- `dfab20207` docs(#187): lane closure, entry and Status (P-2026-10-20-1123)
- `4bdf69ed6` feat(#186): Cancel and arrows in the Endpoints window (P-2026-10-20-1123)
- `669ac5e65` fix(#187): the Configurator remembers the instance of each type (P-2026-10-20-1123)
- `0fd775d28` fix(#187): the element on screen extends its components (P-2026-10-20-1123)
- `dacdb8a31` merge: origin/staging (PR #191) into local staging (C-2026-10-14-1020)
- `dd23b757e` fix(#187): a remove on every single reference, Save's look (P-2026-10-20-1123)
- `e9c5f232e` docs(#187): Phase 1 report after @tmaog's test (P-2026-10-20-1123)
- `850d50359` docs: add prompt P-2026-10-20-1123, #187 #186 after @tmaog's test
- `26c2814ef` docs(#166): R-CFG-6..9 from @tmaog's test (C-2026-10-14-1020)
- `3da1d6348` Merge pull request #191 from jjodel-modeling/alfonso-frontend-jjtl
- `8b58b9323` merge: rule-triggers into alfonso-frontend-jjtl (P-2026-10-18-1502)
- `6b690051e` docs: Status flip and log entry for the ai-models-dynamic merge (P-2026-10-18-1457)
- `c99eafe84` docs: add prompt P-2026-10-18-1502, merge rule-triggers into alfonso-frontend-jjtl
- `87feac64a` docs(prompts): auth page redesign prompt (P-2026-10-18-1500)
- `fd9da9bef` merge: ai-models-dynamic into alfonso-frontend-jjtl (P-2026-10-18-1457)
- `498606f95` docs: add prompt P-2026-10-18-1457, merge ai-models-dynamic into alfonso-frontend-jjtl
- `abcff0f69` docs: Status and log entry for slices c1, c2, d (P-2026-10-18-1146)
- `2a9ff5f02` feat(ai): live OpenAI and Gemini catalogs, tests as GET models (P-2026-10-18-1146)
- `7044b6812` feat(ai): model picker shows newest per family, older on demand (P-2026-10-18-1146)
- `b8b2724de` feat(ai): live Anthropic model catalog, test connection as GET models (P-2026-10-18-1146)
- `a3ec93534` docs: add prompt P-2026-10-18-1428, lane board kind badge
- `bf2d67848` docs: B4 trigger map, gates.md, log entry and Status (P-2026-10-18-1420)
- `71a932b8f` feat(harness): rule-trigger hook, trigger map and check:triggers (P-2026-10-18-1420)
- `ce534749c` docs: add prompt P-2026-10-18-1420, B4 rule triggers
- `e2b45de14` docs: Status flips for P-2026-10-18-0045 (closed) and P-2026-10-18-0105 (abandoned)
- `f891af6ed` docs: bring the AI providers discovery report onto the trunk (P-2026-10-18-0045)
- `6f21730ac` docs: Status flip and log entry for the lane-run-routing merge (P-2026-10-18-1305)
- `c991ce637` merge: lane-run-routing into alfonso-frontend-jjtl (P-2026-10-18-1305)
- `171c24c09` docs: session checkpoint of chat C-2026-10-17-1757 (harness front)
- `8862787ef` docs: add prompt P-2026-10-18-1305, merge lane-run-routing into alfonso-frontend-jjtl
- `6a1e96adf` test(harness): live-register row count is a floor, the register is append-only
- `a99f88b4c` merge: lane-board-arch into alfonso-frontend-jjtl (P-2026-10-18-1255)
- `1ad48c983` docs: add prompt P-2026-10-18-1255, merge lane-board-arch into alfonso-frontend-jjtl
- `cfab9b74b` docs(decisions): RC-50, the AM-8 context ceiling also binds the architect
- `b9dd4290c` docs: Status flip and log entry for the ai-models-discovery merge (P-2026-10-18-1226)
- `67320b999` merge: ai-models-discovery into alfonso-frontend-jjtl (P-2026-10-18-1226)
- `cffbf13db` docs: add prompt P-2026-10-18-1226, merge ai-models-discovery into alfonso-frontend-jjtl
- and 111 more: `git log --oneline 4fe736878..a334addac`

This branch brings, 6 commits:

- `23be59136` docs(#186): LIR addendum, the emitted field measured (P-2026-10-17-1053)
- `f2867dc3d` feat(#186): optional typePresentation on DProfile (P-2026-10-17-1053)
- `20c8b4a54` docs(#186): Layer Impact Report, typePresentation on DProfile (P-2026-10-17-1053)
- `492546b1c` feat(#186): typePresentation helpers and CSS sanitiser (P-2026-10-17-1053)
- `28467e73f` docs(#186): Phase 1 report on Customize element (P-2026-10-17-1053)
- `2c1e694e4` docs: add prompt P-2026-10-17-1053, #186 Customize element

Measured by `lane-run merge --trunk-into` at 2026-10-27 14:49, trunk at `a334addac`:

- `git merge-tree --write-tree --name-only feat/186-customize-element a334addac`: zero conflicts.
- Files changed since the base: 6 on the branch side, 160 on the trunk side; on both sides: none.
- `git diff --name-only 4fe736878 23be59136 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-10-17_1053_prompt_186_customize_element.md` (da eseguire).
- `git worktree list`: `feat/186-customize-element` in `/Users/juridirocco/development/jjodel-186c`; `staging` in `/Users/juridirocco/development/jjodel`.

## COME

1. Preconditions above, plus: `a334addac` is the tip of `staging` (if a docs-only commit moved it, say so and merge `a334addac` all the same); `git worktree list` shows `staging` only in `/Users/juridirocco/development/jjodel`.
2. Measure again: `git merge-tree --write-tree --name-only feat/186-customize-element a334addac` (measured above: zero conflicts). A conflict in any file outside `docs/decisions.md` and `docs/log-inbox/*.md`: **stop** with `Outcome: question` and the conflict hunks quoted; do not resolve code by hand in this lane.
3. `git merge --no-ff --no-commit a334addac`.
4. Resolve `docs/decisions.md`, if it conflicts, by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block, each section heading once. Resolve every `docs/log-inbox/*.md` that conflicts by union: preamble, the trunk's entries, then the branch's entries, all verbatim, each heading once. Probes on the resolved tree, each counted with `grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `RC-49` (trunk), `RC-50` (trunk), `R-REL-1` (trunk); control: `- **R-REL-2**` none.
   - `docs/decisions.md`: the heading `## R-REL — release scope (decision 2026-10-11)` once (trunk).
   - `docs/log-inbox/configurator-panel.md`: the heading `## 2026-10-27 — fix(#187, #186): the Configurator after @tmaog's test, R-CFG-6..9` once (trunk).
   - `docs/log-inbox/configurator-panel.md`: the heading `## 2026-10-27 — merge: fix/187-tmaog-round1 into staging (P-2026-10-27-1438)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-16 — docs(harness): lean context and model routing discovery and ratification (P-2026-10-15-1725)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-18 — chore(harness): B0, output-budget registered, effort high, Explore on Sonnet (P-2026-10-17-1945)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-18 — feat(harness): B1, lane-usage.mjs measures plan usage and per-call context; merge templates through the runner (P-2026-10-18-0100)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-18 — merge: lane-usage into alfonso-frontend-jjtl (P-2026-10-18-0153)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-18 — fix: parseRows reads the whole live register (P-2026-10-18-1030)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-18 — merge: digest-tolerant into alfonso-frontend-jjtl (P-2026-10-18-1033)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-18 — feat(harness): B2, decisions and log:find read the register and the log by ID (P-2026-10-18-0945)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-18 — ticket: parseRows does not read paragraph-form rows of the register` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-18 — merge: selective-reads into alfonso-frontend-jjtl (P-2026-10-18-1108)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-18 — feat(harness): B3b, lane board shows tokens in, out, total and context max per lane (P-2026-10-18-1045)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-18 — merge: lane-board-tokens into alfonso-frontend-jjtl (P-2026-10-18-1116)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-18 — feat(harness): Arch column, the lane board and lane-usage show the architect's tokens per lane (P-2026-10-18-1155)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-18 — feat(harness): B3a, lane-run records effort and model per launch, injects cited decisions and log entries (P-2026-10-18-1205)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-18 — merge: lane-run-routing into alfonso-frontend-jjtl (P-2026-10-18-1305)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-18 — feat(harness): B4, rule-trigger hook, trigger map and check:triggers (P-2026-10-18-1420)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-18 — ticket: lane-run start does not yet append a «Rules in scope» block from the DOVE globs` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-10-18 — fix(notifications): API_URL points at the renamed workers.dev host (P-2026-10-18-1145)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-10-18 — merge: notif-url into alfonso-frontend-jjtl (P-2026-10-18-1158)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-10-18 — discovery: AI proxy Worker back in the trunk, configurable proxy URL, dynamic model lists (P-2026-10-18-1146)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-10-18 — feat: AI proxy Worker in the trunk with the origin fix and models routes; proxy URL from VITE_AI_PROXY_URL (P-2026-10-18-1146)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-10-18 — merge: ai-models-discovery into alfonso-frontend-jjtl (P-2026-10-18-1226)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-10-18 — feat: dynamic model lists for Anthropic, OpenAI and Gemini; connection test as GET models (P-2026-10-18-1146)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-10-18 — merge: ai-models-dynamic into alfonso-frontend-jjtl (P-2026-10-18-1457)` once (trunk).
   - `docs/log-inbox/release-3-1-codegen.md`: the heading `## 2026-10-12 — feat(codegen): VITE_CODEGEN build flag hides the generator (P-2026-10-12-0012)` once (trunk).
   - `docs/log-inbox/release-3-1-da1.md`: the heading `## 2026-10-15 — discovery: D-A1, «Add» under a graphVertex container (P-2026-10-15-1710)` once (trunk).
   - `docs/log-inbox/release-3-1-drag.md`: the heading `## 2026-10-12 — fix: useAutoAnchor reads the nodes at call time, drag-loop Fix A (P-2026-10-12-0011)` once (trunk).
   - `docs/log-inbox/release-3-1-fixture.md`: the heading `## 2026-10-12 — test: a 3.0.0 save pinned through the VersionFixer chain (P-2026-10-12-0116)` once (trunk).
   - `docs/log-inbox/release-3-1-sync.md`: the heading `## 2026-10-16 — merge: origin trunk, da1-disc and staging into rel31-sync, D-A1 fixed (P-2026-10-16-1000)` once (trunk).
   - `docs/log-inbox/release-3-1-version.md`: the heading `## 2026-10-12 — chore(release): 3.1.0, CHANGELOG, R-REL-1 and RC-23 crops (P-2026-10-12-0115)` once (trunk).
   - `docs/log-inbox/release-3-1-welcome.md`: the heading `## 2026-10-17 — feat(welcome): 3.1 what's new screen with a recall of 3.0 (P-2026-10-17-0040)` once (trunk).
   - `docs/log-inbox/release-3-1-welcome.md`: the heading `## 2026-10-17 — ticket: the smoke seeds only the 3.0 welcome key, so the 3.1 modal blocks every smoke state` once (trunk).
   - `docs/log-inbox/release-3-1.md`: the heading `## 2026-10-12 — merge: origin/staging into rel31-staging, format 2.230 (P-2026-10-12-0010)` once (trunk).
   - `docs/log-inbox/release-3-1.md`: the heading `## 2026-10-12 — ticket: the R-IRN-19 reserved VersionFixer step is now 2.231` once (trunk).
   - `docs/log-inbox/release-3-1.md`: the heading `## 2026-10-11 — discovery: release 3.1 scope and readiness (P-2026-10-11-1812)` once (trunk).
   - `docs/log-inbox/release-3-1.md`: the heading `## 2026-10-11 — ticket: a trunk build cannot open a project saved on beta (format 2.230)` once (trunk).
5. On the resolved tree, before committing, read every file changed on both sides once from top to bottom (none); an auto-merge is a textual result, not a semantic one: no conflict marker, no duplicated declaration, hook or selector, one root per component.
6. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: feat/186-customize-element takes staging (P-2026-10-27-1449)`. Body: the two sides' shas, the merge-tree measurement, the union resolutions, the reading of step 5, `Model:` and `Co-Authored-By` trailers.
7. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: state the expectation first as the trunk tip's count (measure it read-only in `/Users/juridirocco/development/jjodel` with `npx vitest run --reporter=dot`; do not write there) plus the tests this branch added, 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 23be59136` (this branch's own pre-merge tip; the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 8.
8. `Outcome: hard-stop`: the chat re-runs the visual probes of the branch on this tree and gives the GO. Do not start a server.
9. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane feat/186-customize-element · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of the `docs/log-inbox/` file of this branch's front (the branch adds headings to none), both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry, feat/186-customize-element took the trunk (P-2026-10-27-1449)` (P16, RC-17). `Outcome: done`. The merge of `feat/186-customize-element` into the trunk gets its own prompt (`lane-run merge feat/186-customize-element --into staging`).

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 7), `git checkout -- .`, `git clean`, `--no-verify`, a hand edit to a code file, editing any line inside a decision block or a log entry, rebase, squash, push, any other tree except the read-only vitest count in `/Users/juridirocco/development/jjodel`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge --trunk-into` from `frontend/scripts/lane-templates/trunk-into-branch.md`, in the shape of `claude_2026-09-27_0325_prompt_sim_profiles_take_trunk.md`.
