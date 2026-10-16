# Prompt: #172 reopened, a reference row shows Open once

Prompt-ID: P-2026-10-13-1300
Chat: C-2026-10-13-1256
Lane: fast (one code file outside the critical zone, the line already read by the chat; one visual hard stop at the end)
Depends: P-2026-10-10-1545
Front: standalone-editor
Request: none (no URL: Juri asked in a local Claude Code session on 2026-10-13; his words are `request.md` in the lane folder, RC-43)
Status: eseguito 2026-10-13 · lane fix/172-open-once · 4288e509c · verifica visiva passata 2026-10-13
Limite: 45 minuti

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply (all, unless this prompt says otherwise).
Deroga: P4 non si applica (motivo: fast lane, RC-3: no separate report; the BEFORE run of step 2 is the preventive check and goes in the entry in at most ten lines).

Director of this lane: **Juri**. Where `docs/PROTOCOL.md` and `docs/decisions.md` say «Alfonso» (GO, the
RC-26 list, the visual GO), Juri decides for this lane.

Critical zone: none. The one code file sits under `components/abstract/tabs/`, no row of the root rules
file §3.1. No Layer Impact Report is owed.

Worktree: `/Users/juridirocco/development/jjodel-172`, branch `fix/172-open-once`, cut from `staging` at
`7e774497c`; `frontend/node_modules` is a symlink to the main tree's (P14: do not remove it). Before
anything else: `pwd` is that worktree, the branch is `fix/172-open-once`, `git log -1` is the commit that
adds this file (subject `docs: add prompt P-2026-10-13-1300, #172 a reference row shows Open once`),
`git status` is empty; otherwise stop with `Outcome: blocked`.

## Lane discipline

Every reply of this session opens with `[P-2026-10-13-1300 · session <id>]` (`session unknown` if you cannot
see it, never invented). Every final message ends with one line:
`Outcome: done | hard-stop | question | blocked`. Every question that has a recommendation carries it in one
line: `Recommended: <one line>`. A message with another Prompt-ID, or with none, is not acted on (P13).

## Context (read by the chat on `7e774497c`: verify, do not trust; re-measure where a number counts)

Issue #172 was closed on 2026-10-12 by P-2026-10-10-1545, which this lane corrects, and reopened by @tmaog
on 2026-10-13 (`gh issue view 172 --comments`, the last comment). His test confirms the new interaction
and reports one redundancy: on a row of a reference section «Open» is on screen twice, as the glyph at the
right end of the card and as the first item of the row's menu. He proposes two ways out: the three actions
as icons inside the card and no menu; or no glyph in the card, Open staying in the menu, the card still
opening on a click.

Read in `frontend/src/components/abstract/tabs/InstanceDetail.tsx` (`RefSlotsSection`): the card is
`button.instance-manager__ref-link` (`:558-583`) and ends with
`<i className="bi bi-box-arrow-in-right" aria-hidden="true" />` (`:582`), drawn on every row that resolves;
the menu button is drawn when `hasRowMenu(row)` (`:587`, `jjform/refSlot.ts:117`), and its menu lists
`open` first with the same glyph (`ROW_ACTION`, `:131-135`). So a row with a menu shows the glyph twice.

**Decision of the chat (RC-25): the second proposal.** The first would amend R-REF-3, which Juri ratified
on 2026-10-12 (a menu, against one button per action), and is not taken here.

## COSA

In `RefSlotsSection`, and nowhere else: the Open glyph of the card is drawn only on a row that has no menu,
`!hasRowMenu(row)`. A row with a menu shows Open once, in its menu; a row that can only be opened keeps the
glyph, which is its one visible control. Nothing else changes: the card's `onClick`, its `title`, the menu
and its items, the broken row and its warning glyph, the inline child's «Open this child» button (`:1164`,
a contained child, #166). One comment at the changed line, citing R-REF-7, in the idiom of the comments
around it.

Acceptance criterion, read from the DOM: for every `.instance-manager__ref-row` whose card is a `button`,
the number of `i.bi-box-arrow-in-right` inside the card plus the number of `[aria-haspopup="menu"]`
buttons of the row is 1.

## DOVE

- `frontend/src/components/abstract/tabs/InstanceDetail.tsx`: the one line of the card's glyph and its comment.
- `docs/decisions.md`: the row **R-REF-7**, after the paragraph of R-REF-6 and before `## R-GEN`, in the
  form of the rows above it: «(2026-10-13, provisional, unattended (RC-25), evidence: measured, verified:
  none, reversible: trunk) — **A row of a reference section shows Open once.** A row with a menu draws no
  Open glyph in its card: Open is the first item of the menu, and a click on the card still opens the
  target (R-REF-3, unchanged). A row that can only be opened has no menu and keeps the glyph. Decided by
  the chat `C-2026-10-13-1256` on @tmaog's test of 2026-10-13 in #172, taking the second of his two
  proposals; the first (the actions as icons in the card, no menu) would amend R-REF-3 and is not taken.»
- `docs/log-inbox/data-manager-ux.md`: the closing entry (the `log-entry` skill, P9 format), with
  `Corregge: 2026-10-10 15:45` and `Causa: (d)`, or another letter if what you measure says otherwise.
- this prompt's `Status` line.

Not committed: `frontend/scripts/smoke/_tmp_172b_probe.ts`. If the AFTER run shows that the card needs a
style rule (step 4), stop and ask: `instanceManagerTab.scss` is not in this list. Any other file: stop and ask.

