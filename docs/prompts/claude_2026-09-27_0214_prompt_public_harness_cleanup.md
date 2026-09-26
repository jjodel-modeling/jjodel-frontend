# Prompt: public-repo cleanup after opening the harness (PDF, gitignore, local Claude Code state, LaTeX build files, research dataset pseudonymization)
Edited 2026-09-27 by P-2026-09-27-0051: references to the study neutralized, content otherwise unchanged.

Prompt-ID: P-2026-09-27-0214
Chat: C-2026-09-27-0150
Lane: harness (docs, `.gitignore`, index-only removals; no code file is touched)
Status: eseguito 2026-09-27 · lane harness · 869f204eb

Worktree: `~/jjodel-release`, branch `alfonso-frontend-jjtl`, launched by the chat with `lane-run start`
(a new session, so `/clear` is implicit). Before anything else: `pwd` is `/Users/alfonso/jjodel-release`,
branch `alfonso-frontend-jjtl`, `git log -1` is the commit that adds this file (subject
`docs: add prompt P-2026-09-27-0214, public-repo cleanup`), `git status` empty. Otherwise stop with
`Outcome: question`. No dev server in this lane.

Read `CLAUDE.md`, then `docs/PROTOCOL.md` P9, P13 and P16. Every reply of this session opens with
`[P-2026-09-27-0214 · session <id>]` and ends with one line `Outcome: done | hard-stop | question | blocked`.

## Context

On 2026-09-27 the repository became public with `docs/` and `.claude/` inside it, so that anyone can
reuse the harness. A read-only audit of the public branch by the chat (clone of `f6ad47d`) found no API
key, token or password, but five things that should not be public, or should not be tracked:

1. `978-3-030-43946-0_9.pdf` at the repository root: a Springer book chapter, copyrighted, added in
   `f6ad47d`. Alfonso decided on 2026-09-27: remove it from the tree with a normal commit, no history
   rewrite, no force push.
2. `.claude/projects/-Users-alfonso-Library-Mobile-Documents-com-apple-CloudDocs-Sviluppo-jjodel-jjodel-2-jjodel/memory/`
   (two files) and `.claude/scheduled_tasks.lock`: local Claude Code state, with a machine path and a pid.
3. `.gitignore` line 62 ignores `/CLAUDE.md` while `CLAUDE.md` is tracked (force-added at some point).
   A fork that runs a plain `git add` skips the central file of the harness.
4. LaTeX build files tracked under `docs/`: `docs/jjtl-jjel-paper.{aux,dvi,fdb_latexmk,fls,log,out,toc}`
   and `docs/mde-intelligence-2026/paper/_build/main.{aux,bbl,blg,fdb_latexmk,fls,log,out,synctex.gz}`.
   The `.tex` and `.pdf` of both papers stay.
5. The research dataset carries the personal email addresses of contributors and students, thousands of times:
   `<local research folder>/dataset/git/commits.csv` (column `email`), `<local research folder>/dataset/git/authors_commits.txt`
   and `authors_commitcount.txt` (`Name <email>` lines), `docs/analysis/harness-attribution-commits.csv`
   (column `email`). Git author emails are recoverable from the history anyway; collected in a dataset of an
   empirical study they are personal data and must be pseudonymized in the repository, not only in the paper.

## COSA

