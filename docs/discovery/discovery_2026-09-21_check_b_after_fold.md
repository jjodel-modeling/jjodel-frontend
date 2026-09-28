# Discovery report: Check B after the fold, register language, HARNESS-DOCS range

Prompt-ID: P-2026-09-21-1420 (Phase 1, read-only). Repo `~/jjodel-release`, worktree of
`alfonso-frontend-jjtl`, HEAD `f2ef6951f` (the commit that added the prompt file; the prompt itself is
tracked, so the "if untracked" clause of DOVE is moot). Session: Cowork, Claude Fable 5.1,
`session_01CsANnqfCfL4miZkx94iSZp`. Date: 2026-09-21.

## 1. Objective

Classify the seven log entries that turn Check B of `npm run check:docs` red after the fold
`491fc1c4b` as pre-rule or post-rule with respect to the commit that introduced the `Corregge`/`Causa`
fields, so that Phase 2 knows whether the gate must tolerate them or the entries take the sentinel.
Read the gate's code for an existing date or sha cut-off. Read the three English entries of
`docs/decisions.md` and their Italian neighbours for register. List every line of `docs/HARNESS-DOCS.md`
that states the clause range. No file was modified; the only writes are this report and the two
temporary files described in section 9, removed before the commit.

## 2. Preconditions measured

- `git worktree list`: `~/jjodel` at `4d8a93124` on `validation-skeleton`, `~/jjodel-release` at
  `f2ef6951f` on `alfonso-frontend-jjtl`, `~/jjodel-sim` at `577cc52b5` on `simulation-engine`.
- HEAD of `~/jjodel-release`: `alfonso-frontend-jjtl`, `f2ef6951f 2026-09-21 docs: prompt
  P-2026-09-21-1420, docs repair after the reintegration merge`. Ahead of the prompt's `8916f2f08` by
  that one docs commit only.
- No `MERGE_HEAD` in the worktree's git dir. `git status --short` empty before the run.
- Last commits with a `Claude-Session` trailer: `f2ef6951f` (chat `019t1ZvzWVFWF3XbvGm3MNtX`, the
  prompt), then `857cb9335` and `25cd6149a` of 2026-09-14. No concurrent chat on the tree in the last
  hours; the GO states no other lane on the two trees.
- P14 symlink created: `frontend/node_modules -> /Users/alfonso/jjodel/frontend/node_modules`.
  Node picked from `~/.local/bin/node` (v26.8.1): the nvm default is v18.20.8 and rejects
  `--experimental-strip-types`, the Homebrew node is v23.3.0. Gates were run with v26.8.1.
- Active log: 40 entries (Check D at threshold, green). Inboxes waiting: `merge-gate` 3 entries,
  `simulation` 3 entries, all six with `Corregge: —` and `Causa` in the `(x)` or sentinel form
  (grep), so the next fold adds no Check B error. `docs/log-inbox/harness.md` holds its header only.

## 3. Files read (full paths)

- `/Users/alfonso/jjodel-release/docs/prompts/claude_2026-09-21_1420_prompt_docs_after_merge.md`
- `/Users/alfonso/jjodel-release/CLAUDE.md` (§17 lines 583-606, §21 lines 638-700)
- `/Users/alfonso/jjodel-release/docs/PROTOCOL.md` (header lines 1-16, P6 lines 51-64, P9 lines
  91-119, P13 lines 194-237)
- `/Users/alfonso/jjodel-release/docs/claude-code-log.md` (headings of the first twelve entries; the
  entries at lines 56-76, 94-152, 153-248 in full)
- `/Users/alfonso/jjodel-release/docs/log-inbox/merge-gate.md` (whole file), `harness.md` (whole
  file), `simulation.md` (grep for the two fields only)
- `/Users/alfonso/jjodel-release/docs/decisions.md` (lines 1-20, 50-84, 1170-1225; grep of the whole
  file for apostrophe and accent forms and for English prose)
- `/Users/alfonso/jjodel-release/docs/HARNESS-DOCS.md` (lines 1-12, 122, 342-348, 358, 374; grep of
  the whole file for the clause range and the section headings)
