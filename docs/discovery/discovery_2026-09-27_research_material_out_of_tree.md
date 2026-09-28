# Discovery — research material out of the tree, references to the study neutralized (Phase 1)

- **Prompt-ID**: P-2026-09-27-0051
- **Prompt file**: `docs/prompts/claude_2026-09-27_0051_prompt_research_material_out_of_tree.md`
- **Session**: `25771227`
- **Tree**: `~/jjodel-release`, branch `alfonso-frontend-jjtl`, HEAD `7b381f70a` (`docs: add prompt P-2026-09-27-0051, research material out of the tree`), `git status` empty at start [M]
- **Executor**: Anthropic Claude Opus 5.5
- **Phase**: 1, read-only. Nothing staged, moved or edited outside this report.

This report is a set of hypotheses with evidence, not a definitive reference. Whoever uses it downstream re-reads the real files.

**Notation.** The report is itself a tracked file, so it never spells the word it measures. `<W>` stands for the
four-letter pattern of the prompt's COSA 5 grep, in any case. Paths are written with the word masked
(`docs/discovery/<W>-dataset/`, `~/.jjodel-lanes/<W>/`, `~/jjodel-research/<W>/`). The false-positive classes
are named without spelling them: **P** the reflexive pronoun (`them` + `selves`), **S** the TypeScript type
`NodeProblem` + `Severity`, **A** identifiers of the vendored Ace editor modes that contain the four letters
inside a longer token (`REM` + `SERVER`, `TrayItem` + `SetText`, `...Item` + `Selected...`). **R** is a real reference:
the word alone, or as a component of a path. Tags: [M] measured in this phase on `7b381f70a`, [R] read.

A test run on this file after writing it: `git grep`-equivalent `grep -i -c '<W>'` on the report returns 0 (see the
closing note).

---

## 1. Objective

Answer the five questions of Phase 1: where the word sits in the current tree and of which kind each match is;
what the removal of the study material removes; the state of the two local folders; the `check:docs` baseline;
the rewritten lines, verbatim, for the chat to read before the GO. Then flag every conflict between the steps of
COSA before any of them runs.

## 2. Hypotheses under test

| # | Hypothesis (from the prompt's Context and COSA) | Verdict |
|---|---|---|
| H1 | Real references outside the study directories are exactly `docs/HARNESS-DOCS.md:183`, `docs/discovery/2026-06-12_template-simplification-edge-unification.md:33`, `docs/prompts/claude_2026-07-16_prompt_sessione_enrich_viewpoints_events.md:19` and the three documents of `P-2026-09-27-0214` | **Partly**: holds, plus this lane's own prompt, 18 real lines (F1) |
| H2 | No file outside `docs/` carries a real reference | **Holds**; the false positives outside `docs/` are three classes (P, S, A), not only P (F1) |
| H3 | The two paper sources carry only false positives | **Holds**: `docs/jjtl-jjel-paper.tex:339,765` and `docs/mde-intelligence-2026/paper/main.tex:299`, class P (F1) |
| H4 | `docs/claude-code-log.md` and `docs/claude-code-log-archive.md` carry only false positives | **Holds**: log `:405`, archive `:5607,6004,9301`, class P (F1) |
| H5 | After the edits, COSA 5's first control (`git grep -I -i -l '<W>' -- . ':!frontend/src' ':!frontend/public'`) can print nothing | **Falsified**: 12 files outside both exclusions carry only P or S matches and are out of scope (F2) |
| H6 | COSA 2 (the `.gitignore` guard) and COSA 5 (control 1) are compatible | **Falsified**: the guard line spells the word in a tracked file (F3) |
| H7 | COSA 5's `git ls-files ... docs/analysis/harness-attribution*` reads an absence once the files are gone | **Falsified as written**: the unquoted glob fails in zsh before git runs (F4) |
| H8 | The inbox entry of `P-2026-09-27-0214` passes the lint now and after its title changes | **Holds** (F7) |
| H9 | `~/jjodel-research/` does not exist; `~/.jjodel-lanes/<W>/` holds the mapping file only | **Holds** (F6) |

## 3. Files read

