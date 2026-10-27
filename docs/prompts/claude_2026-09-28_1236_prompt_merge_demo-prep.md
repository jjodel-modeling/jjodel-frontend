# Prompt: merge demo-prep into alfonso-frontend-jjtl

Prompt-ID: P-2026-09-28-1236
Chat: —
Lane: full (merge; zero conflicts measured)
Status: eseguito 2026-09-28 · lane merge · 63a80f62b · verifica visiva passata 2026-09-28 (docs-only merge, no UI change; closed by hand: the worker stopped on check:docs, red on the receiving tip before the merge, fixed by 559eb82c5 and e2448cf61)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-09-28-1236 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `55c24d570`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `demo-prep` into the trunk with one merge commit, `--no-ff`, of the explicit sha `e913101fb`, in the shape of `447e4239b` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `888ea9a9d`. The branch carries, on top of the base, 3 commits:

- `e913101fb` docs: close P-2026-09-28-1015, four demo projects exported (P-2026-09-28-1015)
- `9a95c484c` docs: discovery, 3001 demo prep cannot write into Alfonso's own instance (P-2026-09-28-1015)
- `1a3425531` docs: add prompt P-2026-09-28-1015, prepare the four demo projects on 3001

The trunk carries, since the base, 35 commits:

- `55c24d570` docs: session checkpoint 2026-09-28 (second, handover to a new chat)
- `65eb5475b` docs: the log Outcome field is not the RC-20 closing line (P-2026-09-28-1120)
- `f6f438495` docs: discovery on the lane-run Outcome parser and Outcome: completed (P-2026-09-28-1120)
- `447e4239b` Merge branch 'staging' into alfonso-frontend-jjtl
- `7a6802ce8` Merge pull request #160 from jjodel-modeling/feat/157-environment-config
- `aff0df20d` docs(#157): Fase 4 discovery report + Fase 4a log entry
- `aeae59617` feat(#157): copy a stand-alone environment link per profile (Fase 4a)
- `f7e564644` docs(#157): Fase 3b Navbar trim discovery report + log entry
- `44e420790` feat(#157): trim the Navbar for consumer (stand-alone) mode
- `de0bcb7fb` docs(#157): log entry per shell reattiva a ?profile=
- `32d11c2ab` fix(#157): shell reattiva a ?profile= all'uscita dal consumer mode
- `90dce7ca3` docs(#157): Fase 3 consumer shell discovery report + log entry
- `54e8c09a0` feat(#157): restricted consumer shell driven by ?profile= (Fase 3)
- `948aaebf5` docs(#157): log entry for active-profile indicator
- `1377a9ac2` feat(#157): show the active profile in the Configurator header
- `7b21b0d88` docs(#157): log entry for permission SegmentedControl
- `7397f862e` fix(#157): per-type profile permission as a SegmentedControl
- `8d0b1960b` docs(#157): log entry for robust profile URL read
- `bad61aec6` fix(#157): read the profile from the URL robustly and reactively (F2)
- `8d8cb1193` docs(#157): Fase 2 addendum + tracked cleanup note + log entry
- `3219beb06` feat(#157): apply profile permissions in the Configurator (Fase 2)
- `ad6505dc4` docs(#157): log entry for removing metamodel selection in General
- `2b585a2ba` fix(#157): drop the source-metamodel selection from the General step
- `9f754fd5b` docs(#157): log entry for metamodel:metaclass label fix
- `9baa94e2e` fix(#157): label metaclasses as `metamodel:metaclass` in wizard steps
- `ec7b0c3dd` docs(#157): consolidation report (EnvGen merge) + log entry
- `89d296187` refactor(#157): merge configurator into EnvGen wizard, rename role->profile
- `e1e421813` docs(#157): Fase 1 Configurator discovery report + log entry
- `9763e9f6f` feat(#157): Configurator screen, first cut (Fase 1)
- `e814fc301` docs(#157): record Fase 0b smoke confirmation from user
- `90ae6c88c` docs(#157): Fase 0b addendum + log entry
- `bf22e3262` feat(#157): Environment config mini-UI (Fase 0b)
- `0e692e4ae` docs(#157): Fase 0a discovery report + log entry
- `b45b866cf` feat(#157): DEnvironmentConfig/DRole entity (Fase 0a, schema + read/write)
- `293d346f6` Merge pull request #156 from jjodel-modeling/alfonso-frontend-jjtl

Measured by `lane-run merge` at 2026-09-28 12:36, trunk at `55c24d570`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl e913101fb`: zero conflicts.
- Files changed since the base: 3 on the branch side, 31 on the trunk side; on both sides: none.
- `git diff --name-only 888ea9a9d e913101fb -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-09-28_1015_prompt_demo_prep_3001.md` (eseguito 2026-09-28 · lane demo-prep, this worktree · the report and the log entry are in the commit that carries this line (a commit cannot name its own sha) · four scenes built headless against trunk 447e4239b, four JSON exports in /Users/alfonso/jjodel-demo-exports/, Alfonso imports them via the app's own Import).
- `git worktree list`: `demo-prep` in `/Users/alfonso/jjodel-w-demoprep`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-09-28-1236/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `e913101fb` is the tip of `demo-prep`; the prompt files of the branch read `Status: eseguito` at `e913101fb`; `git worktree list` shows `demo-prep` only in `/Users/alfonso/jjodel-w-demoprep`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl e913101fb` (measured above: zero conflicts). `git diff --name-only 888ea9a9d e913101fb -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 888ea9a9d alfonso-frontend-jjtl` with `git diff --name-only 888ea9a9d e913101fb` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-28 — task: the four demo projects built headless and exported for Alfonso's own Import (P-2026-09-28-1015)` once (branch).
4. `git merge --no-ff --no-commit e913101fb`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: demo-prep into alfonso-frontend-jjtl (P-2026-09-28-1236)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `e913101fb` in `/Users/alfonso/jjodel-w-demoprep`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/simulation.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the demo-prep merge (P-2026-09-28-1236)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-demoprep`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