1. `git rm 978-3-030-43946-0_9.pdf`.
2. `git rm -r --cached .claude/projects .claude/scheduled_tasks.lock` (the files stay on disk: they are
   Claude Code's, not ours), and `.gitignore` gains `.claude/projects/` and `.claude/*.lock`. `.claude/settings.json`
   and `.claude/skills/` stay tracked: they are the reusable part of the harness.
3. `.gitignore` loses the `/CLAUDE.md` line. Keep `.claude/settings.local.json` ignored.
4. `git rm --cached` of the fifteen LaTeX build files above, and `.gitignore` gains the patterns
   `*.aux`, `*.bbl`, `*.blg`, `*.fdb_latexmk`, `*.fls`, `*.synctex.gz`, `*.dvi`, `*.toc`, `*.out` scoped to
   `docs/` (`docs/**/*.aux` and so on), plus `docs/mde-intelligence-2026/paper/_build/`. Do not use bare `*.log`
   or `*.out` patterns: `docs/claude-code-log.md` and other files must never be caught. Verify with
   `git check-ignore -v` on `docs/claude-code-log.md` (must not be ignored) and on `docs/jjtl-jjel-paper.aux`
   (must be ignored).
5. Pseudonymize the four dataset files. Rule: every email is replaced by a stable opaque author id
   (`a01`, `a02`, ... in order of first appearance in `commits.csv`), one id per distinct email; two emails
   of the same person keep two ids (the dataset must not assert identities it did not measure; the mapping
   file can). Author names stay: they are the public authorship of the commits. The mapping
   `email,author_id,name` is written to `<local research folder>/author-map/author-map.csv`, outside every tree, and is
   reused by every later lane that regenerates the dataset: if the file already exists, extend it, never
   renumber. A note at the top of `<local research folder>/dataset/SUMMARY.md` and of
   `docs/analysis/harness-attribution.md` says that emails are pseudonymized and where the mapping lives
   (path only, no content). Do the replacement with a small script run once from the shell, not committed,
   and not by hand: after it, `git grep -I -E '[A-Za-z0-9._%+-]+@(gmail|live|univaq|student\.univaq)\.' -- <local research folder>/dataset docs/analysis`
   must be empty, and the positive control `git grep -c 'a01' <local research folder>/dataset/git/commits.csv`
   must be greater than zero.
6. Log entry (P9) in `docs/log-inbox/harness.md`, plus a ticket paragraph for the items below that this lane
   does not touch, so they are not lost: the three `harness_FTG_PM*.xmi` and `background_spec_driven_development.md`
   at the repository root (are they meant to be public, and there?); 95 files under `docs/` still citing
   `localhost:3001`; the absence of an entry point for external readers (`docs/harness/README.md` that
   separates the reusable core of the harness from the Jjodel instance and from the historical archive),
   which is a lane of its own to be discussed in chat first.

Out of scope: every code file, `CLAUDE.md`, `docs/PROTOCOL.md`, `docs/HARNESS-DOCS.md`, `.claude/settings.json`,
the skills, the content of any prompt, discovery or session file, the git history.

## DOVE

`978-3-030-43946-0_9.pdf` (removed), `.gitignore`, the index entries of `.claude/projects/**` and
`.claude/scheduled_tasks.lock` (removed from the index only), the fifteen LaTeX build files (removed from the
index only), `<local research folder>/dataset/git/commits.csv`, `<local research folder>/dataset/git/authors_commits.txt`,
`<local research folder>/dataset/git/authors_commitcount.txt`, `docs/analysis/harness-attribution-commits.csv`,
`<local research folder>/dataset/SUMMARY.md`, `docs/analysis/harness-attribution.md`, `docs/log-inbox/harness.md`,
the Status line of this file. Nothing else.

## COME

### Phase 1, read-only, then HARD STOP

Measure before writing, and write the report to
`docs/discovery/discovery_2026-09-27_public_harness_cleanup.md` (objective, files read with full paths,
findings, risks, questions with a `Recommended:` line each). Then stop with `Outcome: hard-stop`. The report
answers:

1. `git ls-files | grep -c .` for `.claude/` and the exact list of tracked paths under it; confirm
   `settings.local.json` is absent from the index.
2. The tracked LaTeX build files: `git ls-files docs | grep -E '\.(aux|bbl|blg|fdb_latexmk|fls|log|out|toc|dvi|synctex\.gz)$'`,
   verbatim. If the list differs from the fifteen paths in Context, say so.
3. Every tracked file under `docs/` that contains an email address, with a count per file
   (`git grep -I -c -E '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[a-z]{2,}' -- docs`), so that no dataset file
   is missed. Files whose only emails are `noreply@anthropic.com`, `permissions@acm.org`, `info@jjodel.io`
   or `@users.noreply.github.com` are out of scope: list them, do not touch them.
4. Which columns of `commits.csv` and `harness-attribution-commits.csv` carry an email, and whether any
   other file under `docs/analysis` or `<local research folder>/dataset` is derived from them by a script in
   the repo (`git grep -l 'commits.csv' -- frontend/scripts docs`): if a script regenerates the dataset,
   name it, because the pseudonymization must also be applied there (a question, with a Recommended line),
   not only to the output.
5. Whether `<local research folder>/author-map/author-map.csv` already exists.
6. What `check:docs` says on the clean tree (the 4/4 line and the warnings count), as the baseline.

Stop and ask (with a `Recommended:` line) if: a dataset file is regenerated by a tracked script; the email
grep finds a dataset-like file this prompt did not name; a `.gitignore` pattern would ignore a tracked file
outside the fifteen.

### Phase 2, after the GO

1. Baseline: `check:docs` as in Phase 1, `git status` empty apart from this lane.
2. Commit 1 (`chore: remove third-party PDF and local Claude Code state from the tree`): items 1, 2, 3 of
   COSA. Message body lists the removed paths.
3. Commit 2 (`chore: stop tracking LaTeX build files under docs`): item 4. Message body lists the fifteen
   paths and the `git check-ignore -v` lines of the two controls.
4. Commit 3 (`docs(<scope>): pseudonymize contributor emails in the dataset`): item 5. Message body gives the
   number of distinct emails mapped, the two grep controls with their output, and the mapping path. Never
   put an email or the mapping content in a commit message.
5. Gates on the tree after commit 3: `check:docs` at least the baseline, `git ls-files | grep -c 978-3-030`
   equal to 0, `git ls-files .claude` equal to `settings.json` plus the three skills and nothing else,
   `git diff --stat f6ad47d..HEAD` inside DOVE only.
6. Closure: one docs commit (RC-17) with the log entry in `docs/log-inbox/harness.md`, the Status of this
   file flipped to `eseguito 2026-09-27 · lane harness · <sha of commit 3>` (no visual check in this
   lane: the line ends at the sha), and the ticket paragraph. Closing report opening with
   `[P-2026-09-27-0214 · session <id>]`: the four shas, the gates, the grep controls, deviations. Then
   `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`,
`git filter-repo`, `git rebase`, `git commit --amend`, push, a critical-zone edit, an edit to
`.claude/settings.json` or the skills, any tree you did not start in. Removing a path from the index is the
only change this lane makes under `.claude/`, and it is declared here.

## RIFERIMENTI

`docs/PROTOCOL.md` P9, P13, P16; `docs/HARNESS-DOCS.md` §7; `<local research folder>/dataset/SUMMARY.md`;
`docs/analysis/harness-attribution.md`; the chat audit of 2026-09-27 (clone of `f6ad47d`, read-only,
counts in Context).