- `CLAUDE.md` (session context), `docs/PROTOCOL.md` P4, P6, P9, P10, P13, P16 (lines 1-17, 32-64, 103-160, 220-292, 368-405)
- `docs/decisions.md:157-164` (RC-21), `:199-206` (RC-26)
- `docs/prompts/claude_2026-09-27_0051_prompt_research_material_out_of_tree.md` (whole)
- `docs/log-inbox/harness.md` (whole, 41 lines)
- `docs/HARNESS-DOCS.md:1-4`, `:95`, `:175-190`
- `docs/discovery/2026-06-12_template-simplification-edge-unification.md:28-34`
- `docs/prompts/claude_2026-07-16_prompt_sessione_enrich_viewpoints_events.md:17-20`
- `docs/prompts/claude_2026-09-27_0214_prompt_public_harness_cleanup.md` and `docs/discovery/discovery_2026-09-27_public_harness_cleanup.md`: the matching lines only (grep), not whole
- `frontend/scripts/gates/log-tools.ts:6`, `:47-50`, `:213-244`; `frontend/scripts/gates/check-docs.ts:270-310`
- `.claude/settings.json` (permissions and hooks)
- `.gitignore`: grep only
- Outside the tree: `~/.jjodel-lanes/<W>/`, `~/.jjodel-lanes/P-2026-09-27-0214/`, `~/.jjodel-lanes/P-2026-09-27-0051/` (listings)

## 4. Findings

### F1 — Every tracked match of the substring, classified per line [M]

`git grep -I -n -i '<W>'` over the whole tree: 131 lines in 64 files, exit 0. Distinct tokens containing the four
letters (`git grep -I -h -o -i -E '[A-Za-z0-9_]*<W>[A-Za-z0-9_]*' | sort | uniq -c`): the word alone 63 (5 upper-case,
58 lower-case, inside paths and the grep patterns of the prompts), class P 58, class S 7, class A 32. Binary files:
`git grep -i -l` and `git grep -I -i -l` return the same list, so no binary blob matches.

