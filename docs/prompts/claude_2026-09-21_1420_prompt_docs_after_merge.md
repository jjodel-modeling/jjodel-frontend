# Prompt: docs repair after the reintegration merge (Check B, register language, HARNESS-DOCS)

Prompt-ID: P-2026-09-21-1420
Repo: `~/jjodel-release` (worktree of `alfonso-frontend-jjtl`, the trunk, HEAD `8916f2f08` or later
by docs commits only). Docs only. Do not touch `~/jjodel` or `~/jjodel-sim`. No file under `frontend/`.
Effort: high (docs, out of the critical zone). Read `CLAUDE.md` (§17, §21), `docs/PROTOCOL.md` (P6, P9,
P13) and the last ten entries of `docs/claude-code-log.md` first.
Every message opens with `[P-2026-09-21-1420 · session <id>]`. A message with a different or missing ID
is not executed.

Context. The merge lane `P-2026-09-19-1740` (2026-09-21) left three documented residues, all declared
under RC-11 in `docs/log-inbox/merge-gate.md`: Check B of `npm run check:docs` is red because the log
rotation folded seven entries from the trunk's own inboxes that miss or mis-format `Corregge`/`Causa`
(ten field errors); the 1735 lane wrote R-IRN-35, R-IRN-36 and RC-14 in English inside an Italian
register (`docs/decisions.md`); `docs/HARNESS-DOCS.md` is at 1.2 with clause range P1..P12 while
`PROTOCOL.md` has P1..P15 (ticket `2b1cc6d05`). This lane closes the three. It takes no decision on
`.tracer/` (Alfonso's) and does not rotate the log (P13, not needed: the active log is at 40).

## COSA

1. **Check B green without rewriting history.** The log is add-only (§21) and forbids back-filling
   `Corregge`/`Causa` on entries older than the commit that introduced the two fields. So, per entry:
   if the entry predates that commit, the gate must tolerate it, not the entry change; if the entry
   postdates it, the field is filled with `—` (the honest value when nothing is corrected) or with the
   letter its Notes already state, and nothing else in the entry moves. Phase 1 decides which case
   each of the seven is.
2. **Register language.** Translate the three entries R-IRN-35, R-IRN-36 and RC-14 in
   `docs/decisions.md` into Italian, same meaning, same ids, same position, ASCII apostrophes as the
   neighbours; the English sentence that names the section-10 question stays as a parenthetical.
   `docs/PROTOCOL.md` stays English: its P14 reintegration paragraph is not touched.
3. **`HARNESS-DOCS.md`** 1.2 → 1.3: the clause range becomes P1..P15 wherever the file states it, and
   the four call sites that 1735's report says cite the range are re-read for consistency. Nothing
   else in the file changes.

## DOVE

Phase 1 reads only. Phase 2 writes: `docs/claude-code-log.md` (only the fields named in the Phase 1
report, only on entries the report classifies as post-rule), `frontend/scripts/check-docs.ts` or
wherever Check B lives (only if Phase 1 shows a pre-rule entry that the gate must tolerate: a date
cut-off or the commit sha of the rule, never a per-entry exception list; this is the one file under
`frontend/` allowed, and only then), `docs/decisions.md` (three entries), `docs/HARNESS-DOCS.md`,
`docs/log-inbox/harness.md` (this lane's entry), `docs/discovery/discovery_2026-09-21_check_b_after_fold.md`
(Phase 1 report, mandatory), `docs/prompts/claude_2026-09-21_1420_prompt_docs_after_merge.md` (this
file, if untracked).

## COME

**Phase 1, read-only, hard stop.** `git worktree list`, HEAD on `alfonso-frontend-jjtl`, no
`MERGE_HEAD`, `git status --short` empty. Create the P14 symlink `frontend/node_modules ->
~/jjodel/frontend/node_modules`. Run `npm run check:docs` from `frontend/` and copy Check B's output
verbatim into the report. For each of the seven entries: heading, the inbox it came from (the fold
commit `491fc1c4b` shows it), the date, the sha of the commit that introduced `Corregge`/`Causa` in
P9 (`git log -S'Corregge' --format='%h %ad %s' --date=short -- docs/PROTOCOL.md` gives it), and the
verdict pre-rule or post-rule. Read Check B's code and say whether it already has a date or sha
cut-off. Read the three English entries and the neighbouring Italian ones for register. Read
`HARNESS-DOCS.md` and list every line that states the clause range. Write the report (objective,
files read with full paths, the table of seven, findings, risks, open questions), commit it alone
with pathspec, remove the symlink, and stop. Alfonso decides in chat.

**Phase 2, after GO.** Edits as small as the report allows. Symlink back for the gates. One commit
for the log fields (if any), one for the gate cut-off (if any, with a test that a pre-rule entry
passes and a post-rule entry without the fields fails), one for `decisions.md`, one for
`HARNESS-DOCS.md`, one for the inbox entry plus this prompt file if untracked. Pathspec only, never
`git add .`. `npm run check:docs` fully green at the end (A, B, C, D); `npm run check:agents` green
(no `CLAUDE.md` change expected, run it anyway). Symlink removed, `git status --short` empty. Subjects
in English with the Prompt-ID; body with the P6 `Model:` trailer from the session banner. No push:
report the shas and stop.

## RIFERIMENTI

- `docs/log-inbox/merge-gate.md`, entries of 2026-09-21 (the RC-11 declaration and the seven entries).
- `docs/claude-code-log.md` after `491fc1c4b`; `docs/claude-code-log-archive.md` untouched.
- `docs/decisions.md` R-IRN-35, R-IRN-36, RC-14 (`ca23ae72a`); their neighbours R-IRN-34 and RC-13 for
  register.
- `docs/PROTOCOL.md` P9 (entry format, the `Corregge`/`Causa` rule), P13, P14 (reintegration
  paragraph, untouched), P15.
- CLAUDE.md §21.3 (no back-filling), §17 (check:docs semantics), §5 (a test is judged by the mutations
  it kills).
