# Prompt: merge gate for `validation-skeleton` into `alfonso-frontend-jjtl` (Phase 1, read-only)

Prompt-ID: P-2026-09-19-1622
Repo: `~/jjodel-release` (worktree of `alfonso-frontend-jjtl`, the trunk). Do NOT work in `~/jjodel`: another lane (P-2026-09-19-1610) is in flight there with uncommitted changes to `irTypes.ts`, `irResolveCore.ts` and `metaclassPin.ts`.
Effort: xhigh. Read `CLAUDE.md`, `docs/PROTOCOL.md` (P13, P14, P15) and `docs/claude-code-log.md` first.
Every message you send opens with `[P-2026-09-19-1622 · session <id>]`. A message with a different or missing ID is not executed.

## COSA

Produce the **gate report** that must exist before `validation-skeleton` can reach the trunk. The report answers, with measured numbers and shas, the questions the backlog raised on 2026-09-09 (`docs/archivio/claude_backlog_2026-09-09_manutenzione_harness.md`, item 4) plus one item added on 2026-09-19 (edge views from the canvas v2 menu). It does not merge, does not cherry-pick, does not resolve anything. It ends with the decision Alfonso has to take on the mechanism, framed as options with the numbers next to each.

The chat measured the following on 2026-09-19 at 16:10 (from `~/jjodel`, `GIT_OPTIONAL_LOCKS=0`). Per P14 last bullet you re-measure everything; you do not inherit these figures. They are here so that a discrepancy is visible.

