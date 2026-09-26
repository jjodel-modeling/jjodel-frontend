# Prompt: move the research dataset and the attribution analysis out of the tree, neutralize every reference to the study
Edited 2026-09-27 by P-2026-09-27-0051: references to the study neutralized, content otherwise unchanged.

Prompt-ID: P-2026-09-27-0051
Chat: C-2026-09-27-0150
Lane: harness (docs, `.gitignore`, removals from the tree; no code file is touched)
Status: eseguito 2026-09-27 · lane harness · d47f3cbb1

Worktree: `~/jjodel-release`, branch `alfonso-frontend-jjtl`, launched by the chat with `lane-run start`
(a new session, so `/clear` is implicit). Before anything else: `pwd` is `/Users/alfonso/jjodel-release`,
branch `alfonso-frontend-jjtl`, `git log -1` is the commit that adds this file (subject
`docs: add prompt P-2026-09-27-0051, research material out of the tree`), `git status` empty. Otherwise stop
with `Outcome: question`. No dev server in this lane.

Read `CLAUDE.md`, then `docs/PROTOCOL.md` P9, P13 and P16. Every reply of this session opens with
`[P-2026-09-27-0051 · session <id>]` and ends with one line `Outcome: done | hard-stop | question | blocked`.

## Context

The repository is public since 2026-09-27. Alfonso decided the same day that the longitudinal study of the
harness (its dataset, its analyses and the name of the journal it targets, which this prompt does not write)
stays local: nothing about it in the public tree, from now on and retroactively for the current tree. The
history is out of scope by decision: no rewrite, no force push.

What the current tree carries, measured by the chat on `5fcdeaeed`:

1. `docs/discovery/<dataset dir>/` (29 files, 24 MB) and `docs/analysis/harness-attribution*` (one `.md`, six
   `.csv`): the study material. `docs/analysis/analysis_2026-06-08_codebase_overview.md` is not part of it and
   stays.
2. The word of the study's name, in the current tree, outside those directories and outside the false
   positives (`themselves` matches the same grep): `docs/HARNESS-DOCS.md:183`;
   `docs/discovery/2026-06-12_template-simplification-edge-unification.md:33`;
   `docs/prompts/claude_2026-07-16_prompt_sessione_enrich_viewpoints_events.md:19` (a local folder path);
   and everything lane `P-2026-09-27-0214` wrote last night: its prompt
   `docs/prompts/claude_2026-09-27_0214_prompt_public_harness_cleanup.md`, its report
   `docs/discovery/discovery_2026-09-27_public_harness_cleanup.md`, its entry in `docs/log-inbox/harness.md`
   (not yet folded into the log, so still editable). The mapping file that lane created lives at
   `~/.jjodel-lanes/<mapping dir>/author-map.csv`, outside the tree.
3. No file outside `docs/` carries the word (root, `frontend/`, `.claude/`, `.github/`), apart from the
   `themselves` false positives in code comments.

## COSA

1. Move the study material out of the tree: copy `docs/discovery/<dataset dir>/` to
   `<local research folder>/dataset/` and `docs/analysis/harness-attribution.md` plus the six
   `docs/analysis/harness-attribution-*.csv` to `<local research folder>/analysis/` (create the directories),
   verify each copy with `diff -r` (dataset) and `cmp` (each analysis file), then `git rm -r` the tracked
   originals by explicit path. Move `~/.jjodel-lanes/<mapping dir>/` to `<local research folder>/author-map/` so the
   study's local material is in one place, and say so in the commit body.
2. `.gitignore` gains, as a guard, `docs/discovery/<dataset dir>/` and `docs/analysis/harness-attribution*`,
   under a comment `# research material, kept out of the tree (2026-09-27)`.
3. Neutralize the word in the current tree. Rule: in every tracked file where the study's name appears as a
   word or as part of a path (the dataset directory, the mapping folder, the transcripts folder name), rewrite the
   line so that the reference is gone and the sentence still reads: `research dataset`, `research material`,
   `the study`, `the mapping file (local)` as the context needs; a path that no longer exists is replaced by
   `<local research folder>`. Do not delete whole lines or paragraphs; do not change anything else on the line.
   The `themselves` matches are not touched. `docs/HARNESS-DOCS.md:183` becomes a sentence that says research
   material is kept outside the tree, without naming the study; bump nothing else in that file.
