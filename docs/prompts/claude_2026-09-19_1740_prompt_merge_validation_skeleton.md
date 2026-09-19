# Prompt: merge `validation-skeleton` into `alfonso-frontend-jjtl` (RC-14)

Prompt-ID: P-2026-09-19-1740
Sequence: runs third, after `P-2026-09-19-1735` (ratifications on the trunk: R-IRN-35, R-IRN-36,
RC-14, P14 reintegration clause) and `P-2026-09-19-1730` (corner radius as a conditional axis on
the branch). Both must be committed before step 0; step 0 asserts it. Supersedes
`P-2026-09-19-1745`, which resolved the IR trio by hand inside the merge and wrote RC-14 as a
one-off derogation; that file stays in `docs/prompts/` with a superseded header and is not executed.
Source of figures: `docs/discovery/discovery_2026-09-19_merge_gate_validation_skeleton.md` (trunk
`7f16439ff`); read it in full, then `CLAUDE.md`, `docs/PROTOCOL.md` (P6, P8, P9, P13, P14 with the
new reintegration clause, P15) and `docs/claude-code-log.md`.
Effort: xhigh. Every message you send opens with `[P-2026-09-19-1740 · session <id>]`. A message
with a different or missing ID is not executed.

Decisions taken in chat on 2026-09-19 that this lane executes (the report's section 10, items not
covered by 1735 and 1730): #139 was fixed twice, take the branch side in all six hunks with a
visual check (question 3); the log conflict is a union followed by the P13 lane (question 6); the
eight simulator-front docs commits arrive by the merge (7); `11bd784b6` (`reminder`) is accepted as
is (8); the untracked prompt-2219 copy in `~/jjodel` is removed if identical to the tracked one (9);
the branch is pushed before the trunk, as RC-14 says (10); `HARNESS-DOCS.md` 1.2 lands stale,
ticket `2b1cc6d05` stays (11); both branches are frozen from the GO to this prompt until hard stop 2
(12). Plus the `simulation-engine` slice 0, which is not in the report: three code commits by
`cherry-pick -x`, log entries through the inbox.

## COSA

