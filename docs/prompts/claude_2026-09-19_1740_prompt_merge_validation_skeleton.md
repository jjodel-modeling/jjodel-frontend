# Prompt: merge `validation-skeleton` into `alfonso-frontend-jjtl` (Phase 2 of the gate)

Prompt-ID: P-2026-09-19-1740
Repo: `~/jjodel-release` (worktree of `alfonso-frontend-jjtl`, the trunk). Do not work in `~/jjodel`.
Effort: xhigh. Model: check the session banner says Opus 5 before starting; if it does not, stop and report (the P6 trailer names what runs).
Read `CLAUDE.md`, `docs/PROTOCOL.md` (P6, P8, P9, P13, P14 with the reintegration clause, P15) and `docs/claude-code-log.md` first.
Every message opens with `[P-2026-09-19-1740 · session <id>]`. A message with a different or missing ID is not executed.
Preconditions, all four: `P-2026-09-19-1735` committed on the trunk (R-IRN-35, R-IRN-36, RC-14, P14 clause); `P-2026-09-19-1730` committed on the branch; Alfonso has declared the freeze (no lane on either branch, no merge of `origin/staging`); the branch is pushed (`origin/validation-skeleton` equals `validation-skeleton`). Verify each with git; if one fails, stop.

## COSA

One merge commit, `--no-ff`, of `validation-skeleton` into `alfonso-frontend-jjtl`, resolved as the gate report and the ratifications prescribe, verified by the gates, then rotated log, then Alfonso's visual check, then push. RC-14 governs the shape; the gate report of `7f16439ff` is the map; this prompt fixes the resolution of every hunk so that nothing is decided during the merge.

## DOVE

Everything happens in `~/jjodel-release`. Files written: the ones the merge resolves; `docs/claude-code-log.md` and `docs/claude-code-log-archive.md` (step C); `docs/log-inbox/merge-gate.md` (entry of this lane); `docs/prompts/claude_2026-09-19_1740_prompt_merge_validation_skeleton.md` (this file, if untracked). No other edit outside conflict resolution.

## COME

### Step A. Re-measure and assert

`git worktree list`; `git rev-parse --abbrev-ref HEAD` is `alfonso-frontend-jjtl`; no `MERGE_HEAD`; `git status --short` empty; `git fetch origin` then `git rev-parse validation-skeleton origin/validation-skeleton` equal. Re-run `git merge-tree --write-tree --name-only alfonso-frontend-jjtl validation-skeleton` and `git merge-file -p` on each conflicting file against the merge-base; write the counts in the inbox entry. Expected after `P-2026-09-19-1730`: the same ten files or fewer, with the IR trio reduced to take-branch hunks plus the `separatorColorStyle` rebuild. If a file not in the gate report conflicts, stop and report.

Create the P14 symlink `frontend/node_modules -> ~/jjodel/frontend/node_modules`, and measure the baselines on the trunk before merging, from `frontend/`: `npm run typecheck` (error count; the report says 33), `npx vitest run` (pass/fail counts), `npm run build`. Measure the same three on the branch tip by reading its own log entries or, if absent, note that the branch baseline is unknown.

### Step B. Merge and resolve

`git merge --no-ff --no-commit validation-skeleton`. Resolve each file as follows, nothing else:

