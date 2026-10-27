# Prompt: merge ir-corner-clip into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-02-1501
Chat: C-2026-10-01-2336
Lane: full (merge; 1 conflict: `docs/log-inbox/views.md` measured)
Status: eseguito 2026-10-02 · lane merge · 3db161e62 · verifica visiva passata 2026-10-02 (chat, unattended; Alfonso in the morning digest)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-02-1501 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `c3a9c9ffd`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `ir-corner-clip` into the trunk with one merge commit, `--no-ff`, of the explicit sha `50d87c3ba`, in the shape of `c3a9c9ffd` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `4b9bc5836`. The branch carries, on top of the base, 5 commits:

- `50d87c3ba` docs: Status flip for P-2026-10-01-2336, visual check OK
- `12800ede4` docs: IR corner clip, Phase 2 addendum and log entry (P-2026-10-01-2336)
- `0070222d8` fix(editor-v2): IR node corners and shadow no longer clipped at rest (P-2026-10-01-2336)
- `8cd4adb69` docs: IR rect corner clip, Phase 1 discovery report (P-2026-10-01-2336)
- `acd377629` docs: add prompt P-2026-10-01-2336, IR rect corners clipped at rest

The trunk carries, since the base, 57 commits:

- `c3a9c9ffd` merge: jjscript-run-perf into alfonso-frontend-jjtl (P-2026-10-02-1445)
- `9449073e4` docs: add prompt P-2026-10-02-1445, merge jjscript-run-perf into alfonso-frontend-jjtl
- `d2eb5fb83` docs: rotate the log after the staging-sync merge, inboxes folded (P-2026-10-01-2344)
- `d568745cc` docs: close the staging-sync merge by hand, Status and entry (P-2026-10-01-2344)
- `54a9b0a12` merge: staging-sync into alfonso-frontend-jjtl (P-2026-10-01-2344)
- `58c796e23` docs: add prompt P-2026-10-01-2344, merge staging-sync into alfonso-frontend-jjtl
- `076d7da3a` docs: Status lines on the two #157 prompts from staging (P-2026-10-01-2240)
- `7bd293e37` docs(jjscript): R-JS-7, Phase 2 addendum, log entry, Status (P-2026-10-01-2136)
- `56db69c32` chore(probe): demo-scene dump and tab-switch check (P-2026-10-01-2136)
- `a17444e9d` perf(editor-v2): handles follow only their own node's edges (P-2026-10-01-2136)
- `1ec09b9f6` docs: staging-sync Phase 2 addendum, log entry, Status (P-2026-10-01-2240)
- `fdfd89ddd` merge: origin/staging into staging-sync (P-2026-10-01-2240)
- `298ce7242` docs: staging-sync Phase 1 report, merge of origin/staging (P-2026-10-01-2240)
- `4bbf7e640` fix(jjscript): a retry pass waits for every dependency (P-2026-10-01-2136)
- `ddd70a1be` docs: add prompt P-2026-10-01-2240, reintegrate origin/staging on a branch
- `30eb9136a` docs(jjscript): discovery for the Run slowdown (P-2026-10-01-2136)
- `ea6b53d92` chore(probe): Run slowdown probe, per-dispatch attribution (P-2026-10-01-2136)
- `3b045d6bb` docs: add prompt P-2026-10-01-2136, JjScript Run slowdown lane
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
- and 17 more: `git log --oneline 4b9bc5836..c3a9c9ffd`

Measured by `lane-run merge` at 2026-10-02 15:01, trunk at `c3a9c9ffd`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 50d87c3ba`: 1 conflict: `docs/log-inbox/views.md`.
- Files changed since the base: 5 on the branch side, 61 on the trunk side; on both sides: `docs/log-inbox/views.md`.
- `git diff --name-only 4b9bc5836 50d87c3ba -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-10-01_2336_prompt_ir_corner_clip.md` (eseguito 2026-10-02 · lane ir-corner-clip · 0070222d8, 12800ede4 · Q1 adopted as recommended (irSelectionRing.test.ts in scope) · verifica visiva della chat sui crop OK (corners whole at rest, resting shadow, hover anchors whole), GO di Alfonso al merge 2026-10-02).
- `git worktree list`: `ir-corner-clip` in `/Users/alfonso/jjodel-w-irclip`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** `lane-run merge --direct` fell back:

- a union hunk edits docs/log-inbox/views.md (a base section): not an append

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `50d87c3ba` is the tip of `ir-corner-clip`; the prompt files of the branch read `Status: eseguito` at `50d87c3ba`; `git worktree list` shows `ir-corner-clip` only in `/Users/alfonso/jjodel-w-irclip`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 50d87c3ba` (measured above: 1 conflict: `docs/log-inbox/views.md`). `git diff --name-only 4b9bc5836 50d87c3ba -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 4b9bc5836 alfonso-frontend-jjtl` with `git diff --name-only 4b9bc5836 50d87c3ba` (measured above: `docs/log-inbox/views.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/views.md`: the heading `## 2026-10-02 — fix(editor-v2): IR node corners and shadow no longer clipped at rest (P-2026-10-01-2336)` once (branch).
   - `docs/log-inbox/jjscript.md`: the heading `## 2026-10-01 — perf(jjscript): Run slowdown, attribution and two of three fixes (P-2026-10-01-2136)` once (trunk).
4. `git merge --no-ff --no-commit 50d87c3ba`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: ir-corner-clip into alfonso-frontend-jjtl (P-2026-10-02-1501)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `50d87c3ba` in `/Users/alfonso/jjodel-w-irclip`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard c3a9c9ffd` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/views.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the ir-corner-clip merge (P-2026-10-02-1501)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-irclip`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
