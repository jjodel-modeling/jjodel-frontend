# Prompt: typecheck baseline to zero, slice 3 of 3: the norms and the merge templates say zero

Prompt-ID: P-2026-10-12-2002
Chat: C-2026-10-12-1955
Lane: full (more than 3 files; governance files). One phase: every edit is a sentence the chat quotes below, no visual check is due.
Depends: P-2026-10-12-2000, P-2026-10-12-2001
Front: harness
Request: none (no URL: Juri asked in a local Claude Code session on 2026-10-12; his words are `request.md` in the lane folder, RC-43)
Status: eseguito 2026-10-13 · lane fix/typecheck-baseline-zero · 8a8575ec0
Limite: 60 minuti

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply (all, unless this prompt says otherwise).
Deroga: P4 non si applica (motivo: no discovery phase and no hard stop before the edit; the sentences to change were read by the chat on `38f0add16` and are quoted below, and step 2 stops the lane if the tree is not at zero).
Deroga: P8 non si applica (motivo: no file under `frontend/src` changes; nothing renders differently).

Director of this lane: **Juri**. Where `docs/PROTOCOL.md` and `docs/decisions.md` say «Alfonso» (GO, the
RC-26 list, the digest), Juri decides for this lane.

Governance: this lane edits `CLAUDE.md` and regenerates `AGENTS.md` on the branch
`fix/typecheck-baseline-zero`. The go-ahead to write them **on this branch** is Juri's request of
2026-10-12, «risolvere una volta per tutte i 14 errori di baseline»: a baseline that the rules file still
states as 14 is not resolved. The merge of the branch is not this lane's, and it needs Juri's own yes for
the governance files (`lane-run merge … --governance-goahead`, RC-26). P15 holds: the commit that changes
`CLAUDE.md` is owed to the trunk `alfonso-frontend-jjtl`, and the entry of this lane says so.

Worktree: `/Users/juridirocco/development/jjodel-tc0`, branch `fix/typecheck-baseline-zero`;
`frontend/node_modules` is a symlink to the main tree's (P14: do not remove it). This lane is the third of
three. The chain stopped on a question of slice 2, which the chat answered; this prompt is committed by the
chat with the subject the chain would have written, and started with `lane-run start`. Before anything else: `pwd` is that worktree, the branch is
`fix/typecheck-baseline-zero`, `git log -1` is the commit that adds this file (subject
`docs: add prompt P-2026-10-12-2002, lane 3/3 of chain-P-2026-10-12-2000`), its parent is the closure of
slice 2 (`docs: lane closure, entry and Status (P-2026-10-12-2001)`), `git status` is empty; otherwise stop
with `Outcome: blocked`.

## Lane discipline

Every reply of this session opens with `[P-2026-10-12-2002 · session <id>]` (`session unknown` if you
cannot see it, never invented). Every final message ends with one line:
`Outcome: done | hard-stop | question | blocked`. Every question that has a recommendation carries it in
one line: `Recommended: <one line>`. A message with another Prompt-ID, or with none, is not acted on (P13).
Every commit of this lane is made before the final message, and the tree is clean when it ends.

## Context (read by the chat on `38f0add16`: verify, do not trust)

Slices 1 and 2 (P-2026-10-12-2000, P-2026-10-12-2001) cleared the 14 typecheck errors the baseline had
carried: 7 files, 8 lines, in the code commits `b3f44be17` and `315c62715`. Measured by the lanes and again
by the chat on `34a800d43`: `npm run typecheck` exits 0 with no `error TS` line. In the six files of slice
1 only types change: their emitted JavaScript is byte-identical under tsc, the production bundle is
byte-identical (3501 files of `dist`, sha256), and under esbuild five are identical while `Dummy.ts` has one
local renamed (`i2` back to `i`). `src/api/data.ts` gains one imported name, `DDataType`, and a browser
probe measured the Ecore import of a datatype equal before and after.

The number 14 is still written as a live norm in six places (search of 2026-10-12 over `*.md`, `*.mjs`,
`*.ts`, `*.json` outside `docs/prompts`, `docs/discovery`, the logs, the inboxes, `docs/ratifiche`,
`docs/sessioni` and `docs/archivio`, which are history and stay as they are):

1. `CLAUDE.md` §2, «Test before considering a task done»: «`npm run typecheck` must pass without
   introducing new errors. A known baseline of pre-existing errors exists; verify your change does not
   increase the count.»
2. `CLAUDE.md` §17, «Verification gates before commit»: «`npm run typecheck` must pass without introducing
   new errors. Baseline: **14** pre-existing errors, listed by file and code […]. Verify your change does
   not increase the count.»
3. `AGENTS.md`, generated from `CLAUDE.md`: the same two sentences.
4. `docs/HARNESS-DOCS.md` §6, the row of `npm run typecheck`: «Baseline: 14, elencati per file e codice in
   `CLAUDE.md` §17 (misurata il 2026-09-24)», state «verde rispetto alla baseline».
5. `frontend/scripts/tsconfig.json`, a comment: «would change both the `npm run typecheck` baseline (14
   errors) and the build perimeter».
