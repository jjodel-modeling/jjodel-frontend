# Prompt: jjtl-app-source takes the trunk before its own merge

Prompt-ID: P-2026-10-31-1902
Chat: C-2026-10-31-1328
Request: none (rendered by lane-run, no chat URL known for C-2026-10-31-1328)
Lane: full (merge of the trunk into the branch; zero conflicts measured)
Status: eseguito 2026-10-31 · lane jjtl-app-source · bd1dbb29d · verifica visiva passata 2026-10-31 (chat, unattended; Alfonso in the morning digest)

Worktree: `/Users/alfonso/jjodel-w-jjtlapp`, branch `jjtl-app-source`, a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-jjtlapp`, branch `jjtl-app-source`, `git log -1` is the commit that adds this file (its parent `cb2a8b160`), `git status` empty apart from gitignored `frontend/scripts/smoke/_tmp_*`, `MERGE_HEAD` absent. Otherwise stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-31-1902 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

## COSA

RC-14: a branch resolves its conflicts with the trunk on the branch, before the trunk takes it. Bring the trunk `alfonso-frontend-jjtl` at the explicit sha `6ea23356a` into `jjtl-app-source` with one merge commit, `--no-ff`, in the shape of `2249bfef5` (the last merge commit on `jjtl-app-source`; read its body first). Merge base `e94541c13`. The trunk brings, since the base, 23 commits:

- `6ea23356a` docs: Status flip and log entry for the ecore-nsuri merge (P-2026-10-31-1839)
- `ff05fd79d` merge: ecore-nsuri into alfonso-frontend-jjtl (P-2026-10-31-1839)
- `2ecc6c99f` docs: add prompt P-2026-10-31-1839, merge ecore-nsuri into alfonso-frontend-jjtl
- `432ad62ed` docs: Status flip and log entry for the cg-spec-note merge (P-2026-10-31-1751)
- `2a41d7507` merge: cg-spec-note into alfonso-frontend-jjtl (P-2026-10-31-1751)
- `e190e7158` docs: Status flip and log entry for the jjel-range merge (P-2026-10-31-1746)
- `de519893f` docs: open front plugins, add prompt P-2026-10-31-1800
- `9654de9b6` merge: jjel-range into alfonso-frontend-jjtl (P-2026-10-31-1746)
- `10e73040e` docs: log follow-up for the nsURI refusal message (P-2026-10-31-1711)
- `35fca6676` fix(ecore): nsURI refusal says only to delete the loaded metamodel (P-2026-10-31-1711)
- `40dd35d28` docs: add prompt P-2026-10-31-1751, merge cg-spec-note into alfonso-frontend-jjtl
- `d575e2965` docs: add prompt P-2026-10-31-1746, merge jjel-range into alfonso-frontend-jjtl
- `326e2e6d1` docs(sessioni): update checkpoint of chat C-2026-10-31-1328 after the five merges
- `ad4ef1cc8` docs: log entry and Status flip for JjEL range (P-2026-10-31-1740)
- `a64d90f7e` feat(jjel): range(n) and range(a, b) builtin, usable in JjTL forall (P-2026-10-31-1740)
- `898e8adeb` docs: add prompts P-2026-10-31-1740 and 1741 (jjel range, jjtl multivar forall)
- `2fd5d83d8` docs: Status flip and log entry for the Ecore nsURI guard (P-2026-10-31-1711)
- `dad0678a7` fix(ecore): refuse import of an nsURI already loaded (P-2026-10-31-1711)
- `16bcd3432` docs: Status flip and log entry for the spec and draft-note lane (P-2026-10-31-1712)
- `a8499d9d0` docs(jjel): SPEC 9.4, origins of member reads through + and join (P-2026-10-31-1712)
- `90123e307` fix(codegen): stale-draft note only while the metamodel exists (P-2026-10-31-1712)
- `0d567dacf` docs(prompts): add P-2026-10-31-1712
- `e291990b3` docs(prompts): add P-2026-10-31-1711

This branch brings, 5 commits:

- `cb2a8b160` docs: Status of P-2026-10-31-1710, point 1 moved to P-2026-10-31-1910
- `86d91287c` docs: Status, log entry and report addendum for jjtl-app-source (P-2026-10-31-1710)
- `370c12155` fix(jjtl): let variables reach nested bodies at any depth (P-2026-10-31-1710)
- `7f77bdc16` docs(discovery): JjTL app parser with source, let scope in nested bodies (P-2026-10-31-1710)
- `aedd3c3c8` docs(prompts): add P-2026-10-31-1710

Measured by `lane-run merge --trunk-into` at 2026-10-31 19:02, trunk at `6ea23356a`:

- `git merge-tree --write-tree --name-only jjtl-app-source 6ea23356a`: zero conflicts.
- Files changed since the base: 5 on the branch side, 24 on the trunk side; on both sides: `frontend/src/jjtl/executor/executor.ts`.
- `git diff --name-only e94541c13 cb2a8b160 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-10-31_1710_prompt_jjtl_app_parser_source_and_let_scope.md` (eseguito 2026-10-31 · lane jjtl-app-source (point 2 only; point 1 moved to P-2026-10-31-1910 on Alfonso's decision of 17:49) · branch jjtl-app-source · discovery 7f77bdc16 · point 2 done 370c12155 · point 1 not applied, it changes results (discovery P2-P3), awaiting Alfonso · verifica visiva non applicabile (executor only)).
- `git worktree list`: `jjtl-app-source` in `/Users/alfonso/jjodel-w-jjtlapp`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

## COME

1. Preconditions above, plus: `6ea23356a` is the tip of `alfonso-frontend-jjtl` (if a docs-only commit moved it, say so and merge `6ea23356a` all the same); `git worktree list` shows `alfonso-frontend-jjtl` only in `/Users/alfonso/jjodel-release`.
2. Measure again: `git merge-tree --write-tree --name-only jjtl-app-source 6ea23356a` (measured above: zero conflicts). A conflict in any file outside `docs/decisions.md` and `docs/log-inbox/*.md`: **stop** with `Outcome: question` and the conflict hunks quoted; do not resolve code by hand in this lane.
3. `git merge --no-ff --no-commit 6ea23356a`.
4. Resolve `docs/decisions.md`, if it conflicts, by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block, each section heading once. Resolve every `docs/log-inbox/*.md` that conflicts by union: preamble, the trunk's entries, then the branch's entries, all verbatim, each heading once. Probes on the resolved tree, each counted with `grep -c -F`:
   - `docs/log-inbox/jjtl-app-source.md`: the heading `## 2026-10-31 — fix(jjtl): let variables reach nested bodies; app parser switch measured, not applied (P-2026-10-31-1710)` once (branch).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-10-31 — fix(codegen): stale-draft note only while the metamodel exists, SPEC on origins through + and join (P-2026-10-31-1712)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-10-31 — merge: cg-spec-note into alfonso-frontend-jjtl (P-2026-10-31-1751)` once (trunk).
   - `docs/log-inbox/ecore-nsuri.md`: the heading `## 2026-10-31 — fix(ecore): refuse import of an nsURI already loaded (P-2026-10-31-1711)` once (trunk).
   - `docs/log-inbox/ecore-nsuri.md`: the heading `## 2026-10-31 — merge: ecore-nsuri into alfonso-frontend-jjtl (P-2026-10-31-1839)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-10-31 — feat: JjEL range(n) and range(a, b), usable in a JjTL forall` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-10-31 — ticket: JjEL global builtins other than range may be missing in JjTL and validation expressions` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-10-31 — merge: jjel-range into alfonso-frontend-jjtl (P-2026-10-31-1746)` once (trunk).
5. On the resolved tree, before committing, read every file changed on both sides once from top to bottom (`frontend/src/jjtl/executor/executor.ts`); an auto-merge is a textual result, not a semantic one: no conflict marker, no duplicated declaration, hook or selector, one root per component.
6. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: jjtl-app-source takes alfonso-frontend-jjtl (P-2026-10-31-1902)`. Body: the two sides' shas, the merge-tree measurement, the union resolutions, the reading of step 5, `Model:` and `Co-Authored-By` trailers.
7. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: state the expectation first as the trunk tip's count (measure it read-only in `/Users/alfonso/jjodel-release` with `node /Users/alfonso/jjodel-w-jjtlapp/frontend/scripts/run-quiet.mjs vitest-trunk -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-release`/frontend`, the runner's log goes to this tree's `.agent-logs/`; do not write there) plus the tests this branch added, 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard cb2a8b160` (this branch's own pre-merge tip; the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 8.
8. `Outcome: hard-stop`: the chat re-runs the visual probes of the branch on this tree and gives the GO. Do not start a server.
9. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane jjtl-app-source · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/jjtl-app-source.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry, jjtl-app-source took the trunk (P-2026-10-31-1902)` (P16, RC-17). `Outcome: done`. The merge of `jjtl-app-source` into the trunk gets its own prompt (`lane-run merge jjtl-app-source --into alfonso-frontend-jjtl`).

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 7), `git checkout -- .`, `git clean`, `--no-verify`, a hand edit to a code file, editing any line inside a decision block or a log entry, rebase, squash, push, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-release`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge --trunk-into` from `frontend/scripts/lane-templates/trunk-into-branch.md`, in the shape of `claude_2026-09-27_0325_prompt_sim_profiles_take_trunk.md`.