| file | resolution |
|---|---|
| `docs/archivio/claude_milestone_validazione_scheletro.md` | take trunk (branch side is the shared original, the trunk edited it twice) |
| `docs/decisions.md` | take branch on the hunk (the trunk side is a strict prefix); then verify: every `**R-...**` id of both refs present once, no duplicate `##`, no marker; R-IRN-35, R-IRN-36 and RC-14 from `P-2026-09-19-1735` must survive (they sit outside the hunk) |
| `docs/spec/spec_attive.md` | take branch (both hunks) |
| `SymbolEditorModal.tsx`, `SymbolEditorModal.scss`, `frontend/src/utils/lastViewpoint.ts` | take branch in all six hunks (branch side is a superset of #139); note the z-index becomes `var(--z-alert, 10000)` |
| `irTypes.ts`, `irCompile.ts` | take branch; then diff the `cornerRadius` declarations and compile lines against the trunk's: they must be equivalent after `P-2026-09-19-1730`; if not, stop |
| `IRNodeContent.tsx` | take branch on the hunk, then rebuild `separatorColorStyle` (trunk parity S2, used outside the hunk at two sites) from the resolved per-axis `borderColor` (R-IRN-36); remove nothing else of the trunk's parity code (`underline`, label colour, resolved `cornerRadius`) and nothing of the branch's paint path |
| `docs/claude-code-log.md` | union by entry heading (`## YYYY-MM-DD — ...`), both sides, newest first, each entry verbatim once (RC-12); do not rotate here; Check D will be red, declared in the body |

Then `git status` must show only the resolved files and the auto-merged ones; no untracked file added. Gates from `frontend/` through the symlink: `npm run typecheck` (must not exceed the trunk baseline; the report expects the compiler to find more than the two overlaps the reading found, so list every new error and fix only those caused by the merge, in the merge itself), `npx vitest run` (no test failing that passed on either side; `ir.test.ts` in particular, the trunk's parity snapshots plus the branch's three commits), `npm run build`, `npm run check:agents`, `npm run check:docs` (Check D red is expected and declared; everything else green).

Commit the merge with `git commit` (no pathspec on a merge), subject `merge: reintegrate validation-skeleton into alfonso-frontend-jjtl (P-2026-09-19-1740)`, body: the gate report path and sha; RC-14 as the rule; the declared RC-13 exception (docs and code in one commit, by construction of a merge); the declared RC-11 derogation on Check D until the next commit; the resolution table above in one line per file; `11bd784b6` (subject `reminder`) accepted as is; the P6 trailer `Model: ...`. Hard stop for the visual check is after step C, not here.

### Step C. Rotate the log (P13 exclusive lane, its own commit)

With the merged tree the tool exists: from `frontend/`, `npm run log:rotate -- --fold --rotate --write`, then de-duplicate `docs/claude-code-log-archive.md` by heading keeping the first occurrence verbatim (the auto-merge leaves 7 duplicate headings and 36 entries present in both files; the gate report section 5.2 has the numbers). `npm run check:docs` must be fully green (active log ≤ 40). One docs commit with pathspec on the two log files, subject `docs: rotate and de-duplicate the log after the reintegration merge (P-2026-09-19-1740)`.

Then the inbox entry for this lane in `docs/log-inbox/merge-gate.md` (with the Step A counts, the gate results, the list of merge-caused fixes) and this prompt file if untracked: one docs commit.

### Step D. Hard stop for Alfonso's visual check (P8)

Leave the symlink in place, start `npm run dev` from `~/jjodel-release/frontend` (note the port Vite prints; `~/jjodel`'s server may hold 3000), and stop. Alfonso checks, hard refresh, five items: the Symbol Editor modal paints above the Properties rail; a view born from the tree "+" has an IR and renders; a new object view in a syntax viewpoint has the native chrome (border, radius 8, underlined name, themed separator: R-IRN-29); a diamond with an authored corner radius renders rounded and an ellipse ignores it (R-IRN-35); "Create edge view" and "Create row view" exist in the v2 canvas menus and produce views. Any failure: report, no fix in this lane without a new GO.

### Step E. After Alfonso's OK

Stop the dev server, remove the symlink, `git status --short` empty. Push the trunk: `git push origin alfonso-frontend-jjtl` (the branch was pushed first, precondition). Report the merge sha, the log commit sha, the gate numbers, and the port used.

Never: `git add .`, `git stash`, `git rebase`, `git push --force`, history rewriting, squash, edits outside the resolution table (a merge-caused compile error is fixed in the merge and listed in the body; anything else is a ticket).

## RIFERIMENTI

- Gate report `docs/discovery/discovery_2026-09-19_merge_gate_validation_skeleton.md` (`7f16439ff`), sections 5, 6, 9; open questions answered by Alfonso on 2026-09-19: 1 and 2 → R-IRN-35/36, 3 → branch side, 4 → merge commit (RC-14), 6 → step C, 7 → simulator commits come with the merge, 8 → accepted, 10 → branch first, 11 → `HARNESS-DOCS.md` 1.2 lands stale, ticket `2b1cc6d05` stays open, 12 → freeze declared by Alfonso.
- `docs/decisions.md` R-IRN-29..36, RC-11, RC-12, RC-13, RC-14; `docs/PROTOCOL.md` P8, P13, P14.
- `P-2026-09-19-1730` inbox entry on the branch: the post-alignment merge-file counts.
