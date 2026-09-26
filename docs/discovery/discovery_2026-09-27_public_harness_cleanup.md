# Discovery: public-repo cleanup after opening the harness, Phase 1

**Prompt-ID**: P-2026-09-27-0214. **Prompt**: `docs/prompts/claude_2026-09-27_0214_prompt_public_harness_cleanup.md`.
**Session**: `916693ee-2013-46ea-ba02-79b3c6952342` (launched by `lane-run`, `-p`). **Tree**: `~/jjodel-release`,
branch `alfonso-frontend-jjtl`, HEAD `283eab4f2`. **Executor**: Opus 5.5 (`claude-opus-5-5`), as the session
banner shows. **Claude Code**: 2.1.283.

This report is a set of hypotheses with evidence, not a reference. Whoever uses it downstream rereads the
real files. Tags: **[M]** measured in this phase on `283eab4f2`, **[R]** read from a file.

**No email address is written in this report.** Where a quote would carry one, the address is replaced by
`<email>` and only its domain class is named; this is the one declared departure from «verbatim».

## 0. Preconditions

`pwd` `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, `git log -1` `283eab4f2 docs: add prompt
P-2026-09-27-0214, public-repo cleanup`, `git status --porcelain` empty [M]. Read: `CLAUDE.md`,
`docs/PROTOCOL.md` P1-P6, P9, P12, P13, P16, `docs/decisions.md` RC-16..RC-29, the top entry of
`docs/claude-code-log.md`, `docs/log-inbox/harness.md` [R].

## 1. Objective and hypotheses

Objective: measure the five items of the prompt's Context before any write, so that Phase 2 removes exactly
what it declares, ignores nothing else, and pseudonymizes every email of the dataset.

| # | Hypothesis (from the prompt) | Verdict |
|---|---|---|
| H1 | `.claude/` tracks two memory files, `scheduled_tasks.lock`, `settings.json` and three skills; `settings.local.json` is not tracked | **holds** (§2) |
| H2 | fifteen LaTeX build files are tracked under `docs/`, the patterns of COSA 4 catch them and no other tracked file | **partly**: the fifteen are exactly those; the `_build/` pattern also catches a tracked `main.pdf`, and no listed pattern covers `docs/jjtl-jjel-paper.log` (§3) |
| H3 | the emails of the dataset live in four files: `commits.csv`, `authors_commits.txt`, `authors_commitcount.txt`, `harness-attribution-commits.csv` | **partly**: `authors_commitcount.txt` holds no email; the other three do; no other dataset-like file holds one (§4) |
| H4 | no tracked script regenerates the dataset | **holds** (§5) |
| H5 | the controls of COSA 5 attest the pseudonymization | **falsified** for the positive control (P12), **partly** for the negative one (§8) |
| H6 | the PDF was added in `f6ad47d` | **falsified**: added in `1c8647eed` (2026-06-20) (§9) |
| H7 | the Phase 2 gate `git diff --stat f6ad47d..HEAD` inside DOVE only can pass | **falsified**: 26 files already differ before this lane writes (§8) |

## 2. `.claude/` in the index (question 1)

`git ls-files .claude | command grep -c .` → `7`, exit 0 [M]. The list, verbatim [M]:

```
.claude/projects/-Users-alfonso-Library-Mobile-Documents-com-apple-CloudDocs-Sviluppo-jjodel-jjodel-2-jjodel/memory/MEMORY.md
.claude/projects/-Users-alfonso-Library-Mobile-Documents-com-apple-CloudDocs-Sviluppo-jjodel-jjodel-2-jjodel/memory/project_header_redesign.md
.claude/scheduled_tasks.lock
.claude/settings.json
.claude/skills/discovery-report/SKILL.md
.claude/skills/log-entry/SKILL.md
.claude/skills/status-flip/SKILL.md
```

`git ls-files --error-unmatch .claude/settings.local.json` → `did not match any file(s) known to git`, exit 1;
positive control through the same command on `.claude/settings.json` → the path, exit 0 [M]. `.gitignore:64`
reads `.claude/settings.local.json` [R]. The file is also absent from disk in this worktree (`ls -la .claude/`)
[M]. `scheduled_tasks.lock` holds a `sessionId`, a `pid` and a `procStart` of 2026-07-10 [M]. No other
`.claude/` directory is tracked anywhere in the repo (`git ls-files | command grep -E '(^|/)\.claude/' |
command grep -v '^\.claude/'` → no line, exit 1; the first filter matched the seven above) [M].

The two proposed patterns, tested with `git ls-files -c -i --exclude=<p>` and `-o -i` [M]: `.claude/projects/`
catches the two memory files and nothing untracked; `.claude/*.lock` catches `scheduled_tasks.lock` and nothing
untracked. Both contain a slash, so both are anchored to the root.

`.gitignore:62` reads `/CLAUDE.md` [R]; `git check-ignore -v --no-index CLAUDE.md` →
`.gitignore:62:/CLAUDE.md	CLAUDE.md`, exit 0, while `git ls-files --error-unmatch CLAUDE.md` lists it [M]. The
pattern is anchored: removing it changes nothing for the sub-directory `CLAUDE.md` files.

## 3. LaTeX build files and the proposed patterns (question 2)

`git ls-files docs | command grep -E '\.(aux|bbl|blg|fdb_latexmk|fls|log|out|toc|dvi|synctex\.gz)$'`, exit 0,
verbatim [M]:

```
docs/jjtl-jjel-paper.aux
docs/jjtl-jjel-paper.dvi
docs/jjtl-jjel-paper.fdb_latexmk
docs/jjtl-jjel-paper.fls
docs/jjtl-jjel-paper.log
docs/jjtl-jjel-paper.out
docs/jjtl-jjel-paper.toc
docs/mde-intelligence-2026/paper/_build/main.aux
docs/mde-intelligence-2026/paper/_build/main.bbl
docs/mde-intelligence-2026/paper/_build/main.blg
docs/mde-intelligence-2026/paper/_build/main.fdb_latexmk
docs/mde-intelligence-2026/paper/_build/main.fls
docs/mde-intelligence-2026/paper/_build/main.log
docs/mde-intelligence-2026/paper/_build/main.out
docs/mde-intelligence-2026/paper/_build/main.synctex.gz
```

Fifteen lines, identical to the prompt's list. Outside `docs/` no tracked file has those extensions (`.log`
excluded from that search on purpose) [M].

Each proposed pattern, tested on tracked (`-c -i`) and untracked (`-o -i`) files [M]:

| Pattern | Tracked files caught | Untracked on disk |
|---|---|---|
| `docs/**/*.aux` | `jjtl-jjel-paper.aux`, `_build/main.aux` | none |
| `docs/**/*.bbl`, `*.blg`, `*.synctex.gz` | the `_build/main.*` one each | none |
| `docs/**/*.fdb_latexmk`, `*.fls`, `*.out` | the two of each | none |
| `docs/**/*.dvi`, `*.toc` | `jjtl-jjel-paper.*` one each | none |
| `docs/mde-intelligence-2026/paper/_build/` | the eight `_build/main.*` **plus `_build/main.pdf`** | none |
| `docs/**/*.log` (not proposed; tested) | `jjtl-jjel-paper.log`, `_build/main.log` | none |

Two findings:

- **F3.1** `docs/mde-intelligence-2026/paper/_build/main.pdf` is tracked (added in `5c20b58d9`, 2026-06-20,
  `docs: add MDE Intelligence 2026 paper project and research notes`) and the `_build/` directory pattern would
  ignore it. It is a tracked file outside the fifteen, a stop condition of the prompt. The paper's own PDF is
  `docs/mde-intelligence-2026/paper/main.pdf` (463443 bytes); `_build/main.pdf` is a second build output
  (414304 bytes) [M]. The prompt, line 32: «The `.tex` and `.pdf` of both papers stay.» [R]
- **F3.2** No pattern of COSA 4 covers `docs/jjtl-jjel-paper.log`: `*.log` is not in the list (prompt line 48:
  «Do not use bare `*.log`»), and it is not under `_build/`. After `git rm --cached` it would show as untracked
  (`??`) in every `git status` of this tree. `_build/main.log` is covered by the `_build/` pattern.

## 4. Emails under `docs/` (question 3)

`git grep -I -c -E '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[a-z]{2,}' -- docs`, exit 0, 20 files [M]:

| File | Matching lines | Classes of address (domain only) | Scope |
|---|---|---|---|
| `docs/discovery/emse-dataset/git/commits.csv` | 2073 | univaq.it, student.univaq.it, live.it, gmail.com ×4, users.noreply.github.com | **dataset, in scope** |
| `docs/analysis/harness-attribution-commits.csv` | 1357 | univaq.it, live.it, gmail.com ×4, fbk.eu, `noreply@anthropic.com` | **dataset, in scope** |
| `docs/discovery/emse-dataset/git/authors_commits.txt` | 11 | the same eight addresses as `commits.csv` | **dataset, in scope** |
| `docs/discovery/emse-dataset/git/churn_raw.txt` | 4 | none: false positive, `frontend/node_modules/tinycolor2/deno_asserts@0.168.0.mjs` (`churn_raw.txt:78101`) | no email |
| `docs/analysis/harness-attribution.md` | 1 | `noreply@anthropic.com` only (line 73) | exempt class |
| `docs/claude-code-log-archive.md`, `docs/redesign/COMPLETED-phase-1-tokens.md`, `docs/sessioni/claude_sessione_2026-08-15_{2,3,6}.md`, `docs/prompts/claude_2026-08-15_2230_prompt_anteprima_realistica_d8.md` | 1 each | `noreply@anthropic.com` only | exempt class |
| `docs/prompts/claude_2026-09-27_0214_prompt_public_harness_cleanup.md` | 1 | `noreply@anthropic.com`, `permissions@acm.org`, `info@jjodel.io` | exempt class |
| `docs/mde-intelligence-2026/paper/acmart.cls` | 5 | `permissions@acm.org` only | exempt class |
| `docs/HANDOVER_COMPLETO.md` | 2 | `info@jjodel.io`, one `@example.com` placeholder | not personal; listed |
| `docs/mde-intelligence-2026/paper/main.tex` | 5 | univaq.it, in `\email{...}` (lines 45, 51, 57) | paper author contact; not a dataset; listed |
| `docs/discovery/2026-05-25_role_segregation_rationale.md` | 1 | univaq.it (line 46, `**Autore**: Alfonso Pierantonio <email>`) | authorship line; not a dataset; listed |
| `docs/spec/parcheggiate/spec_parcheggiata_templates_explore.md`, `..._featured_projects.md` | 1 each | univaq.it (lines 26 and 19, «Primo curator») | prose; not a dataset; listed |
| `docs/discovery/discovery_2026-07-31_instances_left_rail.md`, `docs/discovery/discovery_2026-08-05_censimento_primitive_ui.md` | 1 each | gmail.it, the hardcoded admin address that the app code itself carries (`censimento_primitive_ui.md:59` cites `LeftBar.tsx:408-412`) | quotes code; not a dataset; listed |

No dataset-like file outside the prompt's list carries an email: `churn_raw.txt` is the only other dataset
file with a match, and its four matches are one `node_modules` path [M]. The other `harness-attribution-*.csv`
files and every other file under `docs/discovery/emse-dataset/` have no match (they are absent from the 20) [M].

**F4.1** `docs/discovery/emse-dataset/git/authors_commitcount.txt` holds no email. It is `git shortlog -sn`
output, name and count only: line 1 ` 892 Damiano Di Vincenzo`, nine lines [M]. The prompt, line 35:
«and `authors_commitcount.txt` (`Name <email>` lines)» [R]. Phase 2 has nothing to replace there.

## 5. Email columns and generators (question 4)

- `commits.csv:1` reads `hash|author|email|date_iso|subject`: pipe-delimited, the email is field 3 [R]. 2075
  lines, every data row has exactly 5 fields, and no row carries an email outside field 3 (awk over the file) [M].
  LF line endings [M].
- `harness-attribution-commits.csv:1` has 36 comma-separated columns; `email` is the 6th (index 5), after
  `author` [R]. Parsed with Python's `csv`: 1357 data rows, all with 36 fields, no email in any other column [M].
  CRLF line endings, 532 double quotes in the raw text [M].
- For every distinct address, the raw-text occurrence count equals the email-field occurrence count, in both
  CSVs (no mismatch printed) [M]. A textual replacement of each exact address is therefore identical to a
  field replacement, and leaves every other byte (quotes, CRLF) untouched.
- `authors_commits.txt` lines read `  723	Alfonso Pierantonio <email>` (`git shortlog -sne` shape) [M].

Distinct addresses [M]: `commits.csv` 8, in order of first appearance a01..a08 (a01 is the univaq.it address of
the first data row, 723 rows); `authors_commits.txt` 8, the same eight; `harness-attribution-commits.csv` 8, of
which 3 are not in `commits.csv`: `noreply@anthropic.com` (69 rows, author `Claude (cloud)` or `Claude`), one
gmail.com and one fbk.eu. Three addresses carry two author-name spellings each, and three author names appear
with two addresses each across `commits.csv` and the attribution CSV (the rule of COSA 5 keeps two ids for them).

Generators: `git grep -l 'commits.csv' -- frontend/scripts docs` → only `docs/analysis/harness-attribution.md`,
`docs/discovery/emse-dataset/SUMMARY.md` and this prompt, exit 0 [M]. `git grep -l 'harness-attribution-commits'`
(whole repo) → the `.md` and this prompt; `git grep -l -E 'authors_commits|authors_commitcount'` → `SUMMARY.md`
and this prompt [M]. Positive control through the same tool: `git grep -l 'lane-run' -- frontend/scripts` →
`frontend/scripts/lane-run.mjs` and its test [M]. `SUMMARY.md:3` reads «Generated 2026-06-09 by a read-only
extraction pass»; `harness-attribution.md:3` reads «**Data**: 2026-08-28» and names no script [R]. **No tracked
script regenerates the dataset**; the stop condition does not fire.

`harness-attribution.md:73` reads «`Claude <noreply@anthropic.com>` o `Claude (cloud) <noreply@anthropic.com>`,
prodotti da sessioni» [R]: the analysis names that address as its marker.

## 6. The mapping file (question 5)

`ls -la ~/.jjodel-lanes/emse/author-map.csv` → `No such file or directory`, exit 1; positive control:
`ls -la ~/.jjodel-lanes/` lists `P-2026-09-26-2340` ... `P-2026-09-27-0214`, `_probe`, exit 0 [M]. The directory
`~/.jjodel-lanes/emse/` does not exist either. Phase 2 creates the file; nothing to extend.

## 7. `check:docs` baseline (question 6)

`npm run check:docs` from `frontend/`, exit 0 [M]: `4/4 check(s) passed, 3 warning(s)`. The three warnings: the
unresolved `Corregge` of `P-2026-09-26-1335` (`docs/claude-code-log.md:163`) and of `P-2026-09-25-1353`
(`:325`), and `lane "harness" (docs/log-inbox/harness.md) has 2 entry(ies) waiting to be folded`. Active log
40 entries (threshold 40).

## 8. The Phase 2 controls as written

- **F8.1 (P12) The positive control does not discriminate.** Prompt line 62: «the positive control
  `git grep -c 'a01' docs/discovery/emse-dataset/git/commits.csv` must be greater than zero». On the untouched
  file it already prints `docs/discovery/emse-dataset/git/commits.csv:16`, exit 0 [M]: `a01` occurs inside
  hex hashes. It passes whether the replacement ran or not. A field-delimited control, `git grep -c -E '\|a01\|'
  docs/discovery/emse-dataset/git/commits.csv`, reads no line, exit 1, on the same file [M], and must read 723
  after the replacement (the rows of a01).
- **F8.2 The negative control misses two classes.** `git grep -I -E '[A-Za-z0-9._%+-]+@(gmail|live|univaq|student\.univaq)\.'`
  matches today 2072 lines of `commits.csv`, 1284 of `harness-attribution-commits.csv`, 9 of
  `authors_commits.txt` [M], but not the fbk.eu address (4 rows of the attribution CSV) nor the
  `users.noreply.github.com` address (3 rows of `commits.csv`, 2 lines of `authors_commits.txt`). A wider
  control over the four files, every address except `noreply@anthropic.com`, catches both.
- **F8.3 The diff gate cannot pass.** Prompt line 124: «`git diff --stat f6ad47d..HEAD` inside DOVE only». Today,
  before any write, it lists 26 files, among them `frontend/scripts/lane-run.mjs`, `frontend/scripts/hooks/*`
  and eight prompt and ratification files [M]: the commits from `cd5eb9eb5` to `283eab4f2` of other lanes. The
  lane's own base is `283eab4f2`.

## 9. The items for the ticket paragraph

- `978-3-030-43946-0_9.pdf` (1514138 bytes) was added by `1c8647eed` on 2026-06-20, `chore: add research
  reference inputs (FTG/PM harness XMIs, background notes, source PDF)` [M], not by `f6ad47d` (prompt line 23-24);
  it has been in the history since June. `f6ad47d` is an ancestor of HEAD [M].
- The same commit added `harness_FTG_PM.xmi`, `harness_FTG_PM_generic.xmi`, `harness_FTG_PM_reference.xmi` and
  `background_spec_driven_development.md`, all tracked at the root today [M].
- `git grep -l 'localhost:3001' -- docs | command grep -c .` → `95` [M], the prompt's count.
- `docs/mde-intelligence-2026/paper-outline.md:128` reads «FTG+PM sources (the Springer book chapter already in
  the repo, `978-3-030-43946-0_9.pdf`)» [R]: after commit 1 that sentence is stale. Outside DOVE.

## 10. Risks

- Index-only removals (`git rm --cached`) keep the files on disk; without the matching ignore line they show as
  untracked in every later `git status` of this shared tree (F3.2).
- The replacement must not rewrite the CSVs through a CSV writer: quoting and CRLF of the attribution CSV would
  change. A textual replacement of the exact addresses is byte-safe (§5).
- `harness-attribution.md:73` names `noreply@anthropic.com` as the marker; replacing it in the CSV would make the
  document and its data disagree.
- The mapping file lives outside every tree and is the only way back from ids to addresses; losing it is
  unrecoverable from the repo by design (the history still holds the addresses).

## 11. Files read

`CLAUDE.md`; `docs/PROTOCOL.md`; `docs/decisions.md` (RC-16..RC-29); `docs/claude-code-log.md` (top entry);
`docs/log-inbox/harness.md`; `docs/prompts/claude_2026-09-27_0214_prompt_public_harness_cleanup.md`; `.gitignore`;
`.claude/scheduled_tasks.lock`; `docs/discovery/emse-dataset/SUMMARY.md` (lines 1-40 and a grep);
`docs/discovery/emse-dataset/git/commits.csv`, `authors_commits.txt`, `authors_commitcount.txt`,
`churn_raw.txt` (head and matches), `commits_per_day_author.txt`, `file_hotspots_top100.txt`, `totals.txt`,
`commit_types.txt`, `branch_divergence.txt` (heads); `docs/analysis/harness-attribution.md` (lines 1-25 and a
grep); `docs/analysis/harness-attribution-commits.csv`; the matching lines of the 20 files of §4;
`docs/mde-intelligence-2026/paper-outline.md:128`; `docs/discovery/discovery_2026-09-26_orchestrated_lanes_harness.md`
(shape only).

## 12. Questions

1. `_build/main.pdf` is tracked and the `_build/` pattern would ignore it (F3.1): how is `_build/` ignored?
   Recommended: write `docs/mde-intelligence-2026/paper/_build/*` plus `!docs/mde-intelligence-2026/paper/_build/main.pdf`, so no tracked file outside the fifteen is ignored and `_build/main.pdf` stays tracked.
2. `docs/jjtl-jjel-paper.log` is covered by no pattern (F3.2): add one?
   Recommended: add the exact path `docs/jjtl-jjel-paper.log` to `.gitignore`, no `*.log` pattern of any scope.
3. `authors_commitcount.txt` holds no email (F4.1): what does Phase 2 do with it?
   Recommended: leave it byte-identical and say so in the commit 3 body; three dataset files change, not four.
4. `noreply@anthropic.com` sits in the email column of 69 rows of `harness-attribution-commits.csv`: replace it?
   Recommended: keep it verbatim, it is a vendor service address, not personal data, and `harness-attribution.md:73` names it as the analysis marker.
5. Three addresses of the dataset files are not in `commits.csv` (one gmail.com and one fbk.eu, plus `noreply@anthropic.com`): which ids?
   Recommended: a09 and a10 for the two personal ones, in order of first appearance in `harness-attribution-commits.csv`; the GitHub noreply address of `commits.csv` gets its id (a07) like any other.
6. The positive control `git grep -c 'a01'` passes on the untouched file (F8.1): replace it?
   Recommended: use `git grep -c -E '\|a01\|' docs/discovery/emse-dataset/git/commits.csv`, 0 before, 723 expected after, both in the commit 3 body.
7. The negative control misses fbk.eu and `users.noreply.github.com` (F8.2): widen it?
   Recommended: run the prompt's grep as written and, beside it, `git grep -I -E '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[a-z]{2,}'` on the three changed files filtered of `noreply@anthropic.com`, which must be empty.
8. `git diff --stat f6ad47d..HEAD` already lists 26 files of other lanes (F8.3): which base?
   Recommended: `git diff --stat 283eab4f2..HEAD`, the lane's base commit, inside DOVE plus this report.
9. `paper-outline.md:128` calls the PDF «already in the repo» (§9): edit it?
   Recommended: leave it (outside DOVE) and name it in the ticket paragraph beside the root XMIs.

## 13. Decisions taken (unattended)

None: every point above is a question with a recommendation for the chat (RC-21). Nothing was written apart from
this report.

## 14. Decisions awaiting Alfonso

None of the RC-26 list. The removal of the root PDF is Alfonso's decision of 2026-09-27, cited in the prompt;
every other removal is from the index only, the files stay on disk.
