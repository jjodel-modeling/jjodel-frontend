# Prompt: ratify the merge-gate decisions (R-IRN-35, R-IRN-36, P14 reintegration clause)

Prompt-ID: P-2026-09-19-1735
Repo: `~/jjodel-release` (worktree of `alfonso-frontend-jjtl`, the trunk). Docs only. Do not touch `~/jjodel`.
Effort: xhigh. Read `CLAUDE.md`, `docs/PROTOCOL.md` (P6, P9, P13, P14, P15) and `docs/claude-code-log.md` first.
Every message opens with `[P-2026-09-19-1735 · session <id>]`. A message with a different or missing ID is not executed.
Sequence: this prompt runs first; `P-2026-09-19-1730` (branch alignment) and `P-2026-09-19-1740` (merge) follow. It is independent of both and must be committed before the merge starts.

## COSA

Write into the normative documents the three decisions Alfonso took on 2026-09-19 on the gate report
`docs/discovery/discovery_2026-09-19_merge_gate_validation_skeleton.md` (questions 1, 2, 4 of section 10). Nothing else changes. The wording below is the decision; you may fix grammar, not meaning.

### R-IRN-35 (2026-09-19): Corner radius: one contract, type from the trunk, rendering from the branch

`ShapeSpec.cornerRadius?: Conditional<number>` (px), sibling of `border`, as R-IRN-31 says: after D1 every border axis is a conditional, and S6 must put the radius in the rules table like any other axis, so a scalar would be the one axis outside the mechanism. Compiled as `CompiledView.cornerRadius: CompiledConditional<number | undefined> | null` with the fallback not emitted and never 0. Absent is not zero: an absent radius keeps the shape's base rendering (D5 kept). Rendering follows the branch (Symbol Editor 1b, D5): honoured by box shapes as an inline `border-radius` and by `diamond`, `hexagon` and `parallelogram` through `roundedPolygonPath`, clamped at render; ignored only by shapes without corners (`ellipse`, `circle`, `stadium`). The renderer reads the resolved compiled value, never the source IR. This supersedes the "not Conditional in v1" clause of D5 (`docs/handoff/decisions-symbol-editor-1b.md`) and narrows the "ignored on SVG-painted shapes" clause of R-IRN-31 to shapes without corners. The object seed value `8` is unchanged.

### R-IRN-36 (2026-09-19): The separator colour follows the per-axis border colour

The parity rule of S2 (the compartment separator reuses the box border colour) is kept and re-based on D1: it reads the resolved `borderColor` axis, not the compiled `border` object, which D1 removes. Same behaviour, one source of truth for the border colour.

### Processo, RC-14 (2026-09-19): Reintegration of a long-lived branch goes by merge commit

P14 governs the transport of single fixes between live branches: `cherry-pick -x` of explicit shas. The reintegration of a branch that diverged on more than one front (`validation-skeleton` on 2026-09-19: 261 commits, 8 code fronts, 10 conflicting files) goes by one merge commit, `--no-ff`, on these conditions: a gate report in `docs/discovery/` exists and is cited in the merge body; semantic conflicts are resolved on the branch before the merge, so that the merge itself resolves text only; the merge commit is the one admitted exception to RC-13 (docs and code in one commit) and declares it in its body; the log conflict is resolved by union and the log is rotated by the exclusive lane of P13 in the next commit, with Check D red in between and declared (RC-11); the branch is pushed before the trunk, so both parents of the merge are public. A squash is never used: it erases the `Model:` and `Co-Authored-By` trailers and the shas the log cites. Rationale: P14 (2026-09-14) was written for the single-fix case; a rule that needs a derogation the first time it meets a real case has a gap, so the rule is amended, not derogated.

## DOVE

- `docs/decisions.md`: R-IRN-35 and R-IRN-36 appended at the end of the R-IRN series, right after R-IRN-34 (currently line ~1169, closed with the 2026-09-19 note); RC-14 appended at the end of the Processo series after RC-13-bis, in the format of the neighbouring entries (bold id, date, bold title, prose).
- `docs/PROTOCOL.md` P14: add one paragraph at the end of the section, titled "Reintegration of a branch", carrying the RC-14 rule in English (the file is English). Version bump of the file header if it has one (1.3 → 1.4).
- `docs/log-inbox/merge-gate.md`: one entry for this lane (P9 format, as the existing entry in that file).
- `docs/prompts/claude_2026-09-19_1735_prompt_ratify_merge_gate_decisions.md`: this file, if untracked.

No other file. Not `CLAUDE.md`, not `docs/handoff/decisions-symbol-editor-1b.md` (the branch owns it; the merge brings it and R-IRN-35 states the supersession).

## COME

Before writing, measure the effect on the merge as the branch lane did on 2026-09-19 (`c66e253fc`): for `docs/decisions.md` and `docs/PROTOCOL.md`, run `git merge-file -p <trunk-after-edit> <merge-base:file> <validation-skeleton:file>` with the merge-base `git merge-base alfonso-frontend-jjtl validation-skeleton` and count `<<<<<<<` markers before and after your edit. The gate report says the R-IRN series and P14 sit outside the conflict hunks; your edit must not add a hunk. If it does, move the insertion point and re-measure; if it cannot be done without a new hunk, hard stop and report.

Assert first: `git worktree list`, `git rev-parse --abbrev-ref HEAD` is `alfonso-frontend-jjtl`, no `MERGE_HEAD` in the git-dir, `git status --short` empty. `npm run check:docs` is not runnable here (no `node_modules`); run it through the P14 symlink to `~/jjodel/frontend/node_modules` and remove the symlink afterwards, `git status --short` empty after.

Commits: docs only, pathspec (`git add -- <path>`, `git commit -- <path>`), never `git add .`. One commit for `decisions.md` + `PROTOCOL.md`, one for the inbox entry (+ this prompt file if untracked). Subject in English with the Prompt-ID in parentheses. Body with the P6 trailer `Model: <vendor> <name> <version>` from the session banner. No push.

Hard stop after the two commits: report the two shas and the merge-file counts before and after.

## RIFERIMENTI

- Gate report `docs/discovery/discovery_2026-09-19_merge_gate_validation_skeleton.md`, sections 5.6, 9, 10.
- `docs/decisions.md` R-IRN-29..34 (trunk), `docs/handoff/decisions-symbol-editor-1b.md` D1 and D5 (branch, `git show validation-skeleton:<path>`).
- `docs/PROTOCOL.md` P14 (trunk, from line 238), RC-11, RC-13, RC-13-bis.
- Insertion measurement: `docs/sessioni/sessione_2026-09-19.md` on the branch, paragraph of `c66e253fc`.