One merge commit, `--no-ff`, of `validation-skeleton` into the trunk; the ten conflicts resolved as
decided, the three IR files by text (1730 made them take-branch hunks, the report's 5.6 says why),
with one hand edit ratified as R-IRN-36; typecheck, build, tests and the parity probe green; then
simulation slice 0 onto the trunk, the log lane, and the pushes. Two hard stops for Alfonso.

## DOVE

Work in `~/jjodel` after step 1 (the trunk will be checked out there, where `node_modules` and the
dev server on `http://localhost:3000` live). `~/jjodel-release` is left detached. `~/jjodel-sim`
only in step 4.

Files you write outside conflict resolution: `docs/log-inbox/merge-gate.md`,
`docs/log-inbox/simulation.md`, `docs/discovery/discovery_2026-09-19_merge_resolution.md`, and what
the log lane touches (`docs/claude-code-log.md`, `docs/claude-code-log-archive.md`). Code files: only
the ten conflict files, and `IRNodeContent.tsx` for the R-IRN-36 edit. Any other file you think you
need: stop and ask.

## COME

### Step 0. Preconditions (read-only)

In `~/jjodel`: `git worktree list`. Assert:
- the trunk contains the 1735 commits: `git log alfonso-frontend-jjtl --grep='P-2026-09-19-1735' --format=%h`
  gives at least two shas (decisions + PROTOCOL, inbox), and `git show alfonso-frontend-jjtl:docs/decisions.md`
  contains `R-IRN-35`, `R-IRN-36`, `RC-14`;
- the branch contains the 1730 commits: `git log validation-skeleton --grep='P-2026-09-19-1730' --format=%h`
  gives at least two shas (code + tests, docs), and `git show validation-skeleton:frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts`
  declares `cornerRadius?: Conditional<number>` once;
- no `MERGE_HEAD`, no `index.lock` in `$(git rev-parse --git-dir)` of both trees;
- `git diff --name-only alfonso-frontend-jjtl validation-skeleton -- docs/mde-intelligence-2026/` is
  empty (positive control: without the pathspec it lists more than 200 files): Alfonso's three
  modified paper files cannot be reached by the merge;
- Alfonso confirms no other Claude Code session is open on either tree.

Record both HEAD shas: they go into the merge body. Re-measure `git merge-tree --write-tree --name-only
alfonso-frontend-jjtl validation-skeleton`: expect the same ten files as the report (the 1730 and
1735 commits touch the IR trio and `decisions.md`/`PROTOCOL.md`, so the hunks changed, the file set
should not; `PROTOCOL.md` appearing is a hard stop). For `irTypes.ts`, `irCompile.ts`,
`IRNodeContent.tsx` run `git merge-file -p` against the merge-base and read every hunk: the
expectation set by 1730 is that each is take-branch except the trunk's `separatorColorStyle` block
in `IRNodeContent.tsx`. A hunk that still needs a decision: hard stop, quote it.

### Step 1. Swap the worktrees

`git -C ~/jjodel-release switch --detach`. In `~/jjodel`: compare the untracked
`docs/prompts/claude_2026-09-18_2219_prompt_default_view_parity.md` with
`git show alfonso-frontend-jjtl:docs/prompts/claude_2026-09-18_2219_prompt_default_view_parity.md`
by md5; identical: delete the untracked copy; different: hard stop with the diff. Then
`git switch alfonso-frontend-jjtl`. Assert `git branch --show-current` = `alfonso-frontend-jjtl` and
`git status --short` shows only the three paper files, `.lsp.json`, `.tracer/`. From `frontend/`:
`npm run typecheck`, record the error count as the trunk baseline (CLAUDE.md §17 says 33; measure).

### Step 2. The merge

`git merge --no-ff --no-commit validation-skeleton`. Resolve:

- `docs/archivio/claude_milestone_validazione_scheletro.md`: ours (trunk); the branch side is the
  shared original.
- `docs/claude-code-log.md`: union by entry heading, newest first, no entry lost or doubled. No
  rotation here; Check D stays red until step 5 and the merge body declares it (RC-11, RC-14).
- `docs/decisions.md`: theirs (branch) for the hunk, whose trunk side is a strict prefix of the
  branch side. Then assert: every `**R-...**` and `**RC-...**` id unique (the report's 131 plus
  R-IRN-35, R-IRN-36, RC-14 from 1735), none lost, no `##` heading twice, no marker left.
- `docs/spec/spec_attive.md`: theirs.
- `SymbolEditorModal.scss`, `SymbolEditorModal.tsx`, `frontend/src/utils/lastViewpoint.ts`: theirs
  in every hunk. Verify one vertex seed inside the `new2` callback with `appliableTo = 'Vertex'`,
  one `createPortal(..., document.body)`, z-index `var(--z-alert, 10000)`.
- `irTypes.ts`, `irCompile.ts`: theirs, as step 0 measured. `IRNodeContent.tsx`: theirs, then the
  R-IRN-36 edit: rebuild `separatorColorStyle` from the resolved `borderColor` axis (`borderColorV`)
  and keep its two uses outside the hunk; `CompiledView.border` does not exist after the merge.
  Assert `git grep -n 'compiled\.border\b' -- frontend/src` is empty (positive control:
  `borderColor` is found).
- No marker anywhere: `git grep -n '^<<<<<<<\|^>>>>>>>' -- .` empty.

From `frontend/`: `npm run typecheck` (the step 1 baseline, not one more; a new error is fixed only
if the merge caused it and only inside DOVE), `npm run build`, `npx vitest run` (all green, in
particular the corner-radius tests of 1730, the parity snapshots in `ir.test.ts`, the three
regression tests of `516afd310`, `shapeRegistry.test.ts`, `irValidate.test.ts`,
`symbolRecognition.test.ts`). Run the parity probe
`docs/discovery/harness/probe_2026-09-19_ir_vs_native_object_style_parity.mts` against the dev
server: zero delta expected, R-IRN-36 promises no visual change on the default view. Anything red:
fix inside DOVE or hard stop.

Write `docs/discovery/discovery_2026-09-19_merge_resolution.md`: per conflict file, the side taken,
the hand edit, the identifiers that crossed hunks, the counts (typecheck, tests, probe), tickets.
It is committed inside the merge commit (it is part of the resolution) or right after as docs;
say which in the body.

Commit: `merge: validation-skeleton into alfonso-frontend-jjtl (RC-14, P-2026-09-19-1740)`. Body:
the two parent shas, the ten files with their resolution in one line each, the counts,
`Report: docs/discovery/discovery_2026-09-19_merge_gate_validation_skeleton.md`, the RC-13
exception declared (docs and code in one commit, admitted by RC-14), Check D red declared,
`Model:` trailer (P6).

### Hard stop 1: visual check by Alfonso (P8), `http://localhost:3000`, hard refresh

1. Symbol Editor modal paints above the Properties rail (#139, `bc42b259c`).
2. Tree "+" on a viewpoint creates a view born with IR (#139, `1731cbc66`).
3. Canvas v2 menu: "Create edge view" on a reference and "Create row view" on an attribute work.
4. A new object view in a syntax viewpoint has the native chrome (border, radius 8, underline,
   separator) in light and dark (R-IRN-29..34).
5. Symbol Editor: a corner radius on a diamond and on a rect, both round (R-IRN-35); absent keeps
   the base radii.
6. A project saved before `400095370` still renders its default views natively (R-IRN-34).
7. Two homonymous metaclasses of different metamodels are distinct in the picker (R-MCID).

Post the checklist and wait for `GO 1`.

### Step 3 (after GO 1). `simulation-engine` slice 0, P14 literal

`git tag archive/simulation-engine-2026-09-14 baf7b2b8a`. In `~/jjodel`, trunk clean:
`git cherry-pick -x` of `2f53c876a`, `c70c9f7b5`, `c09cf4353`, one at a time, `git merge-tree`
before each (measured 2026-09-19: zero conflicts against the trunk). `npx vitest run` green after
the third (`step.test.ts` included). One docs commit: `docs/log-inbox/simulation.md` with the three
log entries taken verbatim from the bodies of `22a593315`, `960de31d8`, `baf7b2b8a` (the docs
commits are not picked: they conflict on the log by construction). Then
`git -C ~/jjodel-sim reset --hard alfonso-frontend-jjtl`; the six original shas stay reachable from
the tag and are cited by the `-x` trailers.

### Step 4. Branches after the merge

`validation-skeleton` stays, is not deleted, and is pushed in hard stop 2 before the trunk (RC-14).
`~/jjodel-release` stays detached; removing that worktree is Alfonso's call, not this lane's.

### Step 5. The log lane (P13, exclusive, own commits)

Write this lane's entry in `docs/log-inbox/merge-gate.md` first (P9 format; `Regressions:` honest;
`Layer Impact Report: not-required` unless a critical-zone file was touched, which this lane must
not). Then from `frontend/`: `npm run log:rotate -- --fold --rotate --write` (folds every inbox:
`harness`, `merge-gate`, `simulation`, any other non-empty one; rotates to 40 or fewer). Then the
archive: remove the seven duplicate headings the report measured, only where both entries are
byte-identical; otherwise keep both and ticket it in the Notes of this lane's entry.
`npm run check:docs` green, Check D included. One commit for fold and rotate, one for the archive,
explicit pathspecs. `git add .` is never used.

### Hard stop 2: push

Report `git log --oneline -15`, `git status --short`, the `check:docs` output. Wait for `GO 2`. On
`GO 2`, in this order: `git push origin validation-skeleton`, `git push origin alfonso-frontend-jjtl`,
`git push origin archive/simulation-engine-2026-09-14`. `git push origin simulation-engine
--force-with-lease` only if the GO says so.

## RIFERIMENTI

- Report `docs/discovery/discovery_2026-09-19_merge_gate_validation_skeleton.md`, sections 5, 6, 9, 10.
- `P-2026-09-19-1735` (`docs/prompts/claude_2026-09-19_1735_prompt_ratify_merge_gate_decisions.md`),
  `P-2026-09-19-1730` (`docs/prompts/claude_2026-09-19_1730_prompt_corner_radius_alignment.md`),
  `P-2026-09-19-1745` (superseded, same folder).
- Trunk parity lane `400095370`, `6ee6efcd5`, `516afd310`; branch Symbol Editor 1b `8da572191`,
  `3e4f7536f`; #139 pair `7b5f4fd3a` (trunk) vs `bc42b259c`, `1731cbc66` (branch).
- Simulation slice 0: `2f53c876a`, `c70c9f7b5`, `c09cf4353` (code); `22a593315`, `960de31d8`,
  `baf7b2b8a` (log entries).
- Parity probe: Node 26 runs `.mts` directly, no `tsx`; probe the mounted, unselected node.
- P14 (worktrees, cherry-pick, reintegration clause), P13, P9, P8, P6, RC-11, RC-13, RC-14.