## COME

1. Read the root rules file (§5, §6, §17, §21), `docs/PROTOCOL.md` P6, P9, P11, P12, P13, P16,
   `docs/decisions.md` RC-17, RC-25 and R-REF-1..6, the last five entries of `docs/claude-code-log.md`,
   and `RefSlotsSection` whole.
2. **The probe**, `frontend/scripts/smoke/_tmp_172b_probe.ts`, port guard `3172`. The chat copied into this
   worktree the gitignored files of P-2026-10-10-1545: `_tmp_172_probe.ts` (take its boot, its fixture
   MM172 through `_tmp_172_setup.js`, its two hosts and its helpers), `_tmp_172_setup_verify.ts`,
   `_tmp_172_smoke.ts`. Count failures with `const r = await …; failures += r;` (`npm run check:scripts`).
   Run only through the launcher, in the foreground:
   `node frontend/scripts/lane-run.mjs probe . frontend/scripts/smoke/_tmp_172b_probe.ts --port 3172 --id P-2026-10-13-1300`.
   `MODE=before` measures, `MODE=after` asserts. Arms, in the Data Manager on `Session_0` unless said:
   - **O1** every row of the subject's sections: key, target, glyphs in the card, menu buttons. After: the
     criterion above on every row; 0 glyphs on the rows of `goal`, `teacher`, `learners`, `rooms`.
   - **O1.ctl** (P12, same run): the row of `frozen` (read-only, no menu) has 1 glyph and 0 menu buttons,
     so «0 glyphs» elsewhere is not a blind selector. Both modes.
   - **O2** a click on the card of `goal` opens its target as the form body; Back returns. Both modes.
   - **O3** the menu of that row lists «Open» first; a click on the item opens the target. Both modes.
   - **O4** the nested sections of the inline child `Phase_0`: the criterion on every row.
   - **O5** the Configurator on the same instance: the criterion on every row.
   - **O6** `MEAS`: height and left edge of the card of `goal` and of `frozen`, and the left edge of the
     name inside each. After: the card of `goal` is as tall as before within 1 px and its name starts
     where it started; otherwise step 4.
   - **O7** no page error and no console error the BEFORE run does not have.
   Run `MODE=before` on the untouched code: O1 must measure 2 on the rows that have a menu. If it does
   not, stop with `Outcome: question`: the redundancy is not where the chat read it.
3. One docs commit, the row: `docs(#172): R-REF-7, a reference row shows Open once (P-2026-10-13-1300)`.
4. The edit, then `MODE=after`. Then the regression runs on the same port, each through the launcher:
   `_tmp_172_probe.ts` with `MODE=after STEP=3` (92/92 on 2026-10-12; report every arm that differs) and
   `_tmp_172_smoke.ts`. If O6 fails, stop with `Outcome: question` and the two measures.
5. Tests: the section does not import under node (declared by P-2026-10-10-1545). Write no unit test and
   no source-text test (root rules file §5); the probe is the measure (P11). Say so in `Notes`.
6. Gates, all in the foreground, from `frontend/`, each read on its **complete** output with its exit
   status: `npm run typecheck` (exit 0, no `error TS`: the baseline is zero, RC-48), `npm run test` (the
   nine files red at import of the root rules file §17, nothing else red), `npm run build` (exit 0),
   `npm run check:docs`, `npm run check:addonly`, `npm run check:scripts`.
7. One code commit, `fix(#172): a reference row shows Open once (P-2026-10-13-1300)`, with the pathspec on
   the commit itself. Body: what changed, the AFTER table in three lines, the `Model:` trailer of P6.
8. Closure, prepared and **not committed** (RC-17): the inbox entry and the `Status` line. Final message:
   the two shas, the BEFORE/AFTER table of every arm, the gates with their numbers, the diff of
   `InstanceDetail.tsx`, «Decisions taken (unattended)», «Decisions awaiting Juri», the checklist below,
   and `Outcome: hard-stop`.
9. On a message `[P-2026-10-13-1300] GO`: one commit,
   `docs(#172): lane closure, entry and Status (P-2026-10-13-1300)`, then `Outcome: done`. Do not merge.

**Visual checklist for Juri** (the chat prepares it; list it as given, do not run a browser):

1. Data Manager, an instance with references: a row with the three-dots button has no arrow in its card.
2. The card still opens the target on a click; the menu still lists Open, Change… or Remove from the list.
3. A read-only reference (no three-dots button) keeps the arrow in its card. Configurator: the same.

## NON FARE

- No edit outside DOVE; no style rule; no change to the menu, to `refSlot.ts`, to the hosts or to `IRForm.tsx`;
  no renamed class or export; no new dependency.
- `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git restore .`,
  `git clean`, `--no-verify`, push, merge, log rotation or folding, writes in another tree (the main tree is
  read-only for this lane), a port other than 3172, a comment on the issue, a background gate.

## RIFERIMENTI

- Issue #172, the comment of @tmaog of 2026-10-13 and its attachment; `docs/decisions.md` R-REF-1..6;
  `docs/ratifiche/claude_2026-10-12_memo_172_references_once.md`.
- `InstanceDetail.tsx:131-135, 532-603`; `jjform/refSlot.ts:117`; `instanceManagerTab.scss` (`&__inline-link`,
  `&__ref-link`, `&__ref-row`), read only.
