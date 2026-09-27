# Prompt: {{branch}} takes the trunk before its own merge

Prompt-ID: {{promptId}}
Chat: {{chat}}
Lane: full (merge of the trunk into the branch; {{laneNote}})
Status: da eseguire

Worktree: `{{branchWorktree}}`, branch `{{branch}}`, a fresh session started by `lane-run`. Before anything else: `pwd` is `{{branchWorktree}}`, branch `{{branch}}`, `git log -1` is the commit that adds this file (its parent `{{branchTip}}`), `git status` empty apart from gitignored `frontend/scripts/smoke/_tmp_*`, `MERGE_HEAD` absent. Otherwise stop with `Outcome: blocked`. Every reply opens with `[{{promptId}} · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

## COSA

RC-14: a branch resolves its conflicts with the trunk on the branch, before the trunk takes it. Bring the trunk `{{trunk}}` at the explicit sha `{{trunkTip}}` into `{{branch}}` with one merge commit, `--no-ff`, {{precedent}}. Merge base `{{base}}`. The trunk brings, since the base, {{trunkCommitCount}}:

{{trunkCommits}}

This branch brings, {{branchCommitCount}}:

{{branchCommits}}

Measured by `lane-run merge --trunk-into` at {{measuredAt}}, trunk at `{{trunkTip}}`:

- `git merge-tree --write-tree --name-only {{branch}} {{trunkTip}}`: {{conflicts}}.
- Files changed since the base: {{branchFileCount}} on the branch side, {{trunkFileCount}} on the trunk side; on both sides: {{bothSides}}.
- `git diff --name-only {{base}} {{branchTip}} -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: {{governance}}.
- Prompt files the branch adds under `docs/prompts/`: {{branchPrompts}}.
- `git worktree list`: {{worktrees}}.

{{findings}}

## COME

1. Preconditions above, plus: `{{trunkTip}}` is the tip of `{{trunk}}` (if a docs-only commit moved it, say so and merge `{{trunkTip}}` all the same); `git worktree list` shows `{{trunk}}` only in {{trunkWorktree}}.
2. Measure again: `git merge-tree --write-tree --name-only {{branch}} {{trunkTip}}` (measured above: {{conflicts}}). A conflict in any file outside `docs/decisions.md` and `docs/log-inbox/*.md`: **stop** with `Outcome: question` and the conflict hunks quoted; do not resolve code by hand in this lane.
3. `git merge --no-ff --no-commit {{trunkTip}}`.
4. Resolve `docs/decisions.md`, if it conflicts, by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block, each section heading once. Resolve every `docs/log-inbox/*.md` that conflicts by union: preamble, the trunk's entries, then the branch's entries, all verbatim, each heading once. Probes on the resolved tree, each counted with `grep -c -F`:
{{probes}}
5. On the resolved tree, before committing, read every file changed on both sides once from top to bottom ({{bothSides}}); an auto-merge is a textual result, not a semantic one: no conflict marker, no duplicated declaration, hook or selector, one root per component.
6. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `{{mergeSubject}}`. Body: the two sides' shas, the merge-tree measurement, the union resolutions, the reading of step 5, `Model:` and `Co-Authored-By` trailers.
7. Gates on the merge commit, from `frontend/`: typecheck exit 2 with the §17 set (14); `typecheck:scripts` exit 0; vitest: state the expectation first as the trunk tip's count (measure it read-only in {{trunkWorktree}} with `npx vitest run --reporter=dot`; do not write there) plus the tests this branch added, 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:scripts` PASS.
8. `Outcome: hard-stop`: the chat re-runs the visual probes of the branch on this tree and gives the GO. Do not start a server.
9. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane {{branch}} · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)`, pathspec after `--`, subject `docs: Status flip, {{branch}} took the trunk ({{promptId}})`. No log entry. `Outcome: done`. The merge of `{{branch}}` into the trunk gets its own prompt (`lane-run merge {{branch}} --into {{trunk}}`).

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, a hand edit to a code file, editing any line inside a decision block or a log entry, rebase, squash, push, any other tree except the read-only vitest count in {{trunkWorktree}}.

## RIFERIMENTI

- `docs/PROTOCOL.md` P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge --trunk-into` from `frontend/scripts/lane-templates/trunk-into-branch.md`, in the shape of `claude_2026-09-27_0325_prompt_sim_profiles_take_trunk.md`.