4. The three documents of lane `P-2026-09-27-0214` (its prompt, its report, its inbox entry) are records: each
   gets one line right under its title, `Edited 2026-09-27 by P-2026-09-27-0051: references to the study
   neutralized, content otherwise unchanged.` The inbox entry's title loses the word (for example `... LaTeX
   builds, dataset emails`). The prompt's Status line is not touched.
5. Verification after the edits: `git grep -I -i -l '<word>' -- . ':!frontend/src' ':!frontend/public'` must
   print nothing, and `git grep -I -i -l '<word>' -- frontend/src | head -3` must still print files (the
   `themselves` positive control); `git ls-files docs/discovery/<dataset dir> docs/analysis/harness-attribution*`
   must print nothing; `git ls-files docs/analysis` must print exactly
   `docs/analysis/analysis_2026-06-08_codebase_overview.md`.
6. Log entry (P9) in `docs/log-inbox/harness.md`, written without the word, plus a ticket paragraph naming the
   one thing this lane leaves: the history of the public branch still carries the material and one commit
   subject that names it, a rewrite being a decision reserved to Alfonso (RC-26).

Out of scope: every code file, `CLAUDE.md`, `docs/PROTOCOL.md`, `docs/decisions.md`, `.claude/`, the git
history, `docs/claude-code-log.md` and `docs/claude-code-log-archive.md` (add-only, and they carry only the
false positives), the two paper sources `docs/jjtl-jjel-paper.tex` and `docs/mde-intelligence-2026/paper/main.tex`
(false positives only: verify in Phase 1 and say so).

## DOVE

`docs/discovery/<dataset dir>/**` and `docs/analysis/harness-attribution*` (removed from the tree), `.gitignore`,
`docs/HARNESS-DOCS.md` (line 183 only), `docs/discovery/2026-06-12_template-simplification-edge-unification.md`,
`docs/prompts/claude_2026-07-16_prompt_sessione_enrich_viewpoints_events.md`,
`docs/prompts/claude_2026-09-27_0214_prompt_public_harness_cleanup.md`,
`docs/discovery/discovery_2026-09-27_public_harness_cleanup.md`, `docs/log-inbox/harness.md`, the Status line
of this file, plus any tracked file Phase 1 finds with a real (non `themselves`) match that this list misses:
name it in the report with a `Recommended:` line before touching it. Outside the tree: `<local research folder>/`
(new) and `~/.jjodel-lanes/<mapping dir>/` (moved).

## COME

### Phase 1, read-only, then HARD STOP

Write the report to `docs/discovery/discovery_2026-09-27_research_material_out_of_tree.md` (objective, files
read with full paths, findings, risks, questions with a `Recommended:` line each). Then stop with
`Outcome: hard-stop`. The report answers:

1. Every tracked file matching `git grep -I -n -i '<word>'` over the whole tree, classified per line: real
   reference (word or path) or `themselves` false positive. Real references outside DOVE are a question.
2. The exact list of tracked paths under `docs/discovery/<dataset dir>/` and `docs/analysis/`, with sizes.
3. Whether `~/jjodel-research/` exists already, and what `~/.jjodel-lanes/<mapping dir>/` contains.
4. `check:docs` on the clean tree, the 4/4 line and the warnings count, as the baseline; whether the inbox
   entry of `P-2026-09-27-0214` passes the lint as it stands (the entry title will change).
5. For each of the seven lines in Context 2 outside the 0214 documents, the proposed rewritten line, verbatim,
   so the chat can read it before the GO.

Stop and ask (with a `Recommended:` line) if: a real reference sits in a file outside DOVE; a rewritten line
would change the meaning of a rule in `docs/HARNESS-DOCS.md`; `<local research folder>/` already exists and
differs from the tree's copy.

### Phase 2, after the GO

1. Baseline: `check:docs` as in Phase 1, `git status` empty apart from this lane.
2. Commit 1 (`chore: move research material out of the tree`): COSA 1 and 2. Body: the paths removed, the
   destination, the `diff -r`/`cmp` results, the mapping folder move.
3. Commit 2 (`docs: neutralize references to the study in the current tree`): COSA 3 and 4. Body: the list of
   files and the number of lines changed per file, and the two grep controls of COSA 5 with their output.
4. Gates: `check:docs` at least the baseline; the four controls of COSA 5; `git diff --stat <sha of the
   commit that adds this file>..HEAD` inside DOVE plus the Phase 1 report and the inbox.
5. Closure: one docs commit (RC-17) with the log entry in `docs/log-inbox/harness.md`, the Status of this file
   flipped to `eseguito 2026-09-27 · lane harness · <sha of commit 2>` (no visual check in this lane), and the
   ticket paragraph. Closing report opening with `[P-2026-09-27-0051 · session <id>]`: the three shas, the
   gates, the controls, deviations. Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`,
`git filter-repo`, `git rebase`, `git commit --amend`, push, a critical-zone edit, a change under `.claude/`,
any tree you did not start in, `rm` of anything before its copy is verified.

## RIFERIMENTI

`docs/PROTOCOL.md` P9, P13, P16; `docs/decisions.md` RC-21, RC-26; `docs/HARNESS-DOCS.md` §4.2;
`docs/discovery/discovery_2026-09-27_public_harness_cleanup.md` (the previous lane, whose documents this lane
edits); the chat measurement of 2026-09-27 on `5fcdeaeed`.