- `/Users/alfonso/jjodel-release/frontend/scripts/gates/check-docs.ts` (lines 44-95 constants, 225-398
  Check B, 503-551 inbox listing)
- `/Users/alfonso/jjodel-release/frontend/scripts/gates/rotate-log.ts` and `log-tools.ts` (grep for
  `Causa`, `Corregge`, `checkLog`, `lint`: no match)
- `/Users/alfonso/jjodel-release/frontend/package.json` (the three gate scripts, lines 100-102)
- `/Users/alfonso/jjodel-release/docs/discovery/discovery_2026-09-19_merge_gate_validation_skeleton.md`
  (grep for the clause range: lines 226 and 377)
- git, read-only from the native shell: `worktree list`, `log -5` with trailers, `log -S'Corregge'`
  on `docs/PROTOCOL.md`, `CLAUDE.md` and the gate script, `log -- frontend/scripts/gates/check-docs.ts`,
  `log -- docs/HARNESS-DOCS.md`, `show` of `491fc1c4b`, `c9bd6112a`, `3d57ddff3`, `77edbfbc5`,
  `16b1e3d20`, `2b1cc6d05`.

## 4. `npm run check:docs`, Check B verbatim

Run from `frontend/` through the P14 symlink, exit 1. A, C and D pass (A: both blocks 12 lines, 627
bytes, identical; C: 38 Notes in scope, median entry 1883 bytes; D: 40 entries at threshold 40, two
non-blocking warnings for the `merge-gate` and `simulation` inboxes). Check B, copied verbatim:

```
FAIL  Check B — prompt log fields (entries dated >= 2026-08-02)
    40 entries in docs/claude-code-log.md, 1171 in the archive, 670 distinct prompt-document key(s) known
    40 entries in scope; 0 older than 2026-08-02, ignored without warning

    ERROR  value outside the CLAUDE.md §21.3 taxonomy
      file    : docs/claude-code-log.md
      entry   : ## 2026-09-19 — docs: the trunk's CLAUDE.md split brought into the branch (P-2026-09-18-2110, step 4)  (docs/claude-code-log.md:94)
      field   : **Causa**
      found   : (g) — the red gate is the active-log threshold, not the split.
      allowed : —  |  one of (a) (b) (c) (d) (e) (f) (g)  (parentheses required)

    ERROR  value outside the CLAUDE.md §21.3 taxonomy
      file    : docs/claude-code-log.md
      entry   : ## 2026-09-19 — feat(ir): object view default parity with abstract syntax  (docs/claude-code-log.md:115)
      field   : **Causa**
      found   : c — la modifica alla factory (`400095370`) non ha considerato la dipendenza di
      allowed : —  |  one of (a) (b) (c) (d) (e) (f) (g)  (parentheses required)

    ERROR  required field missing
      file    : docs/claude-code-log.md
      entry   : ## 2026-09-19 — ticket extension: the clause-range check also covers docs/HARNESS-DOCS.md  (docs/claude-code-log.md:153)
      field   : **Corregge**
      found   : (field absent)
      allowed : —  |  a prompt-document name in the form YYYY-MM-DD HH:mm, optionally followed by an annotation

    ERROR  required field missing
      file    : docs/claude-code-log.md
      entry   : ## 2026-09-19 — ticket extension: the clause-range check also covers docs/HARNESS-DOCS.md  (docs/claude-code-log.md:153)
      field   : **Causa**
      found   : (field absent)
      allowed : —  |  one of (a) (b) (c) (d) (e) (f) (g)

    ERROR  required field missing
      file    : docs/claude-code-log.md
      entry   : ## 2026-09-19 — ticket: check:docs should assert the clause range against PROTOCOL.md  (docs/claude-code-log.md:162)
      field   : **Corregge**
      found   : (field absent)
      allowed : —  |  a prompt-document name in the form YYYY-MM-DD HH:mm, optionally followed by an annotation

    ERROR  required field missing
      file    : docs/claude-code-log.md
      entry   : ## 2026-09-19 — ticket: check:docs should assert the clause range against PROTOCOL.md  (docs/claude-code-log.md:162)
      field   : **Causa**
      found   : (field absent)
      allowed : —  |  one of (a) (b) (c) (d) (e) (f) (g)

    ERROR  value is neither the sentinel nor a prompt-document name in the prescribed form
      file    : docs/claude-code-log.md
      entry   : ## 2026-09-19 — docs: split audit findings closed, gates measured in the trunk worktree, §18/§19 moved  (docs/claude-code-log.md:174)
      field   : **Corregge**
      found   : `claude_2026-09-18_1930_prompt_claude_md_split_oltre_limite.md`
      allowed : —  |  a prompt-document name in the form YYYY-MM-DD HH:mm, optionally followed by an annotation

    ERROR  value outside the CLAUDE.md §21.3 taxonomy
      file    : docs/claude-code-log.md
      entry   : ## 2026-09-19 — docs: split audit findings closed, gates measured in the trunk worktree, §18/§19 moved  (docs/claude-code-log.md:174)
      field   : **Causa**
      found   : (a) — the 21-25k estimate of that prompt is falsified and stands declared as such; the
      allowed : —  |  one of (a) (b) (c) (d) (e) (f) (g)  (parentheses required)

    ERROR  value outside the CLAUDE.md §21.3 taxonomy
      file    : docs/claude-code-log.md
      entry   : ## 2026-09-19 — docs: verbatim audit of the CLAUDE.md split (Phases 1-3) and check of §5  (docs/claude-code-log.md:194)
      field   : **Causa**
      found   : (a) — the numeric target cannot be reached inside the scope the prompt names. Second: the
      allowed : —  |  one of (a) (b) (c) (d) (e) (f) (g)  (parentheses required)

    ERROR  value outside the CLAUDE.md §21.3 taxonomy
      file    : docs/claude-code-log.md
      entry   : ## 2026-09-19 — docs: CLAUDE.md split Phase 3 — design system + language sections to nested modules  (docs/claude-code-log.md:217)
      field   : **Causa**
      found   : (a) — the prompt states the byte target as "expected around", not as one of its own
      allowed : —  |  one of (a) (b) (c) (d) (e) (f) (g)  (parentheses required)
```

