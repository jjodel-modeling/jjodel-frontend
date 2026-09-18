# Discovery: fold + rotate the prompt log by script (step 1 of P-2026-09-18-2015)

Prompt-ID: P-2026-09-18-2015
Read-only. No file under `frontend/src` or `docs/*.md` written by this step besides this report.

## 1. Entry counts

Counted with the exact `ENTRY_HEADING` pattern (`^## \d{4}-\d{2}-\d{2}(?: \d{2}:\d{2})? — `),
not a bare `grep -c '^## '` (the bare form happens to agree here, but only because none of the
four files has a non-entry `## ` line).

| File | Count | Prompt's Contesto said |
|---|---|---|
| `docs/claude-code-log.md` (active) | **101** | 101 — matches |
| `docs/claude-code-log-archive.md` | **1069** | not stated |
| `docs/log-inbox/symbol-editor.md` | **7** | 7 — matches |
| `docs/log-inbox/views.md` | **9** | **5 — does not match** |

The views inbox discrepancy is not a race with another session: `docs/log-inbox/views.md` is
byte-identical between `bd56aeace` (the commit the prompt cites as "re-read on 2026-09-18") and
HEAD (`git diff bd56aeace..HEAD -- docs/log-inbox/views.md` is empty), and `git show
bd56aeace:docs/log-inbox/views.md` already counts 9. The "5" in the prompt's Contesto was wrong
at the moment it was written — it undercounts the four "item A–E" entries (2026-09-18, from
`claude_2026-09-18_1650_prompt_view_quattro_difetti_minori.md`, which despite its own title
("quattro difetti") produced five dated entries, items A through E) plus the four 2026-09-16
entries already there, minus one: 9 total, not 5. Expected total after fold in step 4 is
therefore **101 + 7 + 9 = 117** (assuming no duplicate), not the prompt's stated 113.

**Amendment (step 6)**: this table and the "117" above miss a third inbox, `docs/log-inbox/harness.md`
(1 entry) — it already existed at this discovery's time (`9a9f7952b`, 20:04:22, before this report's
own commit `5c9e88d16` at 20:22:02) but this step's scan checked only the two inboxes the prompt
named, not a dynamic listing; the real fold total, confirmed at step 4, was **118**.

## 2. Duplicate check (inbox entries already in the active log, verbatim)

Every heading line (16 total: 7 symbol-editor + 9 views) checked with an exact-substring `grep -F`
against `docs/claude-code-log.md`. **Zero matches.** No inbox entry's heading — and by extension no
inbox entry's text, since the fold-duplicate rule in the prompt is keyed on verbatim presence and
headings are the cheapest unique fingerprint — is already in the active log. The JjScript lane's
101 active-log entries are all about JjScript/simulation/validation work; the two inboxes are
Symbol Editor and views work. No overlap by subject either. `fold()` should report `duplicates: []`
on the real files.

## 3. Preamble lengths

| File | Preamble (lines before first entry heading) | Prompt said |
|---|---|---|
| `docs/claude-code-log.md` | **30** (heading at line 31) | 30 — matches |
| `docs/claude-code-log-archive.md` | **308** (heading at line 309) | 308 — matches |

Both preambles are header prose only (title, the newest-first rule, the L1–L4 sanatoria note for
the active file; title + order statement + the one flagged reconstruction for the archive) — no
entry content, confirmed by reading both in full.

## 4. `HH:mm` heading variant

`ENTRY_HEADING`'s optional `(?: \d{2}:\d{2})?` group exists for exactly **two** headings, both in
the archive, none in the active log or either inbox:

- `docs/claude-code-log-archive.md:8364` — `## 2026-05-01 22:05 — fix: ClassicZoomBridge hook-free via CustomEvent`
- `docs/claude-code-log-archive.md:8373` — `## 2026-05-01 22:32 — fix: M1 instances created by JjScript not visible in flow editor`