6. The two merge templates: `frontend/scripts/lane-templates/merge-into-trunk.md` step 6, «typecheck 14,
   §17 set;», and `frontend/scripts/lane-templates/trunk-into-branch.md` step 7, «typecheck exit 2 with the
   §17 set (14);».

Read and left alone: the typecheck gate of a direct merge (`frontend/scripts/lane-run.mjs`, the `GATES`
loop) is green when the set of errors after the merge equals the receiving tip's, by file and code. With
an empty set on the trunk that is the same test as «exit 0», so the code does not change. One consequence
for the chat, not for this lane: the merge that brings this branch into a trunk still at 14 reads
«gone: 14» and is red by construction.

`docs/decisions.md`: the last RC row the chat read is RC-47, so the next free id is **RC-48**. Read the
file again: if RC-48 is taken, use the next free id wherever this prompt says RC-48, and say so in the
final message.

## COSA

The baseline stops being a number. Five edits of text, one regeneration, one decision row.

1. `CLAUDE.md` §2. The sentence of point 1 above becomes:
   «`npm run typecheck` must exit 0. There is no baseline of pre-existing errors (§17).»
2. `CLAUDE.md` §17. The whole bullet of point 2 above becomes one bullet:
   «`npm run typecheck` must exit 0, with no `error TS` line. The baseline is **zero** from 2026-10-12:
   P-2026-10-12-2000 and P-2026-10-12-2001 cleared the 14 errors it had carried (RC-48,
   `docs/decisions.md`). An error on your tree is yours, or a regression of the tip that you prove by
   running the typecheck on the tip; it is never recorded as pre-existing, and no list of known errors is
   kept here again. Fix it or stop.»
   Nothing else in `CLAUDE.md`: not the «Last calibration» line, not the §5 account of 2026-08-13 (history).
3. `AGENTS.md` and every other generated file: `npm run gen:agents` from `frontend/`, never by hand. Commit
   every file the generator changed; `AGENTS.md` at the root is expected, any other is reported.
4. `docs/HARNESS-DOCS.md` §6, the row of `npm run typecheck`. Second cell: «`tsc --noEmit`. Baseline: zero
   dal 2026-10-12 (RC-48; `CLAUDE.md` §17): nessun errore pre-esistente». Third cell: «verde = exit 0».
   The other rows and the table header stay as they are.
5. `frontend/scripts/tsconfig.json`, the comment: «baseline (14 errors)» becomes «baseline (zero errors,
   RC-48)». Comment only.
6. `frontend/scripts/lane-templates/merge-into-trunk.md` step 6: «typecheck 14, §17 set;» becomes
   «typecheck exit 0, no error (§17, RC-48);». `frontend/scripts/lane-templates/trunk-into-branch.md`
   step 7: «typecheck exit 2 with the §17 set (14);» becomes «typecheck exit 0, no error (§17, RC-48);».
   Those words only; the rest of each line is byte-identical.
7. `docs/decisions.md`: one row **RC-48** right after RC-47, in the form of the rows above it:
   «- **RC-48** (2026-10-12, decided by Juri in chat `C-2026-10-12-1955`, «risolvere una volta per tutte
   i 14 errori di baseline», evidence: measured, verified: none, reversible: trunk): **The typecheck
   baseline is zero.** `npm run typecheck` exits 0: P-2026-10-12-2000 and P-2026-10-12-2001 cleared the 14
   errors the baseline had carried (7 files, 8 lines: in six files only types change and the production
   bundle is byte-identical, `b3f44be17`; `src/api/data.ts` gains one imported name and the Ecore import
   of a datatype measures equal before and after, `315c62715`). From here an `error TS` line is a red gate, on a lane and on a
   merge, and no list of known errors is kept again: `CLAUDE.md` §2 and §17, `docs/HARNESS-DOCS.md` §6 and
   the two merge templates say so (P-2026-10-12-2002). The typecheck gate of a direct merge compares
   error sets and is unchanged: against an empty set it is the same test.»
   Check the two shas and the numbers against what this branch holds (`git diff --stat 38f0add16 HEAD -- frontend/src`)
   and write what you measure if it differs.

## DOVE

Code commit (the three are under `frontend/`):

- `frontend/scripts/tsconfig.json`: one comment line.
- `frontend/scripts/lane-templates/merge-into-trunk.md`: the typecheck words of step 6.
- `frontend/scripts/lane-templates/trunk-into-branch.md`: the typecheck words of step 7.

Docs commit:

- `CLAUDE.md`: the sentence of §2, the bullet of §17.
- `AGENTS.md`: regenerated.
- `docs/HARNESS-DOCS.md`: one row of the §6 table.
- `docs/decisions.md`: the row RC-48.

Closure commit:

- `docs/log-inbox/harness.md`: the closing entry (the `log-entry` skill, P9 format).
- `docs/prompts/claude_2026-10-12_2002_prompt_typecheck_zero_s3_gate_at_zero.md`: the `Status` line.

Nine files, above five (rule 19, P6): they are listed here with what changes in each, and the entry
repeats the count under RC-11. Any other file: stop and ask. In particular `frontend/scripts/lane-run.mjs`,
`docs/PROTOCOL.md`, `.claude/settings.json` and every file under `frontend/src` are not touched.