| File | Lines | Class: line numbers |
|---|---|---|
| `docs/HARNESS-DOCS.md` | 1 | R: 183 |
| `docs/analysis/harness-attribution.md` | 4 | R: 7,43,45,496 |
| `docs/claude-code-log-archive.md` | 3 | P: 5607,6004,9301 |
| `docs/claude-code-log.md` | 1 | P: 405 |
| `docs/discovery/2026-06-12_template-simplification-edge-unification.md` | 1 | R: 33 |
| `docs/discovery/discovery_2026-09-01_unq1_duplicate_name.md` | 1 | S: 739 |
| `docs/discovery/discovery_2026-09-08_validazione_definita_utente.md` | 1 | S: 651 |
| `docs/discovery/discovery_2026-09-23_sim_step1_events.md` | 1 | P: 145 |
| `docs/discovery/discovery_2026-09-24_harness_gate.md` | 1 | P: 304 |
| `docs/discovery/discovery_2026-09-25_harness_bypass_gates.md` | 1 | P: 126 |
| `docs/discovery/discovery_2026-09-27_public_harness_cleanup.md` | 14 | R: 119,121,122,135,137,161,173,175,187,188,190,228,229,249 |
| `docs/discovery/<W>-dataset/SUMMARY.md` | 2 | R: 1,6 |
| `docs/jjtl-jjel-paper.tex` | 2 | P: 339,765 |
| `docs/log-inbox/harness.md` | 2 | R: 28,30 |
| `docs/mde-intelligence-2026/goal-model.md` | 1 | P: 80 |
| `docs/mde-intelligence-2026/paper/main.tex` | 1 | P: 299 |
| `docs/prompts/claude_2026-07-15_prompt_fase2_wp1_completamento_shape_live_isid.md` | 1 | P: 9 |
| `docs/prompts/claude_2026-07-16_prompt_sessione_enrich_viewpoints_events.md` | 1 | R: 19 |
| `docs/prompts/claude_2026-09-13_0100_prompt_discovery_jjel_eval_context.md` | 1 | P: 32 |
| `docs/prompts/claude_2026-09-27_0051_prompt_research_material_out_of_tree.md` | 23 | P: 30,39,56,83,96; P and R: 64; R: 26,37,43,44,45,47,49,52,62,63,78,84,85,95,97,98,105 |
| `docs/prompts/claude_2026-09-27_0214_prompt_public_harness_cleanup.md` | 14 | R: 1,33,34,56,58,61,62,78,79,80,101,105,119,138 |
| `frontend/public/webjars/ace/1.3.3/src-min-noconflict/mode-autohotkey.js` | 1 | A: 1 |
| `frontend/public/webjars/ace/1.3.3/src-min-noconflict/mode-sqlserver.js` | 1 | A: 1 |
| `frontend/public/webjars/ace/1.3.3/src-min/mode-autohotkey.js` | 1 | A: 1 |
| `frontend/public/webjars/ace/1.3.3/src-min/mode-sqlserver.js` | 1 | A: 1 |
| `frontend/public/webjars/ace/1.3.3/src-noconflict/mode-autohotkey.js` | 2 | A: 9,10 |
| `frontend/public/webjars/ace/1.3.3/src-noconflict/mode-sqlserver.js` | 1 | A: 66 |
| `frontend/public/webjars/ace/1.3.3/src/mode-autohotkey.js` | 2 | A: 9,10 |
| `frontend/public/webjars/ace/1.3.3/src/mode-sqlserver.js` | 1 | A: 66 |
| `frontend/public/webjars/jquery/3.6.0/jquery.js` | 1 | P: 10837 |
| `frontend/public/webjars/jquery/3.6.0/jquery.slim.js` | 1 | P: 8738 |
| `frontend/src/components/TreeViewSidebar/TreeViewContent.tsx` | 1 | P: 2489 |
| `frontend/src/components/editor-v2/EditorV2.scss` | 1 | P: 347 |
| `frontend/src/components/editor-v2/EditorV2.tsx` | 3 | P: 656,1201,2993 |
| `frontend/src/components/editor-v2/hooks/createAdapter.ts` | 1 | P: 341 |
| `frontend/src/components/editor-v2/hooks/deleteAdapter.ts` | 1 | P: 193 |
| `frontend/src/components/editor-v2/hooks/outlineDraw.ts` | 1 | P: 9 |
| `frontend/src/components/editor-v2/problems/conformanceToProblems.ts` | 2 | S: 13,21 |
| `frontend/src/components/editor-v2/problems/registry.ts` | 3 | S: 27,50,75 |
| `frontend/src/components/editor-v2/sim/__tests__/simBridge.test.ts` | 1 | P: 83 |
| `frontend/src/components/editor-v2/viewpoint/authoring/EdgeAuthoringPanel.tsx` | 2 | P: 64,327 |
| `frontend/src/components/editor-v2/viewpoint/authoring/FormAuthoringBody.tsx` | 1 | P: 619 |
| `frontend/src/components/editor-v2/viewpoint/authoring/RowAuthoringPanel.tsx` | 1 | P: 57 |
| `frontend/src/components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx` | 2 | P: 92,551 |
| `frontend/src/components/editor-v2/viewpoint/ir/__tests__/metaclassPin.test.ts` | 1 | P: 5 |
| `frontend/src/components/editor-v2/viewpoint/ir/formWrite.ts` | 1 | P: 60 |
| `frontend/src/components/editor-v2/viewpoint/ir/irContainment.ts` | 1 | P: 248 |
| `frontend/src/components/editor-v2/viewpoint/ir/irInteraction.ts` | 1 | P: 219 |
| `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts` | 1 | P: 434 |
| `frontend/src/components/editor-v2/viewpoint/ir/useChipOverflow.ts` | 1 | P: 138 |
| `frontend/src/components/editor-v2/viewpoint/ir/useFormWidgets.ts` | 1 | P: 440 |
| `frontend/src/components/editor-v2/viewpoint/ir/widgets/__tests__/extendedWidgets.test.ts` | 1 | P: 302 |
| `frontend/src/components/editor-v2/viewpoint/layout/vertexLayoutAdapter.ts` | 1 | P: 61 |
| `frontend/src/components/editors/properties-with-tree-view.scss` | 1 | P: 479 |
| `frontend/src/components/editors/views/data/viewoptions.scss` | 1 | P: 842 |
| `frontend/src/jjform/delete.ts` | 1 | P: 118 |
| `frontend/src/jjform/index.ts` | 1 | P: 9 |
| `frontend/src/jjodie/rag/embeddings.ts` | 1 | P: 285 |
| `frontend/src/joiner/components.tsx` | 1 | P: 36 |
| `frontend/src/model/dataStructure/GraphDataElements.tsx` | 1 | P: 844 |
| `frontend/src/model/logicWrapper/LModelElement.tsx` | 3 | P: 2022,3557,5795 |
| `frontend/src/model/simulation/__tests__/guardContext.test.ts` | 1 | P: 131 |
| `frontend/src/model/simulation/stcFromRoles.ts` | 1 | P: 44 |
| `frontend/src/services/export/__tests__/ecore-io.test.ts` | 1 | P: 271 |

