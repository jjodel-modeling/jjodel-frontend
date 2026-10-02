# Prompt: merge staging-sync into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-01-2344
Chat: C-2026-10-01-2220
Lane: full (merge; zero conflicts measured)
Status: ✅ completed (closed by hand by the chat, red gates load-induced vitest and Check D before rotation)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-01-2344 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `4b9bc5836`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `staging-sync` into the trunk with one merge commit, `--no-ff`, of the explicit sha `076d7da3a`, in the shape of `93dd39879` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `ac3890b7e`. The branch carries, on top of the base, 44 commits:

- `076d7da3a` docs: Status lines on the two #157 prompts from staging (P-2026-10-01-2240)
- `1ec09b9f6` docs: staging-sync Phase 2 addendum, log entry, Status (P-2026-10-01-2240)
- `fdfd89ddd` merge: origin/staging into staging-sync (P-2026-10-01-2240)
- `298ce7242` docs: staging-sync Phase 1 report, merge of origin/staging (P-2026-10-01-2240)
- `ddd70a1be` docs: add prompt P-2026-10-01-2240, reintegrate origin/staging on a branch
- `98ebb132e` docs(#157): log-inbox entry for R3 and the corrected test guide
- `3ae38ec33` fix(#157): only root-creatable types get New and can be marked (R3)
- `ef8defa3b` docs(#157): discovery of R3, top-level types must be root-creatable
- `5dc9246b7` docs(#157): log-inbox entry for R5, consumer lands on the Configurator
- `984eb7e1b` feat(#157): the stand-alone link lands on the Configurator (R5)
- `f404550ec` docs(#157): discovery of R5, the consumer lands on the Configurator
- `b4620f3ed` docs(#157): log-inbox entry for the Playwright verification and fix
- `6d35280cd` fix(#157): «Create model» keeps the Configurator open
- `bd74454e3` docs(#157 #158): log-inbox entries for the re-test follow-ups
- `a48ac55c0` fix(#158): Back returns to the form on screen; row click toggles graph
- `dd5fc3663` fix(#157): environment changes mark the project unsaved; Done saves
- `6b7891bae` fix(#157): the Configurator creates and lists each type in its models
- `8ec6bf30a` docs(#157 #158): discovery of the follow-ups to @tmaog's re-test
- `b82d661e8` minor
- `c73d007f6` docs(#157): log-inbox entry for the shared instance detail
- `2b212dd99` feat(#157): the stand-alone detail is the Data Manager's, navigable
- `1447e5860` refactor(#157): extract the Data Manager detail panel as InstanceDetail
- `53fbd30d4` docs(#157): plan for one instance detail in stand-alone and Data Manager
- `ae2347d4c` merge: feat/158-data-manager-ux into feat/157-environment-config
- `1c077a559` Merge branch 'feat/157-environment-config' of https://github.com/MDEGroup/jjodel into feat/157-environment-config
- `07f65237b` Merge pull request #164 from jjodel-modeling/fix/147-custom-provider-model
- `b7b1fddb9` Merge pull request #163 from jjodel-modeling/feat/158-data-manager-ux
- `d3a650a11` Merge pull request #162 from jjodel-modeling/feat/157-environment-config
- `c634cc529` docs(#158): log-inbox entry for the Data Manager UX lane
- `a510b26d5` fix(#158): the neighborhood of the selected row can be closed
- `9d3d559f4` feat(#158): key fields of a referenced element in the Data Manager
- `5c3384fef` fix(#158): reference sections for inline children in the Data Manager
- `f8c682f81` fix(#158): collapsible and resizable side panes in the Data Manager
- `c25eb749d` feat(#158): Back from a drill-in in the Data Manager form
- `69cdf6586` docs(#158): discovery and plan for the Data Manager UX fixes
- `bf0beea33` docs(#157): log-inbox entry for the R2/R4/R6 field-test fixes
- `178ef4936` fix(#157): Configurator empty states, New hidden on read-only, grouping
- `db1aea725` docs(#157): triage of @tmaog's test feedback + remediation plan
- `0932455b0` Merge pull request #161 from jjodel-modeling/docs/157-standalone-configurator-plan
- `6b4b6e72e` Merge branch 'feat/157-environment-config' into docs/157-standalone-configurator-plan
- and 4 more: `git log --oneline ac3890b7e..076d7da3a`

The trunk carries, since the base, 7 commits:

- `4b9bc5836` docs: close the activity-bar-7 merge by hand, Status and entry (P-2026-10-01-2254)
- `93dd39879` merge: activity-bar-7 into alfonso-frontend-jjtl (P-2026-10-01-2254)
- `31be76056` docs: add prompt P-2026-10-01-2254, merge activity-bar-7 into alfonso-frontend-jjtl
- `b8cdcc5d7` docs: Activity bar 7 px, addendum, R-VP-36, log entry, Status (P-2026-10-01-2230)
- `c3b0556d6` fix(derive): Activity fork and join bar declared 7 px (P-2026-10-01-2230)
- `690ca002e` docs: Activity bar 7 px, Phase 1 discovery report (P-2026-10-01-2230)
- `ff6c01f57` docs: add prompt P-2026-10-01-2230, Activity fork and join bar at 7 px

Measured by `lane-run merge` at 2026-10-01 23:44, trunk at `4b9bc5836`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 076d7da3a`: zero conflicts.
- Files changed since the base: 43 on the branch side, 8 on the trunk side; on both sides: none.
- `git diff --name-only ac3890b7e 076d7da3a -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-09-23_1200_prompt_157_fase0a_environment_config.md` (eseguito 2026-09-23 · staging (Juri Di Rocco, #157), outside this harness; line added at reintegration by the chat (P-2026-10-01-2240)), `claude_2026-09-24_1400_prompt_157_handoff.md` (eseguito 2026-09-24 · staging (Juri Di Rocco, #157), outside this harness; line added at reintegration by the chat (P-2026-10-01-2240)), `claude_2026-10-01_2240_prompt_staging_sync.md` (eseguito 2026-10-01 · lane merge · fdfd89ddd).
- `git worktree list`: `staging-sync` in `/Users/alfonso/jjodel-w-staging`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-10-01-2344/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `076d7da3a` is the tip of `staging-sync`; the prompt files of the branch read `Status: eseguito` at `076d7da3a`; `git worktree list` shows `staging-sync` only in `/Users/alfonso/jjodel-w-staging`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 076d7da3a` (measured above: zero conflicts). `git diff --name-only ac3890b7e 076d7da3a -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only ac3890b7e alfonso-frontend-jjtl` with `git diff --name-only ac3890b7e 076d7da3a` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-VP-36` (trunk); control: `- **R-VP-37**` none.
   - `docs/log-inbox/data-manager-ux.md`: the heading `## 2026-09-28 — feat(#158): Data Manager, Back, side panes, reference sections and summaries, closable neighborhood` once (branch).
   - `docs/log-inbox/data-manager-ux.md`: the heading `## 2026-10-01 — fix(#158): Back torna alla form che era a schermo; il click sulla riga selezionata apre e chiude il vicinato` once (branch).
   - `docs/log-inbox/merge-gate.md`: the heading `## 2026-10-01 — merge: origin/staging into staging-sync (P-2026-10-01-2240)` once (branch).
   - `docs/log-inbox/standalone-environment.md`: the heading `## 2026-09-28 — fix(#157): empty state del Configurator, New nascosto su read-only, raggruppamento per metamodello (R2/R4/R6)` once (branch).
   - `docs/log-inbox/standalone-environment.md`: the heading `## 2026-09-29 — feat(#157): stand-alone e Data Manager condividono il pannello di dettaglio (InstanceDetail)` once (branch).
   - `docs/log-inbox/standalone-environment.md`: the heading `## 2026-10-01 — fix(#157): New per tipo nel modello del suo metamodello; il wizard dichiara il progetto non salvato e Done salva` once (branch).
   - `docs/log-inbox/standalone-environment.md`: the heading `## 2026-10-01 — fix(#157): «Create model» tiene aperto il Configurator; smoke e sonda Playwright sui seguiti del re-test` once (branch).
   - `docs/log-inbox/standalone-environment.md`: the heading `## 2026-10-01 — feat(#157): il link stand-alone atterra sul Configurator (R5)` once (branch).
   - `docs/log-inbox/standalone-environment.md`: the heading `## 2026-10-01 — fix(#157): solo i tipi creabili alla radice hanno «New» e si possono segnare (R3); guida di test corretta (R7)` once (branch).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-01 — fix(derive): Activity fork and join bar declared 7 px (P-2026-10-01-2230)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-01 — merge: activity-bar-7 into alfonso-frontend-jjtl (P-2026-10-01-2254)` once (trunk).
4. `git merge --no-ff --no-commit 076d7da3a`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: staging-sync into alfonso-frontend-jjtl (P-2026-10-01-2344)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `076d7da3a` in `/Users/alfonso/jjodel-w-staging`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 4b9bc5836` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of the `docs/log-inbox/` file of this branch's front (the branch adds headings to `docs/log-inbox/data-manager-ux.md`, `docs/log-inbox/merge-gate.md`, `docs/log-inbox/standalone-environment.md`), both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the staging-sync merge (P-2026-10-01-2344)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-staging`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