Summary block of the same run:

```
==========================================================================
  PASS  A — entry-format block identity (CLAUDE.md §21.2 vs docs/PROTOCOL.md P9)
  FAIL  B — prompt log fields (entries dated >= 2026-08-02)
  PASS  C — Notes length <= 500 chars (entries dated >= 2026-08-19)
  PASS  D — active log entry count (threshold 40)

  3/4 check(s) passed, 2 warning(s)

  Do not edit the log or the documents just to turn this green:
  read what failed first.
EXIT=1
```

## 5. The rule and its date

- `77edbfbc5` (2026-08-01, `docs: narrow smoke allowlist and add rework telemetry to prompt log`) is
  the commit that introduced `Corregge` and `Causa` in `CLAUDE.md` §21.2/§21.3 and in `PROTOCOL.md` P9.
  Its body: "No back-filling: they apply from the next task on." This is the sha the prompt asks for
  (`git log -S'Corregge' -- docs/PROTOCOL.md` returns it, plus `3d57ddff3`).
- `3d57ddff3` (2026-08-02, `chore(gates): add protocol block identity check and log linter`) added
  Check B with `LINT_FROM_DATE = '2026-08-02'`: entries dated before it are ignored without warning.
  The gate therefore already has a date cut-off, and it is one day after the rule.
- `c9bd6112a` (2026-09-02, `Check B accetta solo la forma (x) per Causa`) narrowed `Causa` to the regex
  `/^\(([a-g])\)$/`: the bare letter is refused since then. The body states that the archive is never
  linted, so the narrowing touched no past entry.
- The fold `491fc1c4b` (2026-09-21) moved 15 entries from six inboxes into the active log (its body
  says seven; the merge-gate entry of steps A-C already corrects the figure). Check B does not lint
  the inbox files (`listInboxes` only counts waiting entries for the Check D warning), and neither
  `rotate-log.ts` nor `log-tools.ts` validates the fields: the errors were invisible while the entries
  sat in the inboxes and surfaced only when the fold put them in scope.

## 6. The seven entries