Real references (R): **57 lines in 9 files**. Two of the nine leave the tree with commit 1
(`docs/analysis/harness-attribution.md` 4, `docs/discovery/<W>-dataset/SUMMARY.md` 2). The other seven are the
three single lines of the Context, the three documents of `P-2026-09-27-0214` (14 + 14 + 2) and this lane's prompt
(18), which the Context does not list because it is the prompt. **No real reference sits outside DOVE** except
the lines of this lane's prompt other than its Status line (Q3). No file outside `docs/` has a class-R match.

The word-boundary search `git grep -I -i -w -l '<W>'` returns exactly those 9 files, 57 lines, exit 0 [M]: `-w`
excludes classes P, S and A (the four letters sit inside a longer word) and keeps every R form, because `-`, `/`,
`(`, `)` and `'` are not word characters (`<W>-dataset`, `.jjodel-lanes/<W>/`, `jjodel-<W>-transcripts`,
`docs(<W>)`, `'<W>'` all matched). This is the discriminating control proposed in Q1.

The journal's full name: `git grep -I -i -c` on its first two words plus the first three letters of the third
returns nothing, exit 1 [M]; positive control through the same tool, `git grep -I -i -c 'software eng'`, returns
`background_spec_driven_development.md:2`, `docs/mde-intelligence-2026/paper/acmart.cls:1`,
`docs/mde-intelligence-2026/paper/main.tex:2`, exit 0 [M]. The full name is not in the tree.

References to the analysis files by name: `git grep -I -n 'harness-attribution' -- . ':!docs/analysis'` matches
only the 0214 prompt, the 0214 report, the harness inbox and this lane's prompt [M]; none is a path a script reads
(`git grep -n -E 'docs/analysis|analysis/' -- frontend/scripts .claude .github docs/CODEBASE-MAP.md docs/HARNESS-DOCS.md`
returns only `docs/HARNESS-DOCS.md:95`, exit 0; positive control `git grep -c 'docs/discovery' -- docs/HARNESS-DOCS.md` → 9).
`docs/HARNESS-DOCS.md:95` reads «`docs/ai-agents/` e `docs/analysis/` contengono un file ciascuno, storico: vedi §11.»
[R]: after commit 1, `docs/analysis/` holds one file again, so that line becomes true; no edit.

### F2 — COSA 5 control 1 cannot print nothing [M]

On `7b381f70a` the control as written prints 21 files, exit 0. Of them, 9 are the class-R files of F1; the other
12 carry only class P or class S matches, sit outside both exclusions, and are out of scope by the prompt:

`docs/claude-code-log-archive.md`, `docs/claude-code-log.md`, `docs/discovery/discovery_2026-09-01_unq1_duplicate_name.md` (S),
`docs/discovery/discovery_2026-09-08_validazione_definita_utente.md` (S), `docs/discovery/discovery_2026-09-23_sim_step1_events.md`,
`docs/discovery/discovery_2026-09-24_harness_gate.md`, `docs/discovery/discovery_2026-09-25_harness_bypass_gates.md`,
`docs/jjtl-jjel-paper.tex`, `docs/mde-intelligence-2026/goal-model.md`, `docs/mde-intelligence-2026/paper/main.tex`,
`docs/prompts/claude_2026-07-15_prompt_fase2_wp1_completamento_shape_live_isid.md`,
`docs/prompts/claude_2026-09-13_0100_prompt_discovery_jjel_eval_context.md`.