- `validation-skeleton` HEAD `941a94da9`, `alfonso-frontend-jjtl` HEAD `20ddf067e` (after `c591cf351` the trunk got the CLAUDE.md split lane P-2026-09-18-2110 and the R-IRN-34 closing line). Merge-base `4275c5850`.
- `git rev-list --count`: branch 256 ahead, 75 behind.
- `git cherry alfonso-frontend-jjtl validation-skeleton`: 41 commits with an equivalent patch already on the trunk (`-`), 215 without (`+`).
- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl validation-skeleton`: exit 1, seven conflicting files:
  `docs/archivio/claude_milestone_validazione_scheletro.md` (add/add), `docs/claude-code-log.md`, `docs/decisions.md`, `docs/spec/spec_attive.md`, `frontend/src/components/editor-v2/viewpoint/ir/IRNodeContent.tsx`, `frontend/src/components/editor-v2/viewpoint/ir/irCompile.ts`, `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts`.
  Conflict hunks per file with `git merge-file -p` against the merge-base: decisions.md 1, claude-code-log.md 1, spec_attive.md 2, irTypes.ts 1, irCompile.ts 2, IRNodeContent.tsx 1.
- `origin/validation-skeleton` at `3e48caed8`: 66 commits not pushed. `origin/alfonso-frontend-jjtl` at `6e9a31fe7`.
- `~/jjodel` working tree: three paper files modified under `docs/mde-intelligence-2026/` (Alfonso's lane, never to be committed by a Claude Code lane), three IR files modified by the in-flight lane, `.lsp.json` and `.tracer/` untracked, `docs/prompts/claude_2026-09-18_2219_prompt_default_view_parity.md` untracked.
- `docs/sessioni/sessione_2026-09-19.md` on the branch (commit `c66e253fc`) already records the expected resolution of the `decisions.md` conflict: one additive conflict at the head of the R-NV series, resolved by keeping both sides (branch R-VAL tail followed by the R-NV/R-JS block).

## DOVE

Read-only on the repository. The only files you write:

- `docs/discovery/discovery_2026-09-19_merge_gate_validation_skeleton.md` (the report, mandatory; the hard stop is not complete until it is on disk).
- The lane's inbox entry under `docs/log-inbox/` per P9 (a new file for this lane, `merge-gate.md`, unless P9 says otherwise).
- `docs/prompts/claude_2026-09-19_1622_prompt_merge_gate_validation_skeleton.md`: this file, if it is not already tracked.

No file under `frontend/`. No change to `CLAUDE.md`, `PROTOCOL.md`, `decisions.md`.

## COME

All git commands are read-only and run in `~/jjodel-release`; the branch refs are shared, so nothing needs a checkout of `validation-skeleton`. Run `git worktree list` first and assert `git rev-parse --abbrev-ref HEAD` is `alfonso-frontend-jjtl` and `git status --short` is empty before you start. No `git merge`, no `git cherry-pick`, no `git worktree add`, no `git stash`, no `git checkout` of another branch. `git merge-tree --write-tree` and `git merge-file -p` on files extracted with `git show <rev>:<path>` are the tools.

Sections of the report, in this order:

1. **Measurement header.** Both HEADs, merge-base, ahead/behind, cherry counts, origin state, date and time. Any discrepancy with the figures above is stated, not silently replaced.

2. **The 41 duplicates.** For each `-` line of `git cherry`, the branch sha, the equivalent trunk sha (find it with `git log --format=%H --grep` on the subject or with `git patch-id`), the subject, and whether the patch touches code or only docs. Answer: are all 41 docs-only (the normative rules and the documentation committed once per lane, as §6.6 predicts), or is there code committed twice? Any code duplicate is a finding on its own.

3. **The 215 non-duplicates, classified.** Group by top-level path (`frontend/src/...` by component directory, `docs/...` by subfolder, root files) with counts and the sha list per group in an appendix. Separately list every commit that touches `CLAUDE.md`, `docs/PROTOCOL.md` or `docs/decisions.md`: by §6.6 these are due to the trunk regardless of the merge mechanism, so the report says for each whether it is already there (then it should have been among the 41; explain why `git cherry` missed it, usually because the patch was reworded) or still missing.

4. **The 75 commits the branch lacks.** Group the trunk-only commits by lane (parity `P-2026-09-18-2219`, CLAUDE.md split `P-2026-09-18-2110`, release 3.0, Prompt-ID, other). For each lane say which files it touched that the branch also touched since the merge-base: that intersection is where the seven conflicts come from, and the report maps every conflicting file to the pair of lanes that produced it.

5. **The seven conflicts, one by one.** For each file: the hunk(s) from `git merge-file -p`, the branch-side lane and the trunk-side lane, and a proposed resolution in one of three shapes: keep both (additive), take trunk, take branch. For `irTypes.ts`, `irCompile.ts`, `IRNodeContent.tsx` the trunk side is the parity lane (`TextStyle.underline`, `ShapeSpec.cornerRadius`, edge terminators) and the branch side is Symbol Editor 1b (conditional border, corner radius, Goal family): say whether the two sides model the same thing twice (for example two notions of corner radius) or different things that simply sit on the same lines. A semantic overlap is a finding that blocks the merge until a decision; a textual overlap is a resolution note. Flag that `irTypes.ts` has a third writer, the in-flight lane P-2026-09-19-1610 (`AuthoringMetaclassPins` widening), whose commit will change this file's conflict set: the gate is re-measured after that lane closes.

6. **Edge views from the canvas v2 menu.** On the trunk, `createViewInWorkbench` builds only vertex views (finding of 2026-09-19). On the branch, the edge and row route was closed by the "rotta archi e righe" lane (`ca3fdaa99`, `f554aa5fb`, then the seed and create-gate commits `b0b70bd54`, `1731cbc66`, `70bcbc5f8`, `86f822d50`). Confirm by reading the code on both refs (`git show validation-skeleton:<path>`), list the exact commits that carry the edge route and whether they belong to the 215 and to any conflicting file. Answer the question: does the trunk get edge views from the menu by the merge alone, or do those commits need a cherry-pick of their own if the mechanism is not a merge?

7. **`CLAUDE.md` and the normative docs.** Line counts on both refs, the sections present on one side only (the backlog names §9.3 on reference slots as branch-only; `9b3d74857` brought the trunk's split into the branch on 2026-09-19, check what remains). Same for `docs/PROTOCOL.md` and `docs/HARNESS-DOCS.md`. Say whether the merge leaves `CLAUDE.md` with one house (§6.6) or with content that exists only because of the merge order.

8. **The working trees.** Which uncommitted or untracked files in `~/jjodel` would make git refuse a checkout or a merge in that tree (the 2026-09-09 case was `ValidationRulesModal.tsx`; check whether it is still the case for any file). State that `~/jjodel-release` is clean and has no `node_modules` (P14 symlink rule applies to any gate run there in Phase 2).

9. **Mechanism: the decision for Alfonso.** P14 says code reaches the trunk by `git cherry-pick -x` of explicit shas, never by range; it does not name a merge commit. With 215 commits the per-sha route is not a working option. Lay out the three shapes with the numbers next to each and do not choose:
   (a) one merge commit, with a declared derogation from P14 (RC-11) ratified in `decisions.md` before the merge, seven conflicts resolved as in section 5;
   (b) cherry-pick by front (curated sha lists per closed front, from the classification in section 3), which keeps P14 literal and costs one pass per front with its own conflicts;
   (c) a squash per front, which loses the per-commit history the `Model:` trailer and the `Corregge` chain depend on (RC-7).
   Include what each option does to the 41 duplicates and to the 66 unpushed commits.

10. **Open questions for Alfonso**, numbered, one line each.

Hard stop after the report and the inbox entry are committed. Do not start Phase 2. Do not push.

Commits: docs only, on the trunk, with pathspec (`git add -- <path>` then `git commit -- <path>`), never `git add .`. Conventional subject in English, one line, with the Prompt-ID in parentheses. Body carries the P6 trailer `Model: <vendor> <name> <version>` with the model actually running. Two commits are expected: the report, then the inbox entry (and the prompt file with it if untracked).

## RIFERIMENTI

- `docs/archivio/claude_backlog_2026-09-09_manutenzione_harness.md`, item 4: the three facts of 2026-09-09 (16 of 50 duplicates, 54 lines of `CLAUDE.md` divergence, `ValidationRulesModal` blocking the checkout). All three are stale by construction; the report replaces them.
- `docs/PROTOCOL.md` P14 (worktrees and cherry-picks), P9 (log-inbox), P6 (`Model:` trailer); RC-11 (declared derogations), RC-12 (verbatim moves), RC-13 (one lane per round, docs and code never in the same commit).
- `CLAUDE.md` §6.4 (Prompt-ID), §6.6 (the normative rules have one house, the trunk).
- `docs/sessioni/sessione_2026-09-19.md` on the branch, the paragraph added by `c66e253fc`: the `decisions.md` conflict and its resolution, measured with `git merge-file`.
- `docs/decisions.md` R-IRN-29..34 (parity lane, the trunk side of the three IR conflicts); `docs/handoff/decisions-symbol-editor-1b.md` D1..D8 (the branch side).
- Discovery report format: objective, files read with full paths, findings, dependencies and risks, open questions. Name and folder as above; the analysis in chat starts from the saved report, not from the session's memory.