`parseEntries` matches group 1 (`\d{4}-\d{2}-\d{2}`) for `date` and keeps `lines[i]` (the whole
heading, time included) as `heading` — so the time is preserved verbatim in the heading text and
only ignored for date comparison/grouping. `splitLog` (moved regex, same source) must do the same:
the entry's raw `text` starts at the full heading line as written (with the time if present), and
`rotate`'s date-based warning check must compare on the date group only, matching `parseEntries`'s
own behavior, or the two archive entries will misreport as anomalies they are not (their neighbors
are same-day, see file around those lines — not re-verified line by line here, out of this step's
short-discovery budget; flag for step 2's tests).

## 5. Ordering anomalies in the active log (entry dated later than the entry immediately above it)

Computed on all 101 dates in file order (position 0 = first/newest entry at line 31). **Two**
anomalies, both pre-existing and both already inside the file (not touched by this task):

1. Line 822 → line 840: `2026-09-13 — discovery: the simulation engine as it stands, against the
   computational model` immediately followed by `2026-09-14 — chore(jjscript): la corsia A
   riportata su alfonso-frontend-jjtl, cinque commit` — a 09-14 entry below a 09-13 entry.
2. Line 2075 → line 2105: `2026-09-04 — fix(jjtl): accept newlines inside nested object creation`
   immediately followed by `2026-09-05 — docs: discovery delle skin della form del Data Manager
   (R-SKIN, Fase 1)` — a 09-05 entry below a 09-04 entry.

Both anomalies are entirely inside the first 40 entries' worth of *position* only in the second
case (line 2105 is deep in the file, past where a `keep=40` cut would land — position ~68 of 101,
so it moves into the archive under `rotate`); the first (position ~27) also moves. Per the prompt's
own spec, `rotate` must emit a `warnings[]` line for each when it runs on the real files, since the
moved block (whichever positions 41..101 become) contains entries dated later than the kept block's
last entry in both cases. Exact warning wording is a step-2 decision, not this step's.

## Rule 19 listing (code commit, step 2 — reproduced from the prompt, unchanged)

Six files, over the rule-19 threshold of 5, declared per rule 1c/19 (already declared in the
prompt's own DOVE section):

1. `frontend/scripts/gates/log-tools.ts` — new. Pure module: `ENTRY_HEADING`, `LOG_MAX_ENTRIES`,
   `splitLog`, `rotate`, `fold`.
2. `frontend/scripts/gates/rotate-log.ts` — new. CLI: `--fold`, `--rotate`, `--keep=40`, `--write`.
3. `frontend/scripts/gates/__tests__/log-tools.test.ts` — new. Verbatim invariants, fold/rotate
   cases, mutation bench.
4. `frontend/scripts/gates/check-docs.ts` — edit: import `ENTRY_HEADING`/`LOG_MAX_ENTRIES` from
   `log-tools.ts` (drop the local copy), add Check D (`> 40` fails, non-empty inbox warns).
5. `frontend/package.json` — edit: add the `log:rotate` script.
6. `frontend/vitest.config.ts` — edit: `include` gains `scripts/gates/__tests__/**/*.test.ts`.

## Open items for step 2 (not resolved here, this step is read-only)

- Confirm with a synthetic fixture that `splitLog`'s per-entry `text` boundary (heading of entry
  N+1, exclusive) matches `parseEntries`'s implicit boundary (next `ENTRY_HEADING` match or EOF) —
  same regex, same scan, should be automatic, but the verbatim-invariant test is what actually
  proves it, not this reading.
- The two archive `HH:mm` headings are the only fixture proving `splitLog` tolerates the variant;
  the synthetic-fixture test set the prompt asks for (§ COME item 2) must include one.
- Expected fold total is **117**, not the prompt's **113** — step 2's dry-run and step 4's hard
  stop should report against 117, with the discrepancy noted rather than silently reconciled.