After every edit of DOVE, the control would still print these 12, by construction. The prompt's second control
(`git grep -I -i -l '<W>' -- frontend/src | head -3`) prints `frontend/src/components/TreeViewSidebar/TreeViewContent.tsx`,
`frontend/src/components/editor-v2/EditorV2.scss`, `frontend/src/components/editor-v2/EditorV2.tsx`, exit 0 [M]: it
is a positive control that the substring search runs, but it does not discriminate the word from the pronoun.

### F3 — The `.gitignore` guard reintroduces the word [R]

COSA 2 writes `docs/discovery/<W>-dataset/` into `.gitignore`, a tracked file; COSA 5 then requires the word in no
tracked file outside `frontend/src` and `frontend/public`. Both cannot hold. `ls -d docs/discovery/*-dataset` lists
one directory, the dataset's [M]: a guard `docs/discovery/*-dataset/` covers it today without spelling the word.
`docs/analysis/harness-attribution*` carries no word and stays as written.

### F4 — The `ls-files` control of COSA 5 fails in zsh once the files are gone [M]

The Bash tool runs zsh 5.9 (`$0` = `/bin/zsh`). An unquoted glob that matches no file is an error before git runs:
`git ls-files docs/analysis/zz-nomatch-control*` → `(eval):1: no matches found: docs/analysis/zz-nomatch-control*`,
exit 1, nothing on stdout. After commit 1, `docs/analysis/harness-attribution*` matches no file on disk, so the
control as written prints nothing because git never ran: an absence the command did not measure (`CLAUDE.md` §5).
Quoted, git expands the pathspec itself: `git ls-files 'docs/analysis/harness-attribution*'` → 7 lines, exit 0 today;
`git ls-files 'docs/analysis/zz-nomatch-control*'` → empty, exit 0.

### F5 — Tracked paths to remove, with sizes [M]

`git ls-tree -r -l HEAD -- docs/analysis docs/discovery/<W>-dataset`:

`docs/analysis/` (8 tracked files; the first stays):

| Bytes | Path |
|---:|---|
| 21706 | `docs/analysis/analysis_2026-06-08_codebase_overview.md` (**stays**) |
| 841 | `docs/analysis/harness-attribution-blame.csv` |
| 418530 | `docs/analysis/harness-attribution-commits.csv` |
| 183463 | `docs/analysis/harness-attribution-files.csv` |
| 872 | `docs/analysis/harness-attribution-fingerprint.csv` |
| 827 | `docs/analysis/harness-attribution-growth.csv` |
| 551 | `docs/analysis/harness-attribution-monthly.csv` |
| 27923 | `docs/analysis/harness-attribution.md` |

Analysis files to remove: 7, 633007 bytes.

`docs/discovery/<W>-dataset/` (29 tracked files, 24514949 bytes; relative paths):

| Bytes | Path | Bytes | Path |
|---:|---|---:|---|
| 4990 | `SUMMARY.md` | 16 | `corpus/session_dates.txt` |
| 36 | `codebase/cloc_unavailable.txt` | 60 | `corpus/session_files_list.txt` |
| 4894 | `codebase/dir_tree.txt` | 54 | `corpus/session_summary.txt` |
| 2620 | `codebase/largest_files_top50.txt` | 0 | `corpus/spec_docs_list.txt` |
| 59847 | `codebase/loc_by_file.txt` | 174 | `git/authors_commitcount.txt` |
| 139 | `codebase/loc_by_lang.txt` | 302 | `git/authors_commits.txt` |
| 1326 | `codebase/test_files_list.txt` | 78 | `git/branch_divergence.txt` |
| 56 | `codebase/tests.txt` | 24083921 | `git/churn_raw.txt` |
| 19371 | `codebase/typecheck_raw.txt` | 108 | `git/commit_types.txt` |
| 117 | `codebase/typecheck_summary.txt` | 253890 | `git/commits.csv` |
| 4320 | `corpus/discovery_docs_list.txt` | 10256 | `git/commits_per_day.txt` |
| 114 | `corpus/gate_signals.txt` | 27952 | `git/commits_per_day_author.txt` |
| 36006 | `corpus/promptlog_headings.txt` | 3905 | `git/file_hotspots_top100.txt` |
| 215 | `corpus/promptlog_summary.txt` | 108 | `git/totals.txt` |
| | | 74 | `github/gh-unavailable.txt` |

