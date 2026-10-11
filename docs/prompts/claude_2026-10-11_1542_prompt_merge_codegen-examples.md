# Prompt: merge codegen-examples into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-11-1542
Chat: C-2026-10-10-0046
Lane: full (merge; zero conflicts measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-11-1542 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `ee5c07c2f`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `codegen-examples` into the trunk with one merge commit, `--no-ff`, of the explicit sha `06bf2dd10`, in the shape of `ee5c07c2f` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `ec1a12ab0`. The branch carries, on top of the base, 5 commits:

- `06bf2dd10` docs: Status flip for the codegen S8 importable examples lane (P-2026-10-11-1415)
- `0e6153215` docs: log entry for the codegen importable examples (P-2026-10-11-1415)
- `4a7fb2755` feat(codegen): the two lecture examples as importable project files (P-2026-10-11-1415)
- `2cf1ae68c` docs(discovery): codegen examples as importable projects (P-2026-10-11-1415)
- `2a6eef070` docs(prompts): add P-2026-10-11-1415, codegen S8 importable lecture examples

The trunk carries, since the base, 25 commits:

- `ee5c07c2f` merge: cluster-descriptions into alfonso-frontend-jjtl (P-2026-10-11-1535)
- `748c513ce` docs: add prompt P-2026-10-11-1535, merge cluster-descriptions into alfonso-frontend-jjtl
- `e657a479a` docs: Status flip and log entry for cluster descriptions (P-2026-10-11-1510)
- `8a22140d9` docs(sessioni): checkpoint of chat C-2026-10-10-0039 (Jjodie reserved names, do-block parser fixes)
- `e1c750a8a` docs(goals): requirement cluster descriptions (P-2026-10-11-1510)
- `16ebdfca5` feat(harness): clusters carry a written description (P-2026-10-11-1510)
- `8840e4c83` docs: prompt for written descriptions of requirement clusters (P-2026-10-11-1510)
- `d4b8a6b09` docs: Status flip and log entry for the provisional rows digest (P-2026-10-11-1430)
- `212b081fa` docs: Status flip and log entry for the prov-digest merge (P-2026-10-11-1451)
- `a98c3b1ce` merge: prov-digest into alfonso-frontend-jjtl (P-2026-10-11-1451)
- `bcd4b993b` docs: add prompt P-2026-10-11-1451, merge prov-digest into alfonso-frontend-jjtl
- `b646a9a04` docs(ratifiche): digest of the provisional decision rows, by consequence (P-2026-10-11-1430)
- `239ca4266` docs(log-inbox): three maintenance tickets from P-2026-10-11-1025
- `a60241d55` docs: Status flip and log entry for the fix-subclass-edge-gesture merge (P-2026-10-11-1421)
- `4de76fb74` docs(prompts): digest of the provisional decision rows (P-2026-10-11-1430)
- `91be061fc` merge: fix-subclass-edge-gesture into alfonso-frontend-jjtl (P-2026-10-11-1421)
- `2da0ee1df` docs: add prompt P-2026-10-11-1421, merge fix-subclass-edge-gesture into alfonso-frontend-jjtl
- `f6d2eacf4` docs(log): subclass-edge-gesture closure, inbox entry and Status flip (P-2026-10-11-1025)
- `233f0b46b` test(probe): M1 gesture on subclass instances, mounted tab (F1) (P-2026-10-11-1025)
- `3f2a3e81f` test(editor-v2): re-parented class re-derives modeInfo, kills count mutation (P-2026-10-11-1025)
- `2e16e257d` fix(editor-v2): superclass ids in the M2 signature re-derive modeInfo (P-2026-10-11-1025)
- `3207576ca` test(editor-v2): useEditorMode re-derives on a superclass link, red (P-2026-10-11-1025)
- `a9a66c4b6` docs(discovery): M1 edge gesture inert on late-subclass instances (P-2026-10-11-1025)
- `385058377` docs(prompts): Front line for P-2026-10-11-1025
- `34581f960` docs(prompts): M1 edge gesture on subclass instances after metamodel change, lane auto (P-2026-10-11-1025)

Measured by `lane-run merge` at 2026-10-11 15:42, trunk at `ee5c07c2f`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 06bf2dd10`: zero conflicts.
- Files changed since the base: 10 on the branch side, 21 on the trunk side; on both sides: none.
- `git diff --name-only ec1a12ab0 06bf2dd10 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-10-11_1415_prompt_codegen_s8_importable_examples.md` (eseguito 2026-10-11 · lane codegen-examples · discovery 2cf1ae68c · code 4a7fb2755 · log 0e6153215 · tsc 14 = base, vitest src/codegen 345 (329 + 16), build exit 0 (files in dist/examples/codegen), check:codegen-lazy green, probes codegen-examples 71/71, codegen-panel 46/46, codegen-oracle 35/35, codegen-check 43/43, build script 21/21, mutation bench 3/3 · visual check passata 2026-10-11 (RC-23 by the chat on 3 crops, GO by Alfonso 15:37); files are .jjodel, not .jjodel.json; ticket: ProjectEditor Download button writes a format Import cannot read (read, not run)).
- `git worktree list`: `codegen-examples` in `/Users/alfonso/jjodel-w-codegen-examples`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-10-11-1542/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `06bf2dd10` is the tip of `codegen-examples`; the prompt files of the branch read `Status: eseguito` at `06bf2dd10`; `git worktree list` shows `codegen-examples` only in `/Users/alfonso/jjodel-w-codegen-examples`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 06bf2dd10` (measured above: zero conflicts). `git diff --name-only ec1a12ab0 06bf2dd10 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only ec1a12ab0 alfonso-frontend-jjtl` with `git diff --name-only ec1a12ab0 06bf2dd10` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/codegen-examples.md`: the heading `## 2026-10-11 — feat(codegen): the two lecture examples as importable project files (P-2026-10-11-1415)` once (branch).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-11 — merge: prov-digest into alfonso-frontend-jjtl (P-2026-10-11-1451)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-11 — docs(ratifiche): digest of the provisional decision rows (P-2026-10-11-1430)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-11 — feat(harness): a written description for each requirement cluster (P-2026-10-11-1510)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-10-11 — ticket: M1 canvas: the modeInfo signature misses reference type, containment, bounds and `interface`` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-10-11 — ticket: M1 canvas: xyflow refuses Transition→State over `target` after reopen` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-10-11 — ticket: leftover `[BUG-DIAG-GUARD]` console.log in ConformanceGuard.ts` once (trunk).
   - `docs/log-inbox/subclass-edge-gesture.md`: the heading `## 2026-10-11 — fix(editor-v2): superclass ids in the M2 signature, M1 gesture on subclass instances (P-2026-10-11-1025)` once (trunk).
   - `docs/log-inbox/subclass-edge-gesture.md`: the heading `## 2026-10-11 — merge: fix-subclass-edge-gesture into alfonso-frontend-jjtl (P-2026-10-11-1421)` once (trunk).
4. `git merge --no-ff --no-commit 06bf2dd10`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: codegen-examples into alfonso-frontend-jjtl (P-2026-10-11-1542)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `06bf2dd10` in `/Users/alfonso/jjodel-w-codegen-examples`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard ee5c07c2f` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/codegen-examples.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the codegen-examples merge (P-2026-10-11-1542)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-codegen-examples`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