All seven are dated 2026-09-19: 48 days after the rule of 2026-08-01, 48 days after the gate
cut-off, 17 days after the strict `(x)` form. Every one of them is post-rule under every threshold
the history offers. There is no pre-rule entry, so the branch of COSA 1 that would touch
`frontend/scripts/gates/check-docs.ts` does not apply: Phase 2 needs no gate change.

| # | Line | Heading (abridged) | Inbox of origin (from `491fc1c4b`) | Date | Error(s) | Verdict |
|---|---|---|---|---|---|---|
| 1 | 94 | docs: the trunk's CLAUDE.md split brought into the branch (P-2026-09-18-2110, step 4) | `harness` | 2026-09-19 | `Causa` = `(g) — the red gate is the active-log threshold, not the split.` (letter plus annotation on the same line) | post-rule |
| 2 | 115 | feat(ir): object view default parity with abstract syntax | `default-view-parity` | 2026-09-19 | `Causa` = `c — la modifica alla factory ...` (bare letter, annotation over three lines) | post-rule |
| 3 | 153 | ticket extension: the clause-range check also covers docs/HARNESS-DOCS.md | `claude-md-split` | 2026-09-19 | `Corregge` absent, `Causa` absent (the block is a ticket note: it has none of the §21.2 fields) | post-rule |
| 4 | 162 | ticket: check:docs should assert the clause range against PROTOCOL.md | `claude-md-split` | 2026-09-19 | `Corregge` absent, `Causa` absent (same shape as #3) | post-rule |
| 5 | 174 | docs: split audit findings closed, gates measured in the trunk worktree, §18/§19 moved | `claude-md-split` | 2026-09-19 | `Corregge` = `` `claude_2026-09-18_1930_prompt_claude_md_split_oltre_limite.md` `` (file name instead of `YYYY-MM-DD HH:mm`); `Causa` = `(a) — the 21-25k estimate ...` (annotation on the same line) | post-rule |
| 6 | 194 | docs: verbatim audit of the CLAUDE.md split (Phases 1-3) and check of §5 | `claude-md-split` | 2026-09-19 | `Causa` = `(a) — the numeric target cannot be reached ...` (annotation on the same line) | post-rule |
| 7 | 217 | docs: CLAUDE.md split Phase 3 — design system + language sections to nested modules | `claude-md-split` | 2026-09-19 | `Causa` = `(a) — the prompt states the byte target ...` (annotation on the same line) | post-rule |

Ten field errors in seven entries, as declared under RC-11 in `docs/log-inbox/merge-gate.md`. The
count reconciles: 1 + 1 + 2 + 2 + 2 + 1 + 1.

### 6.1 What the parser sees

`parseEntries` keeps, per field, the text after `**Field**:` on the field line only; continuation
lines that do not match `^\*\*name\*\*:` are ignored by Check B. Check C measures the `Notes` span
from its line to the last line before the next field line. Two consequences for Phase 2:

- For entries #1, #2, #5, #6, #7 a line break after the letter, leaving the annotation on the next
  line as it is, makes the field value exactly `(x)` while every character of the entry stays.
  For #2 the letter also takes its parentheses (`c` becomes `(c)`), which is a form change, not a
  value change. Moving the annotations into `Notes` instead is not viable for #7: its `Notes` is 224
  characters and its `Causa` annotation 347, so the sum would break Check C (cap 500). Measured
  `Notes` lengths: #1 234, #2 266, #5 317, #6 237, #7 224.
- For #5 the `Corregge` value resolves once written in the prescribed form: `2026-09-18 19:30`
  is the `Prompt document name` of entry #7 (active log), so `2026-09-18 19:30 (` + the file name as
  annotation + `)` passes without even the well-formed-but-unresolved warning. `TIMESTAMP_PREFIX`
  admits a trailing annotation.
- For #3 and #4 the two fields are absent because the blocks are tickets, not task entries: they
  carry `**Extends**`/`**Ticket**`/`**Why**`/`**Not done here**`/`**Notes for whoever picks it up**`
  and none of the twelve §21.2 fields. The gate treats every `## YYYY-MM-DD —` heading as an entry.
  The honest value for both fields is the sentinel `—`, appended at the end of each block (the
  §21.2 order puts them after `**Outcome**`, which these blocks do not have). Entry #3 ends at line
  161 with no blank line before the heading of #4 at 162; the two appended lines fit there.

## 7. `docs/decisions.md`, register

- The three English entries are the only English entries of the file: RC-14 (lines 68-82, 15
  lines), R-IRN-35 (lines 1193-1206, 14 lines), R-IRN-36 (lines 1207-1211, 5 lines). A grep for
  ` the ` outside those ranges hits only English fragments quoted inside «...» in Italian sentences
  (lines 522, 536, 612, 617, 795, 2148-2149, 2263).
- Neighbours: RC-13 (lines 57-67, Italian, uses `è`), R-IRN-33 (lines 1160-1183, Italian, uses both
  `e'` and `è`), R-IRN-34 (lines 1184-1192, Italian, uses `è`). Whole file: 435 lines with `e' `,
  350 lines with `è`, zero curly apostrophes (`’`). "ASCII apostrophes" is satisfied by the file
  everywhere already (`un'operazione`, `l'albero`); the open choice is the accented vowel, see
  section 10.
- Structure to keep: `- **ID** (date) — **Title.** body`, id and date unchanged, position unchanged
  (RC-14 last of "Processo", R-IRN-35 and R-IRN-36 after R-IRN-34, before the R-SIM series heading).
  The em dash after the date is the file's own separator on every entry (504 lines carry one) and
  stays in the id line.
- Sentences to keep in English as a parenthetical, per COSA 2: RC-14 "Ratified on question 4 of
  section 10 of the gate report cited above." (the report is named in R-IRN-35: `docs/discovery/
  discovery_2026-09-19_merge_gate_validation_skeleton.md`), R-IRN-35 "Ratified on question 1 of
  section 10 of `docs/discovery/discovery_2026-09-19_merge_gate_validation_skeleton.md`.",
  R-IRN-36 "Ratified on question 2 of section 10 of the same gate report." Also quoted English inside
  the entries that names things by their English name and should stay quoted: `"Reintegration of a
  branch"` (the P14 paragraph title), `"not Conditional in v1"` (D5 clause), `"ignored on SVG-painted
  shapes"` (R-IRN-31 clause).
- `docs/PROTOCOL.md` is at 1.4 (2026-09-19), English P14 paragraph in place: untouched by this lane.

## 8. `docs/HARNESS-DOCS.md`, clause range

Version line 4: `Versione: 1.2 (2026-09-09).` History: `83800974f` (2026-08-15, 1.0), `eb14a614c`
(2026-08-18, 1.1), `16b1e3d20` (2026-09-10, 1.2: "the P clause range is aligned across its four call
sites (P1..P12)"). The "four call sites" of that commit are the four files `CLAUDE.md` (two lines),
`AGENTS.md` (regenerated), `docs/PROTOCOL.md` (header line 11) and `docs/HARNESS-DOCS.md` (three
lines). Re-read today:

| File | Line | Text | State |
|---|---|---|---|
| `CLAUDE.md` | 14 | `Shared engagement rules live in docs/PROTOCOL.md (P1..P15); see §1.` | current |
| `CLAUDE.md` | 108 | `come clausole P1..P15. I prompt le citano per numero.` | current |
| `AGENTS.md` | 16, 97 | same two lines, regenerated | current |
| `docs/PROTOCOL.md` | 11 | `Protocollo: docs/PROTOCOL.md — clausole P1..P15 applicabili (...)` | current (P15 is the highest `## P<n>`) |
| `docs/HARNESS-DOCS.md` | 122 | `Protocollo: docs/PROTOCOL.md — clausole P1..P12 applicabili (tutte salvo deroga esplicita nel prompt).` | stale, inside the example prompt header of §4.1 |
| `docs/HARNESS-DOCS.md` | 344 | `\| docs/PROTOCOL.md \| regole di ingaggio condivise, clausole P1..P12, citate per numero dai prompt \| ...` | stale, table of §5 |
| `docs/HARNESS-DOCS.md` | 358 | `4. docs/PROTOCOL.md, clausole P1..P12, salvo deroga esplicita e motivata nel prompt.` | stale, list of §5 |

So the Phase 2 edit to `HARNESS-DOCS.md` is four lines: 4 (version `1.3 (2026-09-21)`), 122, 344,
358. The ticket of entry #3 wondered whether line 122 is a historical example; it is the canonical
header the file tells prompt authors to copy (§4.1), and it must match `PROTOCOL.md` line 11, so
it is in scope. Line 348 of the same table says this file changes "a mano, con bump di versione",
which is the version rule the ticket referred to.

Not in scope by COSA 3 ("Nothing else in the file changes") but stale in the same file, recorded for
Alfonso: line 374 describes `npm run check:docs` as three checks (A, B, C) with "3/3, 0 warning",
while the gate has had Check D (entry count, `920b84895`, 2026-09-18) since before the merge; §4.5
does not mention `npm run log:rotate` or the inbox fold. Both belong to a HARNESS-DOCS refresh of
its own, not to this lane.

## 9. Risks and process notes

- The seven entries are add-only text under §21.3 ("existing entries stay as they are") but were
  written after the rule: the prompt's reading (post-rule entries take the sentinel or the letter,
  "nothing else in the entry moves") applies to all seven. The smallest edit set that turns Check B
  green is: two sentinel pairs appended (#3, #4), one line break after the letter in four entries
  (#1, #5, #6, #7), one line break plus parentheses in one entry (#2), one `Corregge` rewritten in
  the prescribed form keeping the file name as annotation (#5). Eight entries' worth of characters
  unchanged apart from those bytes.
- Structural cause, not closed by this lane: Check B never sees an inbox, and the fold copies
  verbatim. Every future fold can bring red entries into scope the same way. A ticket for a gate
  change (lint the inbox files with the same rules as the active log, or refuse to fold an entry
  that would fail Check B) is worth opening; it touches `check-docs.ts` or `rotate-log.ts` and is a
  lane of its own.
- `docs/HARNESS-DOCS.md` is copied in full into the Project Knowledge (its line 5): after Phase 2
  the KB copy is stale until Alfonso replaces it.
- Two temporary files were written under `docs/discovery/` during Phase 1 to carry gate and git
  output from the native shell to the reading shell (`.checkdocs_1420.tmp`, `.git_1420.tmp`,
  `.git2_1420.tmp`, `.git3_1420.tmp`); all are removed before the commit of this report and
  `git status --short` is checked empty afterwards. Nothing else was written.
- Node version: the repo's gates need Node 22+ for `--experimental-strip-types`; on this Mac the
  nvm default (v18) fails with `bad option`. Any lane running the gates here must pick
  `~/.local/bin/node` (v26.8.1) explicitly.

## 10. Open questions for Alfonso

1. **Annotated `Causa` (#1, #2, #5, #6, #7)**: line break after the letter, annotation kept on the
   following line(s) as it is (recommended: zero characters lost, Check C untouched), or annotation
   moved into `Notes` (breaks Check C on #7 and rewrites five `Notes`)?
2. **Tickets (#3, #4)**: append `**Corregge**: —` and `**Causa**: —` at the end of each block
   (recommended: the log has no ticket type and the gate has no structural way to tell a ticket
   from a task without a new convention), or open a ticket for the gate to skip blocks without an
   `**Outcome**` field and leave the two blocks as they are (Check B stays red until then)?
3. **`Corregge` of #5**: `2026-09-18 19:30 (\`claude_2026-09-18_1930_prompt_claude_md_split_oltre_limite.md\`)`
   is the proposed value; confirm the annotation is wanted or the bare timestamp is enough.
4. **Accent form in the three translated entries**: `è`/`perché` (the immediate neighbours RC-13
   and R-IRN-34) or `e'`/`perche'` (the file's majority, 435 lines against 350)? The prompt says
   "ASCII apostrophes as the neighbours", which both forms satisfy for apostrophes proper.
5. **`HARNESS-DOCS.md` line 374 and §4.5** (Check D and `log:rotate` missing): leave for a refresh of
   its own, as COSA 3 implies, or extend this lane's 1.3 to include them?
6. Ticket for the structural gap (inboxes outside Check B): open it in this lane's inbox entry as a
   ticket block, or leave it to chat?

Hard stop. Phase 2 starts only on Alfonso's GO with the answers above.