On disk the two directories hold exactly the tracked files: `find docs/discovery/<W>-dataset -type f | wc -l` → 29,
`ls -la docs/analysis` → the 8 files above, and `git status --porcelain --ignored` on both prints nothing [M].
Total removal: 36 paths, 25147956 bytes. Commit 1 therefore touches 37 paths (36 removed plus `.gitignore`), above
the five of rule 19: declared here and by the prompt.

### F6 — The two local folders [M]

- `~/jjodel-research/`: `ls -la` → `No such file or directory`, exit 1. Positive control, same tool:
  `ls -la ~/.jjodel-lanes/` lists 11 entries, exit 0. The stop condition «already exists and differs» does not apply.
- `~/.jjodel-lanes/<W>/`: mode `drwx------`, one file, `author-map.csv`, 504 bytes, mode `-rw-------`, dated
  2026-09-27 00:30. Same filesystem as the home (`df`: `/dev/disk3s5` for both), so `mv` is a rename and keeps the modes.
- `~/.jjodel-lanes/P-2026-09-27-0214/aside1` is empty, `aside2` holds `docs/` (the LaTeX build copies of that lane):
  no study material. Not touched.
- The transcripts folder of `docs/prompts/claude_2026-07-16_prompt_sessione_enrich_viewpoints_events.md:19`,
  `~/jjodel-<W>-transcripts-backup-2026-06-12`, **exists** (`ls -d` → the path, exit 0). It is not «a path that no
  longer exists», and COSA 1 does not move it (Q6).

### F7 — `check:docs` baseline and the 0214 inbox entry [M, R]

`npm run check:docs` from `frontend/` on `7b381f70a`: exit 0, `4/4 check(s) passed, 3 warning(s)` [M]. The three
warnings: the unresolved `Corregge` of `docs/claude-code-log.md:163` and `:325`, and «lane "harness" ... has 3
entry(ies) waiting to be folded». Check B reads «3 entries in 9 lane inbox file(s) under docs/log-inbox, 3 in
scope», with no problem: the 0214 entry passes as it stands [M].

After its edits it still passes [R]: the heading only has to match `ENTRY_HEADING = /^## (\d{4}-\d{2}-\d{2})(?: \d{2}:\d{2})? — /`
(`frontend/scripts/gates/log-tools.ts:6`), which the new title keeps; fields are the lines matching
`FIELD_LINE = /^\*\*([^*]+)\*\*:\s?(.*)$/` (`log-tools.ts:47`), first occurrence wins (`parseFields`, `log-tools.ts:218-225`),
so an `Edited ...` prose line between the heading and `**Prompt**` is neither a field nor a missing one. The
`Notes` of that entry carries no match, so its length is unchanged. Phase 2 measures it again.

### F8 — Where the local copies will be stale [R]

`docs/discovery/<W>-dataset/SUMMARY.md:6` and `docs/analysis/harness-attribution.md:7` name the mapping file at
`~/.jjodel-lanes/<W>/author-map.csv`. After COSA 1 the mapping file lives under the new local folder, so these two
lines of the local copies point to a path that no longer exists. The copies must stay byte-identical to the tree
for the `diff -r`/`cmp` check; the stale pointer is recorded in the commit 1 body, not fixed.

## 5. Rewrites

### 5.1 Map

`<local research folder>` stands for the folder COSA 1 creates under `~/jjodel-research/` (the prompt's
destination, whose last component is the word). Placeholders always sit inside a code span, so no Markdown
renderer reads them as HTML.

