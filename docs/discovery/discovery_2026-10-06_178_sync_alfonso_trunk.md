# Discovery 2026-10-06 — #178, gate report: reintegrate Alfonso's trunk before the log rotation

Prompt-ID: C-2026-10-06-1210 (chat, no prompt file; issue #178)
Session: session unknown
Tree: `~/development/jjodel-178` (temporary worktree), branch `chore/178-sync-alfonso`, HEAD `a12775ca5` (= `origin/staging`)
Executor: Claude Opus 5.5
Phase: 1, read-only. Gate report required by RC-14 / P14 «Reintegration of a branch» for the merge it precedes.

This report is a set of hypotheses with evidence, not a definitive reference. Whoever uses it downstream re-reads the real files.

## 0. Answer in brief

- #178 asked to fold the inboxes and rotate the active log on Juri's line, where `check:docs` is red (B: `:245`, `:267`; D: 74 > 40). Both dry runs pass (MEASURED). However, Alfonso's trunk already folded and archived the shared part on 2026-10-02 (`d2eb5fb83`, P-2026-10-01-2344). Rotating here as well would make two trunks fold the same entries. The next staging-sync would then hit a log/archive conflict, which is the class of conflict that produced the current duplicates.
- The two B failures are not authoring errors. They are entries spliced by the union merge `07f65237b` (PR #164, 2026-09-28 21:04). That merge also duplicated the whole #157 block in the active log (MEASURED). Alfonso's archive holds one clean copy of each entry.
- Juri's decision (chat, 2026-10-06): first merge `origin/alfonso-frontend-jjtl` into the line, then deal with the log.
- Trial merge (MEASURED, not committed, then aborted):
  - Three textual conflicts. The two inboxes are mechanical. `frontend/src/constants/defaultPrompts.ts` is semantic: both lines wrote a chat prompt v5, with opposite containment forms.
  - Typecheck: 14 errors, the declared baseline by file and code.
  - Vitest: 307 files green. Red: the 9 baseline files, plus `bashGuard.test.ts` (32 tests). That red is an artefact of running mid-merge: the guard skips commit checks while `MERGE_HEAD` exists. Control in a tree with no merge in progress: 160/160.
- The consumer profile guard does not know `create … in`, which the merged executor accepts. With a profile, an instance can be created inside a read-only parent (READ).
- Juri's decision on the prompt (chat, 2026-10-06), the hybrid:
  - the M1 section comes from Alfonso (`create … in`);
  - rule (b) is ours (a `set` on a single-valued reference replaces, as the merged executor does);
  - the END-USER section is ours, and says that the consumer keeps create + `set`;
  - the prompt goes to v6.
  - After the merge, one `fix:` to `permissionGuard.ts` + `executor.ts` + test: under a profile, `create … in` requires the parent's type to be `edit`.
- Open: `rotate-log.ts` cannot fold some lanes and not others. Question 1.

## 1. Hypotheses

- **H1. #178 is solved by fold + rotate on Juri's line, at no cost elsewhere.** Partly falsified.
  - Both dry runs exit 0 (MEASURED on `a2ca36646`, which has the same log files as `origin/staging` except for one extra inbox):
    - `--fold --rotate`: 109 folded, 143 moved, active 40, archive 1223 → 1366, 69 entries folded straight into the archive.
    - `--rotate --keep=17`: 57 moved, active 17.
  - Alfonso's trunk already holds all 56 distinct headings of our active log, in its log or archive (MEASURED: `comm -12` of the sorted headings). It also folded the simulation, harness and views inboxes, whose 37 + 16 + 7 headings are all there.
  - Since the merge base `98ebb132e`, `origin/staging` has not touched `docs/claude-code-log.md`, `docs/claude-code-log-archive.md` or those inboxes (MEASURED, `git diff --stat`). Its only docs changes are additions to `data-manager-ux.md`, `standalone-environment.md`, `jodie-consumer.md` and `gemini-test-connection.md`.
- **H2. The B failures at `:245` and `:267` are entries written without `Corregge` / `Causa`.** Falsified. They are splices from merge `07f65237b` (MEASURED: heading counts per commit):
  - parent `d3a650a11`: 57 entries, one copy of `## 2026-09-23 — feat(#157): mini-UI Environment config (Fase 0b)`;
  - parent `b7b1fddb9`: 56 entries, one copy;
  - the merge: 73 entries, two copies. Today 16 headings appear twice and `## 2026-09-18 — docs: trasporto normativo, passo 2 di P-2026-09-18-2110` three times.
  - `docs/claude-code-log.md:245-266` («trasporto normativo») has no outcome fields: the incident paragraphs of the 2026-09-13/16 batch follow it.
  - `:267-269` (the P-2026-09-26-2350 rotation entry) stops after `**Files touched**`, and `:270` starts the next entry without a blank line.
  - The missing fields of both sit in the third copy, `:465-480`. Alfonso's archive has one copy of the Fase 0b entry (MEASURED: `grep -c`).
- **H3. Merging Alfonso's trunk is a text-only merge.** Partly. Of 3 conflicts, 1 is semantic (§3). Two files auto-merge on both sides:
  - `frontend/src/events/registry.ts`: disjoint additions;
  - `frontend/src/jjscript/executor/commands/instance.ts`: ours +59/-8, theirs +169/-14, green in vitest.
- **H4. The merged tree is at baseline on the gates.** Holds for typecheck and vitest (§2). Build not run in Phase 1.
- **H5. The consumer guard covers every way an M1 command can write into another instance.** Falsified for `create … in` (§4).

## 2. Measurements

- Merge base: `98ebb132e` (2026-10-01 18:43, `docs(#157): log-inbox entry for R3 and the corrected test guide`). `origin/alfonso-frontend-jjtl` is 1030 commits ahead of it (tip `799e9f50a`, 2026-10-06 10:08), and `origin/staging` is 63 ahead.
- `git merge-tree --write-tree --name-only origin/staging origin/alfonso-frontend-jjtl`: exit 1, 3 conflicts: `docs/log-inbox/data-manager-ux.md`, `docs/log-inbox/standalone-environment.md`, `frontend/src/constants/defaultPrompts.ts`.
- Files changed on both sides since the base (`comm -12` of the two `git diff --name-only` lists): exactly 5, the 3 above plus `registry.ts` and `instance.ts`. Ours touches 74 files, theirs 710.
- Governance files changed by theirs only: `CLAUDE.md`, `AGENTS.md`, `docs/PROTOCOL.md`, `docs/decisions.md`, `frontend/src/styles/CLAUDE.md`, `frontend/package.json`. They come in as theirs: the home of `CLAUDE.md` is that trunk (P15). The `package.json` diff adds scripts only (`trace:index`, `check:addonly`, `lane-board`) and no dependency (rule 4).
- Trial merge (`git merge --no-ff --no-commit origin/alfonso-frontend-jjtl`, conflicts present, `defaultPrompts.ts` taken from our side for the measure only; the file is prompt text, and its conflicting code lines are the version block):
  - `npm run typecheck`: exit 2, 14 errors. `data.ts` TS2304 ×2 + TS2322, `Dummy.ts` TS2307, `EditorV2.tsx` TS2339, `Measurable.tsx` TS2552 + TS7053 ×4 + TS2345, `ChatMessages.tsx` TS2322, `ProjectEditor.tsx` TS2769, `Dashboard.tsx` TS2339. That is the CLAUDE.md §17 list.
  - `npx vitest run`: 10 files failed, 307 passed, 32 tests failed, 7839 passed.
    - The 9 baseline files fail at import (`context-binding`, 7 jjtl, `UDComparator`).
    - `scripts/hooks/__tests__/bashGuard.test.ts` fails with `expected null to be 'deny'`. The cause is `frontend/scripts/hooks/bash-guard.mjs:166-167`: `function operationInProgress(cwd) { for (const ref of ['MERGE_HEAD', 'CHERRY_PICK_HEAD', 'REVERT_HEAD']) {`, and the trial tree had `MERGE_HEAD`.
    - Positive control: the same file in `~/development/jjodel` (no `MERGE_HEAD`, `ls` exit 1), 160/160 passed. To re-run after the merge commit.

## 3. The semantic conflict: two chat prompts v5

Ours, `origin/staging:frontend/src/constants/defaultPrompts.ts` (#168 C1, `be4260166` line):
- `:195` «**Create an instance** (it is created at the model root; to place it inside another instance, link it through a containment reference — see **Put an instance inside another** below):»
- `:219` «- (b) A **single-valued** reference holds one target: a new \`set\` on it REPLACES the previous target.»
- `:223` «**Put an instance inside another (containment):**» (create, then `set` of the parent's containment)
- `:283` «## END-USER MODE (only when the context has an \`environment\` block)»
- `:715` «{ version: 5, note: 'Single-valued reference set replaces; teach containment as create then set; add an end-user section gated on the environment block' }»

Theirs, `origin/alfonso-frontend-jjtl:frontend/src/constants/defaultPrompts.ts` (`9163f0b28`, P-2026-10-04-0946):
- `:195` «**Create an instance** at the model root, or inside its container:»
- `:201` «- **Containment rule**: … created INSIDE its container, with \`in parentName.containmentReference\` — never at the root, and never attached afterwards with \`set parentName.containmentReference = ...\` or \`+= ...\`.»
- `:222` «- (b) Set each single-valued reference **exactly once** — re-setting it APPENDS another target, it does not replace.» After the merge this is false: the merged executor replaces (`referenceWrite.ts`, ours, green in `referenceWrite.test.ts`).
- `:698` «{ version: 5, note: 'Create M1 instances inside their container with create instance ... in parent.reference' }»

The executor behind theirs (READ, `origin/alfonso-frontend-jjtl`):
- parser `parser.ts:294` `if (!parent && this.matchKeyword('in')) {`;
- `instance.ts:325` `function resolveContainerSlot(`, which checks parent, slot, containment, conformance and upper bound before any write;
- `:517` `container ? DValue : DModel,`: the child is born in the slot and is not listed in `model.objects`;
- `:132` `export function allModelInstances(model: LModel): any[] {`: R-JS-10, name lookup over roots and contained instances.

## 4. The consumer side: guard and preflight

- Guard, `origin/staging:frontend/src/jjscript/executor/permissionGuard.ts:141` `if (cmd.command === 'create') {`. The branch checks only `cmd.creates`, every class named X, then `return null`. `describeForGuard` (`executor.ts:357`) fills only `creates` for a create (`:370`). So under a profile, `create instance of Room "k" in lockedHouse.rooms` passes the guard whenever `Room` is `edit`, while it writes into the slot of a read-only `House`. This contradicts J5 and the END-USER rule «An instance of a type in readOnlyTypes may appear only as the target of a reference that is NOT a containment». READ, not run in a browser.
- Preflight, `origin/staging:frontend/src/components/Jodie/consumerProposalModel.ts:234` `function containmentProblem(`.
  - A non-rootable create is placed only by a later `set` / link step (`:250-268`). A `create … in` of such a type is refused: «has to go inside another element, and this proposal doesn't say which one» (`:270`). That is safe, but useless.
  - A rootable `create … in` is described as a plain create. That is a declared limit, out of the decided scope.
- With the hybrid, the consumer keeps create + `set` (the form @tmaog checked 8/8 on 2026-10-06, #168 issuecomment-5994803631), so the preflight needs no change. The guard hole exists whatever the prompt teaches, because the executor accepts `in`.

## 5. Decisions taken (Juri, chat 2026-10-06)

1. Order: merge `origin/alfonso-frontend-jjtl` into the line first, then the log. Neither of the other two options was chosen: fold + rotate at 40 here, or rotate without folding at `--keep=17`.
2. Prompt: the hybrid.
   - M1 section from theirs (`create … in`, containment rule, example).
   - Rule (b) from ours (replace).
   - Our ban on `+=` / `-=` / `add` / `remove` at M1 kept next to theirs.
   - END-USER section from ours, plus one line: in this mode an instance goes inside another by create, then `set` of the parent's containment, never with `create … in`.
   - `version: 6`, changelog v5 of both kept as history, one v6 note.
3. Guard: a `fix:` commit after the merge.
   - `GuardCommand` gains an optional `container?: GuardType | GuardUnresolved` (rule 11: optional only).
   - `describeForGuard` resolves the parent with `resolveInstanceHandle`, as `resolveContainerSlot` does.
   - Under a profile, `checkCommandPermission` refuses a create whose container type is not `edit` (`PROFILE_TYPE_LOCKED`), or unresolved (`PROFILE_UNRESOLVED`).
   - Tests in `permissionGuard.test.ts`. `describeForGuard` cannot be imported by the node bench (`executor.ts` reaches `window`): a gap, to be stated.

Merge resolution of the inboxes: `data-manager-ux.md` and `standalone-environment.md` keep the preamble plus our entries added after the base. The base entries were folded on theirs (`d2eb5fb83`), so keeping them would fold them twice.

## 6. Risks

- **Two trunks folding.** After the merge, every fold on this line changes `docs/claude-code-log.md` and the archive, and Alfonso's next staging-sync meets that change as a conflict. The 2026-10-01 procedure (P-2026-10-01-2240, union rule + `check:addonly`) resolves the log, but the archive can receive the same entry from both sides.
- **Children born in the slot are not in `model.objects`.** The lane R report (`docs/discovery/discovery_2026-10-02_168_r_reparent_from_root.md:128-129`, `:149`) READ that `useM1ReferenceEdges.ts:131`, `m1EdgeSweep.ts:81` and `ConformanceValidator.ts:35` walk `model.objects` only.
  - On theirs, `create … in` now produces that form from JjScript too, for developers. The UI's «Add» already did.
  - The consumer is not exposed under the hybrid. Not measured here: on Alfonso's trunk it is his choice since P-2026-10-04-0946, tracked in #174.
- **`fix/171-jjscript-delete-cascade`** (pushed, not on staging) changes `instance.ts` again (`474d445ec`). Merging it after this sync meets R-JS-10's model-wide lookup in the same file. Not measured.
- **Release freeze.** Alfonso's 3.1.0 freeze is 2026-10-07 (P-2026-10-01-2240). This merge flows back to his trunk only through his staging-sync, which is his call.

## 7. Questions

1. `rotate-log.ts:65-70` parses only `--fold`, `--rotate`, `--keep=` and `--write`, so folding «only our lanes» needs either a filter added to a harness script owned by the other trunk, or no fold at all. Recommended: after the merge, measure `check:docs`. If B and D are green with the log as it arrives from theirs (40 entries), fold nothing here, and leave every inbox to the single folding trunk.

## Files read

`docs/claude-code-log.md` (whole heading list; `:1-16`, `:240-285`, `:460-482`), `docs/PROTOCOL.md` P4, P9, P13, P14, `docs/decisions.md` `:1-80` (RC-3 … RC-14), `frontend/scripts/gates/rotate-log.ts` `:1-200`, `frontend/src/jjscript/executor/permissionGuard.ts` `:1-175`, `frontend/src/jjscript/executor/executor.ts` `:340-440`, `frontend/src/components/Jodie/consumerProposalModel.ts` `:1-30`, `:225-275`, `frontend/scripts/hooks/bash-guard.mjs` `:155-185`. From `origin/alfonso-frontend-jjtl`: `docs/prompts/claude_2026-10-01_2240_prompt_staging_sync.md` (the first 150 lines, which hold the whole prompt), the diffs `98ebb132e..` of `defaultPrompts.ts`, `parser.ts`, `instance.ts`, `registry.ts`, `package.json`, and `git show --stat d2eb5fb83 9916cefce`.

## Addendum 2026-10-06 — Phase 2

Commits on `chore/178-sync-alfonso`:
- `851dec87f`: merge, parents `ee72b5354` (this report) and `799e9f50a` (`origin/alfonso-frontend-jjtl`);
- `e33c628b8`: `fix:` of the guard.

**Merge.** The resolution follows §5.
- The two inboxes keep the other side's preamble and this line's 4 + 3 entries added after the base. They are byte-identical to what `origin/staging` added: MEASURED, diff of the `+` lines, empty.
- `defaultPrompts.ts` resolves as the hybrid. The diff against the other side has four hunks: (b) and (c) from this line, the `+=` / `-=` / `add` / `remove` ban, the END-USER section with the containment line, and version 6.
- Beyond the markers, this line's «Put an instance inside another» block auto-merged without markers into the M1 section, where it contradicted the other side's containment rule. It was removed there and carried into the END-USER line.
- The changelog holds one v5 entry with both notes verbatim. `frontend/src/components/settings/PromptEditor.tsx:151` keys the list on `entry.version`, so two v5 entries would have collided.

**The merge commit and the commit guard.** `bash-guard` reads the merge state from the session's cwd (`~/development/jjodel`, no `MERGE_HEAD`), not from this worktree: the open ticket «bash-guard reads the merge state from the payload cwd only». It therefore asked for a pathspec, and git refuses a pathspec during a merge. The commit used `git commit -i -F <msg> -- frontend/src/constants/defaultPrompts.ts`: it stages that file (already staged, unchanged) and commits the index, which here held only the merge result. Declared here, and not a precedent: the worktree held no other lane.

**check:addonly on the merge.** 81 entries flagged against the first parent (MEASURED).
- 79 reappear byte-identical in the merged log or archive: folded straight to the archive by `d2eb5fb83`, or the duplicate copies collapsed into one.
- 2 are the halves of the `07f65237b` splice (`:245`, `:465`). Their clean text is in the merged archive, which holds the entry with its fields and the rotation fields, and in the log preamble, which holds the incident paragraphs.
- The merge message was amended, with tree and parents unchanged (MEASURED), to carry `Log-Repair: 07f65237b` and a paragraph naming all of this. After the amend: `EXEMPT 851dec87f Log-Repair: 07f65237b`, exit 0.

**Gates on `851dec87f`** (MEASURED, each in the foreground):
- typecheck 14, the §17 list by file and code;
- `npx vitest run`: 9 files failed, 308 passed, 7871/7871 tests. The 9 are the baseline files that fail at import. `bashGuard.test.ts` is green, so the Phase 1 artefact is gone;
- `npm run build` exit 0;
- `npm run check:docs` exit 0, A-D 4/4 PASS, 17 warnings (inboxes waiting).

**Guard fix `e33c628b8`.**
- What it adds: `GuardCommand.container?` (optional, rule 11), `describeForGuard` resolving the parent with `resolveInstanceHandle`, and the refusal in `checkCommandPermission`.
- Tests first: `permissionGuard.test.ts` gains 6 tests, 3 red before the fix and controls green; 58/58 after.
- `describeForGuard` is not executed by any test, because `executor.ts` does not import under node.
- jjscript + Jodie + environment vitest: 713/713, with `context-binding` red at import (baseline).
- Not run: a browser probe of the consumer, and Jodie with a real model.

**Question 1, the fold.** Juri, 2026-10-06: «i merge li faccio solo ed esclusivamente io. Alfonso lavora solo sul suo branch». §6 had assumed that Alfonso's staging-sync folds this line's inboxes; that premise does not hold. With `check:docs` green, no fold is made here. The inboxes (jodie-consumer 33, data-manager-ux 4, standalone-environment 3, gemini-test-connection 1, plus the other trunk's own) wait for Juri's next merge, where the fold is his decision. `rotate-log.ts` folds every inbox or none (`:65-70`).

**Not done here.** Pushing `staging`, the visual check of the integrated app, and the merge of `fix/171-jjscript-delete-cascade`, which touches `instance.ts` again, now on top of R-JS-10.