## COME

1. Read the root rules file whole (it is the file you edit), `docs/PROTOCOL.md` P6, P9, P13, P15, P16,
   `docs/HARNESS-DOCS.md` §6, `docs/decisions.md` RC-7, RC-11, RC-17, RC-20, RC-21 and RC-45..47 for the
   form of a row, the last five entries of `docs/claude-code-log.md`, and the two templates.

2. **The tree is at zero, or this lane does not run.** From `frontend/`, in the foreground:
   `npm run typecheck`, complete output kept in `~/.jjodel-lanes/P-2026-10-12-2002/` with the exit status.
   It must be exit 0 with no `error TS` line. Anything else: stop with `Outcome: blocked` and the list;
   do not write that the baseline is zero on a tree that is not.

3. **The search, again** (root rules file §5: `command grep`, not the wrapper; a positive control first).
   Search the tree for the live mentions of the old baseline, with the exclusions of the Context, and
   compare with its six points. A live mention the chat missed: stop with `Outcome: question` and
   `Recommended:` the one-line edit; do not add a file to DOVE on your own.

4. The edits of COSA 5 and 6. Gates for them, foreground, from `frontend/`: `npm run typecheck:scripts`
   (exit 0), `npm run check:scripts` (exit 0), `npx vitest run scripts/hooks scripts/gates` (0 failed; a
   test that pinned the old words of a template is reported, not edited: stop with `Outcome: question`).
   Then the **code commit**, pathspec on the commit itself:
   `chore(harness): merge templates expect a zero typecheck baseline (P-2026-10-12-2002)`, with the
   `Model:` trailer of P6.

5. The edits of COSA 1, 2, 4 and 7, then `npm run gen:agents`. Gates, foreground, from `frontend/`:
   `npm run check:agents` (exit 0), `npm run check:docs` (exit 0), `npm run check:addonly` (exit 0). Then
   the **docs commit**, pathspec on the commit itself:
   `docs: the typecheck baseline is zero, RC-48 (P-2026-10-12-2002)`, with the `Model:` trailer. Its body
   names the commit as owed to the trunk `alfonso-frontend-jjtl` (P15).

6. **The branch's closing measure**, every gate in the foreground, from `frontend/`, read on its
   **complete** output with its exit status: `npm run typecheck` (exit 0, no error), `npm run test` (the
   nine files of §17 red at import, nothing else red), `npm run build` (exit 0), `npm run check:docs`,
   `npm run check:agents`, `npm run check:scripts`, `npm run check:addonly`, `npm run typecheck:scripts`
   (exit 0 each).

7. Closure, at once (no visual check, RC-17): the entry in `docs/log-inbox/harness.md` and this prompt's
   `Status` line, `Status: eseguito <YYYY-MM-DD> · lane fix/typecheck-baseline-zero · <sha of step 5>`,
   in one docs commit, `docs: lane closure, entry and Status (P-2026-10-12-2002)`. In the entry:
   `Corregge` and `Causa` are `—`; `Regressions: no` only if step 6 read as expected;
   `Out-of-scope changes: no`; `Layer Impact Report: not-required`; `Smoke visivo: non applicabile`;
   `Notes` within 500 characters: the two derogations, the nine files, and the sentence «the docs commit
   <sha> changes `CLAUDE.md` and is owed to `alfonso-frontend-jjtl` (P15)».

8. `git status` is empty. Final message: the three shas; the search of step 3 with its control; every
   gate of step 6 with its numbers and exit status; the diff of the seven files of the code and docs
   commits; «Decisions taken (unattended)»; «Decisions awaiting Juri» (the merge and its governance
   go-ahead, the push, the carry to `alfonso-frontend-jjtl`); then `Outcome: done`.

## NON FARE

- No file outside DOVE; no other sentence of `CLAUDE.md`; no hand edit of `AGENTS.md`; no change to
  `frontend/scripts/lane-run.mjs` or to a test; no edit of a past log entry, prompt, report or memo that
  says 14 (history, add-only); no new gate, script or CI step.
- No `frontend/src` file. If step 2 is not at zero, the fix is not this lane's.
- `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git restore .`,
  `git clean`, `--no-verify`, push, merge, log rotation or folding, writes in another tree (the main tree
  is read-only for this lane), a dev server, a browser, a real call to an AI provider, a background gate.

## RIFERIMENTI

- Root rules file §2, §17, §5 (the search sub-rules), §6; `docs/PROTOCOL.md` P7 (the count before and
  after, unchanged: at zero it reads «0 and 0»), P13 (docs and code never in one commit), P15.
- `docs/HARNESS-DOCS.md` §6; `frontend/scripts/lane-run.mjs`, the `GATES` loop and `typeErrors` (read only).
- Slices 1 and 2: `docs/prompts/claude_2026-10-12_2000_prompt_typecheck_zero_s1_type_only.md`,
  `docs/prompts/claude_2026-10-12_2001_prompt_typecheck_zero_s2_ecore_parser.md`, and their entries in
  `docs/log-inbox/maintenance.md`.