| Form in the tree | Rewritten as | Why |
|---|---|---|
| `docs/discovery/<W>-dataset[/sub]` | `<local research folder>/dataset[/sub]` | the path no longer exists; the sub-path is where the file lives now |
| `~/.jjodel-lanes/<W>[/author-map.csv]` | `<local research folder>/author-map[/author-map.csv]` | same, after the move of COSA 1 |
| `~/jjodel-research/<W>` (this lane's prompt only) | `<local research folder>` | the destination itself |
| `<W> dataset` / `<W> emails` / `<W> artifacts` (upper-case word) | `research dataset` / `dataset emails` / `research artifacts` | the prompt's wording |
| `docs(<W>):` (the quoted subject of commit `869f204eb`) | `docs(<scope>):` | a quotation of history, masked |
| `'<W>'` (grep patterns, this lane's prompt only) | `'<word>'` | a pattern that spells the word |

Applied mechanically to the 48 real lines of the four editable records (0214 prompt 14, 0214 report 14, inbox 2,
this prompt 18), the map leaves the word on one line only (this prompt `:52`). In this lane's prompt the source and
the destination of a move sit on the same line, so there the source keeps its old location with the word masked
instead: `docs/discovery/<dataset dir>/` and `~/.jjodel-lanes/<mapping dir>/` (Q3).

### 5.2 The three lines outside the 0214 documents, verbatim

Context 2 of the prompt names three lines outside the 0214 documents, not seven; F1 finds no fourth one outside
the files commit 1 removes and this lane's prompt.

1. `docs/HARNESS-DOCS.md:183`, today (masked): «discovery (`.mjs`, `.html`); `docs/discovery/<W>-dataset/` è materiale di ricerca, non harness.»
   Proposed:
   ```
   discovery (`.mjs`, `.html`); il materiale di ricerca non sta nell'albero: resta in locale, fuori dal repo.
   ```
   The line is in §4.2, the subfolder note: it describes what a subfolder holds and states no rule, so the new
   sentence changes no rule of the file. The version line (`docs/HARNESS-DOCS.md:4`, «Versione: 1.5 (2026-09-26).») is not bumped.

2. `docs/discovery/2026-06-12_template-simplification-edge-unification.md:33`, today (masked): «composition/aggregation marker work incl. a drafted `2.221 -> 2.222` migration, <W> artifacts)"»
   Proposed:
   ```
   composition/aggregation marker work incl. a drafted `2.221 -> 2.222` migration, research artifacts)"
   ```

3. `docs/prompts/claude_2026-07-16_prompt_sessione_enrich_viewpoints_events.md:19`, today the second folder is
   `~/jjodel-<W>-transcripts-backup-2026-06-12`. Proposed (Q6):
   ```
   **DOVE.** Chiedere la connessione di due cartelle: `~/jjodel-docs` e `<local transcripts folder>` (i transcript). Se la cartella transcript non esiste o non contiene il materiale della lezione su viewpoints/events, chiedere ad Alfonso dove si trova PRIMA di procedere; se non è recuperabile, passare al fallback.
   ```

### 5.3 The two titles of the 0214 records, verbatim

- `docs/prompts/claude_2026-09-27_0214_prompt_public_harness_cleanup.md:1`:
  ```
  # Prompt: public-repo cleanup after opening the harness (PDF, gitignore, local Claude Code state, LaTeX build files, research dataset pseudonymization)
  ```
- `docs/log-inbox/harness.md:28`:
  ```
  ## 2026-09-27 — chore: public-repo cleanup, PDF, local state, LaTeX builds, dataset emails (P-2026-09-27-0214)
  ```

Each of the three 0214 records gets, right under its title, the line
`Edited 2026-09-27 by P-2026-09-27-0051: references to the study neutralized, content otherwise unchanged.`
The other lines follow the map of 5.1: the 0214 prompt `:33,34,56,58,61,62,78,79,80,101,105,119,138`, the 0214
report `:119,121,122,135,137,161,173,175,187,188,190,228,229,249`, the inbox `:30`.

### 5.4 This lane's prompt, if Q3 is adopted

Map of 5.1 with the source/destination refinement: `docs/discovery/<dataset dir>` at `:26,43,49,64,78,97`;
`~/.jjodel-lanes/<mapping dir>` at `:37,47,85,98`; `<local research folder>` at `:44,45,84,105`; `'<word>'` at
`:62,63,95`. By hand, `:52`:
```
   word or as part of a path (the dataset directory, the mapping folder, the transcripts folder name), rewrite the
```
The same `Edited ...` line goes under its title; its Status line flips at closure as the prompt says.

## 6. Dependencies and risks

- **Removal is a deletion (RC-26).** Commit 1 deletes 36 tracked files from the tree. `git rm` deletes them from
  disk too: the copies are verified (`diff -r`, `cmp` per file) before it, never after.
- **Pathspec commit on deleted paths.** `bash-guard` denies a commit without pathspec (0214 inbox `Notes`), and the
  0214 lane measured that a pathspec commit re-adds a path removed with `git rm --cached` while it is still on disk.
  Here `git rm` without `--cached` removes the file from disk, so nothing is re-added; Phase 2 compares
  `git diff --cached --name-only` with the declared 37 paths before committing.
- **Commit messages are history.** The Phase 2 bodies are asked to list the removed paths, the destination and the
  grep controls with their output: each spells the word, in a message the public branch will carry (Q4).
- **The Knowledge Base copy.** `HARNESS-DOCS.md` is one of the six Project Knowledge documents (P10): its KB copy
  keeps the old line 183 until the chat syncs it. Outside this lane.
- **What stays elsewhere, outside the tree.** The lane logs under `~/.jjodel-lanes/P-2026-09-27-0214/` and
  `~/.jjodel-lanes/P-2026-09-27-0051/` spell the word (transcripts); they are not in any tree and not in COSA 1.
- **History.** Every removed file and the subject of `869f204eb` stay in the history of the public branch; out of
  scope by decision (ticket at closure, RC-26 reserves the rewrite to Alfonso).

## 7. Questions

1. COSA 5 control 1 prints 12 out-of-scope files of false positives even after every edit (F2): which control proves the tree clean?
   Recommended: `git grep -I -i -w -l '<W>' -- .` must print nothing (exit 1), with the same command on `7b381f70a` as positive control (9 files), and the prompt's substring control 1 reported alongside, expected to print exactly the 12 files of F2.
2. The `.gitignore` guard of COSA 2 spells the word in a tracked file and breaks the control of Q1 (F3): how is it written?
   Recommended: `docs/discovery/*-dataset/` under the prescribed comment, plus `docs/analysis/harness-attribution*` as written.
3. This lane's prompt carries 18 real lines and only its Status line is in DOVE (F1): is it neutralized too?
   Recommended: yes, in commit 2, with the rewrite of 5.4 and the same `Edited 2026-09-27 by P-2026-09-27-0051` line under its title.
4. The commit bodies of Phase 2 would spell the word in the public history (paths removed, destination, grep patterns): written how?
   Recommended: with the placeholders of 5.1 (`docs/discovery/<W>-dataset/` as «the dataset directory under `docs/discovery/`», the destination as `<local research folder>`, the pattern as `'<word>'`); the exact removed paths stay readable from `git show --stat` of commit 1.
5. COSA 5's `git ls-files ... docs/analysis/harness-attribution*` fails in zsh with «no matches found» once the files are gone (F4): which form?
   Recommended: quote both pathspecs so git expands them, and record the exit status next to the empty output.
6. The transcripts folder named at `docs/prompts/claude_2026-07-16_prompt_sessione_enrich_viewpoints_events.md:19` exists and is not moved (F6): which placeholder?
   Recommended: `<local transcripts folder>`, as in 5.2 item 3; the folder stays where it is.

## 8. Decisions taken (unattended)

None: this phase decided nothing; every choice above waits for the GO.

## 9. Decisions awaiting Alfonso

None new. The deletion of the 36 tracked files is an RC-26 item; Alfonso took it on 2026-09-27, as the prompt's
Context records. The rewrite of the history stays his (ticket at closure).

---

Closing note, measured after writing: `grep -i -c '<W>'` on this file → 0, with the substring control
`grep -i -c '<W>' docs/HARNESS-DOCS.md` → 1 through the same tool.
