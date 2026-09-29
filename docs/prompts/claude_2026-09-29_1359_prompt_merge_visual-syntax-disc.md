# Prompt: merge visual-syntax-disc into alfonso-frontend-jjtl

Prompt-ID: P-2026-09-29-1359
Chat: C-2026-09-28-1936
Lane: full (merge; zero conflicts measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-09-29-1359 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `1d940e825`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `visual-syntax-disc` into the trunk with one merge commit, `--no-ff`, of the explicit sha `b612fae6b`, in the shape of `8cd75c62b` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `12ac29f74`. The branch carries, on top of the base, 2 commits:

- `b612fae6b` docs(views): visual concrete syntax discovery, log entry, Status (P-2026-09-29-1227)
- `69e9bc245` docs(prompts): P-2026-09-29-1227 discovery visual concrete syntax

The trunk carries, since the base, 19 commits:

- `1d940e825` docs: Status flip and log entry for the vitest-timeout merge (P-2026-09-29-1322)
- `8cd75c62b` merge: vitest-timeout into alfonso-frontend-jjtl (P-2026-09-29-1322)
- `d049dbaf8` docs: add prompt P-2026-09-29-1322, merge vitest-timeout into alfonso-frontend-jjtl
- `afa951c64` docs: Status flip and log entry for the sim-toggle merge (P-2026-09-29-1319)
- `aa21c3668` merge: sim-toggle into alfonso-frontend-jjtl (P-2026-09-29-1319)
- `e1b17fc59` docs: add prompt P-2026-09-29-1319, merge sim-toggle into alfonso-frontend-jjtl
- `57843a290` docs: Status flip and inbox entry for the vitest timeout (P-2026-09-29-1306)
- `411048e10` docs: R-SIM-99, the demo script re-measured, entry and Status (P-2026-09-29-1225)
- `f8051b5e2` fix: raise vitest testTimeout to 15000ms (P-2026-09-29-1306)
- `59a1baf99` feat(sim): Semantic Type Class section with a Simulation toggle (P-2026-09-29-1225)
- `49dd45056` feat(sim): the pill gated by the Simulation toggle, legacy rule (P-2026-09-29-1225)
- `7faa9eac9` docs: add prompt P-2026-09-29-1306, raise vitest testTimeout
- `d50450972` docs: close the sim-nondet-label merge by hand, Status flip and log entry (P-2026-09-29-1239)
- `4c55ce847` merge: sim-nondet-label into alfonso-frontend-jjtl (P-2026-09-29-1239)
- `2a6944838` docs: add prompt P-2026-09-29-1239, merge sim-nondet-label into alfonso-frontend-jjtl
- `8282e2130` docs(sim): R-SIM-98, demo script line, log entry, Status (P-2026-09-29-1221)
- `f5dd73fe4` feat(sim): the choice list is a nondeterministic choice (P-2026-09-29-1221)
- `b636aa480` docs(prompts): P-2026-09-29-1225 semantic type class toggle
- `a02c6996f` docs(prompts): P-2026-09-29-1221 nondeterministic choice label

Measured by `lane-run merge` at 2026-09-29 13:59, trunk at `1d940e825`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl b612fae6b`: zero conflicts.
- Files changed since the base: 3 on the branch side, 18 on the trunk side; on both sides: none.
- `git diff --name-only 12ac29f74 b612fae6b -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-09-29_1227_prompt_discovery_visual_concrete_syntax.md` (eseguito 2026-09-29 · lane discovery visual-syntax-disc · report docs/discovery/discovery_2026-09-29_visual_concrete_syntax.md · hard-stop, four decisions and three questions for Alfonso in §0).
- `git worktree list`: `visual-syntax-disc` in `/Users/alfonso/jjodel-w-visual`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-09-29-1359/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `b612fae6b` is the tip of `visual-syntax-disc`; the prompt files of the branch read `Status: eseguito` at `b612fae6b`; `git worktree list` shows `visual-syntax-disc` only in `/Users/alfonso/jjodel-w-visual`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl b612fae6b` (measured above: zero conflicts). `git diff --name-only 12ac29f74 b612fae6b -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 12ac29f74 alfonso-frontend-jjtl` with `git diff --name-only 12ac29f74 b612fae6b` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-SIM-98` (trunk), `R-SIM-99` (trunk); control: `- **R-SIM-100**` none.
   - `docs/log-inbox/views.md`: the heading `## 2026-09-29 — docs(views): discovery, how far the concrete syntax can improve visually (P-2026-09-29-1227)` once (branch).
   - `docs/log-inbox/harness.md`: the heading `## 2026-09-29 — fix: raise the vitest testTimeout to 15000ms (P-2026-09-29-1306)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-09-29 — merge: vitest-timeout into alfonso-frontend-jjtl (P-2026-09-29-1322)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-29 — feat: the choice list is a nondeterministic choice, R-SIM-98 (P-2026-09-29-1221)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-29 — merge: sim-nondet-label into alfonso-frontend-jjtl (P-2026-09-29-1239)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-29 — feat: the Simulation toggle of Semantic Type Class gates the pill, R-SIM-99 (P-2026-09-29-1225)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-29 — merge: sim-toggle into alfonso-frontend-jjtl (P-2026-09-29-1319)` once (trunk).
4. `git merge --no-ff --no-commit b612fae6b`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: visual-syntax-disc into alfonso-frontend-jjtl (P-2026-09-29-1359)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `b612fae6b` in `/Users/alfonso/jjodel-w-visual`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 1d940e825` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/views.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the visual-syntax-disc merge (P-2026-09-29-1359)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-visual`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
