# EMSE dataset — raw, uninterpreted headline figures

> Generated 2026-06-09 by a read-only extraction pass on branch `alfonso-frontend-jjtl`.
> **These numbers are raw and uninterpreted.** No analysis, coding, or conclusions are included here.
> Each line points to the raw file under this directory that produced it. Counting-method caveats are
> flagged in §6. Do not cite a figure without reading its source file and caveat.

## 1. Git history  (`git/`)
- total commits (all branches): **2075**  — `git/totals.txt`
- date span: **2021-03-31 → 2026-06-08**  — `git/totals.txt`
- distinct calendar days with ≥1 commit: **641**  — `git/commits_per_day.txt`
- branch under study ahead of `origin/master`: see `git/branch_divergence.txt`
- authors (commit counts): `git/authors_commitcount.txt`, `git/authors_commits.txt`
- full commit log (pipe-delimited CSV): `git/commits.csv`
- per-commit churn (numstat blocks): `git/churn_raw.txt`

### Commit-type prefixes (Conventional Commits)  — `git/commit_types.txt`
```
 219 fix
  64 feat
  33 docs
  25 chore
  15 style
  12 build
  11 refactor
   8 test
   8 perf
   4 revert
```

### Top 10 file hotspots (commits touching each path)  — `git/file_hotspots_top100.txt`
```
 219 src/joiner/classes.ts
 186 src/redux/store.tsx
 154 src/graph/graphElement/graphElement.tsx
 146 src/common/DV.tsx
 138 docs/claude-code-log.md
 115 src/common/U.ts
 112 frontend/src/joiner/classes.ts
 110 src/redux/reducer/reducer.ts
 107 src/App.tsx
  95 src/model/logicWrapper/LModelElement.tsx
```

### Branch divergence  — `git/branch_divergence.txt`
```
fetch ok
base=origin/master
ahead_of_origin/master=791
behind_origin/master=0
```

## 2. GitHub metadata  (`github/`)
- **SKIPPED**: `gh` CLI not installed → no API data. See `github/gh-unavailable.txt`.

## 3. Codebase  (`codebase/`)
- LOC by language (wc fallback; `cloc` unavailable)  — `codebase/loc_by_lang.txt`
```
ts files=433 lines=98544
tsx files=397 lines=110163
scss files=190 lines=86091
css files=25 lines=8420
TOTAL(ts,tsx,scss,css) lines=303218
```
- largest single file: `7773 frontend/src/model/logicWrapper/LModelElement.tsx`  — full list `codebase/largest_files_top50.txt`
- tests  — `codebase/tests.txt`
```
test_files=25
test_cases_approx=682
describe_blocks=181
```
- TypeScript errors (`tsc --noEmit`): **33**  — `codebase/typecheck_summary.txt` (raw: `typecheck_raw.txt`)
- directory shape (2 levels): `codebase/dir_tree.txt`

## 4. Documentation corpus  (`corpus/`)
- prompt-log entries (`## ` headings in claude-code-log.md): **458**  — `corpus/promptlog_summary.txt`
- prompt-log outcome markers + per-type tally: `corpus/promptlog_summary.txt`, raw headings `corpus/promptlog_headings.txt`
- session files (`sessione_*.md`) in repo: **1**  — `corpus/session_files_list.txt` (most live in the chat KB, not the repo)
- discovery docs (docs/discovery/*.md): **75**  — `corpus/discovery_docs_list.txt`
- spec docs (spec_*.md): **0**  — `corpus/spec_docs_list.txt`
- discipline-marker mentions across docs/ (substring counts): `corpus/gate_signals.txt`
```
hard_stop_mentions=158
layer_impact_report_mentions=84
visual_verification_mentions=14
critical_zone_mentions=111
```

## 5. Prompt-log outcome / type tally (verbatim from extraction)
```
log_entries=458
--- outcomes ---
 471 ✅
--- types (from headings) ---
  22 — chore
  59 — docs
 104 — feat
 191 — fix
  36 — refactor
   2 — test
archive_entries=0 (no docs/claude-code-log-archive.md)
```

## 6. Counting-method caveats (read before citing)
- `cloc` unavailable → LOC is a plain `wc -l` line count (includes blanks/comments), NOT cloc "code" lines.
- `largest_files_top50.txt` first row is `wc`'s aggregate `total` line, not a file; the largest real file is reported above.
- `tsc_errors` was re-run inside `frontend/` (no root package.json); the script is defined in `frontend/package.json`. This is the project's known non-zero baseline, not a regression measurement.
- Outcome-marker counts grep emoji occurrences; an entry may contain more than one marker, so the marker total can exceed the entry count.
- `commit_types.txt` counts only commits whose subject STARTS with a Conventional-Commits prefix; non-conforming subjects are uncounted (not shown as a residual).
- `gate_signals.txt` are case-insensitive substring hits across all of docs/ (includes this dataset's own prose if re-run); treat as upper bounds.
- Churn/hotspots span ALL branches (`--all`); merge and branch duplication are not de-duplicated.
