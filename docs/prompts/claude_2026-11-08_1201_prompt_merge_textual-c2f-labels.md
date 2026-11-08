# Prompt: merge textual-c2f-labels into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-08-1201
Chat: C-2026-11-03-1037
Request: https://claude.ai/code/session_01DQt9R5nh3m4Y234MPGL9kH (merge of textual-c2f-labels launched by chat C-2026-11-03-1037)
Lane: full (merge; 1 conflict: `docs/log-inbox/codegen.md` measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-08-1201 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `34a511ffb`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `textual-c2f-labels` into the trunk with one merge commit, `--no-ff`, of the explicit sha `5173fe284`, in the shape of `1828934f1` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `f4dc218c3`. The branch carries, on top of the base, 6 commits:

- `5173fe284` docs: C2f log entry and Status flips, Alfonso visual GO (P-2026-11-08-0843)
- `9c44d338a` fix(editor-v2): C2f, IR reference widgets name unnamed targets (P-2026-11-08-0843)
- `8df0eb631` fix(editor-v2): C2f, the labels of the unnamed targets of one list (P-2026-11-08-0843)
- `78a5bc7e6` docs: Layer Impact Report for C2f nameless reference labels (P-2026-11-08-0843)
- `a7023ff6d` docs: add prompt P-2026-11-08-0843, C2f in the critical zone (Alfonso 08:33)
- `cf8d07cf2` docs: add prompt P-2026-11-08-0818, ticket C2f unnamed reference targets

The trunk carries, since the base, 64 commits:

- `34a511ffb` docs: Status flip and log entry for the jjtl-multi-source-app merge (P-2026-11-08-1147)
- `1828934f1` merge: jjtl-multi-source-app into alfonso-frontend-jjtl (P-2026-11-08-1147)
- `19446093e` docs: add prompt P-2026-11-08-1147, merge jjtl-multi-source-app into alfonso-frontend-jjtl
- `1afa8ebb4` docs: Status flips, log entry and ticket of the run dialog (P-2026-11-08-1120)
- `67e2f1a7f` docs(jjtl): report of the run dialog with several sources (P-2026-11-08-1120)
- `7849b01ca` docs(jjtl): SPEC 9, several source models in a run (P-2026-11-08-1120)
- `af756e1ea` fix(jjtl): real checkboxes, list clear of labels (P-2026-11-08-1120)
- `d2e654cf0` feat(jjtl): several source models in the run dialog (P-2026-11-08-1120)
- `90097dc4d` docs: add prompt P-2026-11-08-1120, close S4 with two visual fixes
- `4e21a6aff` docs: add prompt P-2026-11-08-1026, several source models in the run dialog
- `e88ab3d06` docs: Status flip and log entry for the jjtl-demand-read merge (P-2026-11-08-1041)
- `b173e1fa7` merge: jjtl-demand-read into alfonso-frontend-jjtl (P-2026-11-08-1041)
- `23fcf820f` docs: add prompt P-2026-11-08-1041, merge jjtl-demand-read into alfonso-frontend-jjtl
- `e55692902` docs: Status flip and log entry for the demand read warning (P-2026-11-08-1025)
- `0264b6d75` docs: R-JTG-32, a property read on a demand warns (P-2026-11-08-1025)
- `1ee641a82` docs(jjtl): SPEC 10, a property read on a demand warns (P-2026-11-08-1025)
- `6555ebdd0` fix(jjtl): a property read on a demand warns (P-2026-11-08-1025)
- `4c7e0882a` docs: add prompt P-2026-11-08-1025, a property read on a demand warns
- `b3b82d861` docs: R-JTG-31 ratified by Alfonso
- `c2661002b` docs: Status flip and log entry for the jjtl-multi-source merge (P-2026-11-08-0939)
- `f1a25f705` docs: checkpoint update, morning queue of the codegen front (C-2026-11-03-1037)
- `813c8a206` docs: Status flip and log entry for the textual-tab-fixes merge (P-2026-11-08-0932)
- `4f5404338` merge: jjtl-multi-source into alfonso-frontend-jjtl (P-2026-11-08-0939)
- `30790af6c` docs: add prompt P-2026-11-08-0939, merge jjtl-multi-source into alfonso-frontend-jjtl
- `49cd0871d` merge: textual-tab-fixes into alfonso-frontend-jjtl (P-2026-11-08-0932)
- `8d050e777` docs: add prompt P-2026-11-08-0932, merge textual-tab-fixes into alfonso-frontend-jjtl
- `0b56563f7` docs: Text tab fixes log entry and Status flip (P-2026-11-08-0859)
- `eeabc2c1f` docs: log entry for the multi-model executor lane (P-2026-11-08-0836)
- `9d56a88c1` docs: Status flip of the multi-model executor lane (P-2026-11-08-0836)
- `a2ea341bb` docs: R-JTG-31, input shape of a list of source models (P-2026-11-08-0836)
- `202b32efc` docs(jjtl): SPEC for a list of source models (P-2026-11-08-0836)
- `cc1ce544f` feat(jjtl): several source models of one metamodel (P-2026-11-08-0836)
- `8f9391b74` docs: add prompt P-2026-11-08-0836, several source models, executor side
- `18ce96017` docs: Status flip and log entry for the jjtl-demand-cmp merge (P-2026-11-08-0901)
- `eb6c08382` fix(codegen): index unnamed homonyms in the confirm panel (P-2026-11-08-0859)
- `c53f1419d` fix(codegen): Text tab reads the canvas selection on open (P-2026-11-08-0859)
- `55ac2cc03` fix(codegen): JjEL warnings survive a reprint (P-2026-11-08-0859)
- `6fde8bad1` merge: jjtl-demand-cmp into alfonso-frontend-jjtl (P-2026-11-08-0901)
- `2724c10ad` docs: add prompt P-2026-11-08-0901, merge jjtl-demand-cmp into alfonso-frontend-jjtl
- `fb93809cf` docs: prompt for the Text tab fixes lane (P-2026-11-08-0859)
- and 24 more: `git log --oneline f4dc218c3..34a511ffb`

Measured by `lane-run merge` at 2026-11-08 12:01, trunk at `34a511ffb`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 5173fe284`: 1 conflict: `docs/log-inbox/codegen.md`.
- Files changed since the base: 9 on the branch side, 42 on the trunk side; on both sides: `docs/log-inbox/codegen.md`.
- `git diff --name-only f4dc218c3 5173fe284 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-08_0818_prompt_textual_c2f_labels.md` (eseguito 2026-11-08 · superseded by P-2026-11-08-0843 · the session stopped at Outcome: question, no file changed: the site is in the IR form widgets, not in the Syntax form), `claude_2026-11-08_0843_prompt_textual_c2f_critical.md` (eseguito 2026-11-08 · lane full · 9c44d338a · gates green (typecheck 0, build, check:docs, vitest 15227 passed with the 3 baseline import reds, smoke GREEN) · probe 13/13 on 3547, crops in ~/.jjodel-lanes/P-2026-11-08-0843/ · verifica visiva: GO di Alfonso 2026-11-08 11:59).
- `git worktree list`: `textual-c2f-labels` in `/Users/alfonso/jjodel-w-textc2f`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-11-08-1201/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `5173fe284` is the tip of `textual-c2f-labels`; the prompt files of the branch read `Status: eseguito` at `5173fe284`; `git worktree list` shows `textual-c2f-labels` only in `/Users/alfonso/jjodel-w-textc2f`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 5173fe284` (measured above: 1 conflict: `docs/log-inbox/codegen.md`). `git diff --name-only f4dc218c3 5173fe284 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only f4dc218c3 alfonso-frontend-jjtl` with `git diff --name-only f4dc218c3 5173fe284` (measured above: `docs/log-inbox/codegen.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-JTG-30` (trunk), `R-JTG-31` (trunk), `R-JTG-32` (trunk), `R-MT-25` (trunk); control: `- **R-MT-26**` none.
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — fix(editor-v2): C2f, IR reference widgets name unnamed targets (P-2026-11-08-0843)` once (branch).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — feat(codegen): T8c, the re-import dialog in the confirm panel (P-2026-11-08-0739)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — merge: textual-t8c-dialog into alfonso-frontend-jjtl (P-2026-11-08-0829)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — test(codegen): T8d, calibration bench of the match thresholds (P-2026-11-08-0831)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — merge: textual-t8d-calibration into alfonso-frontend-jjtl (P-2026-11-08-0845)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — fix(codegen): TABFIX, three Text tab candidate tickets (P-2026-11-08-0859)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — merge: textual-tab-fixes into alfonso-frontend-jjtl (P-2026-11-08-0932)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-08 — merge: jjtl-envvalue into alfonso-frontend-jjtl (P-2026-11-08-0814)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-08 — fix(jjtl): a demand compared or called stops the run (P-2026-11-08-0835)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-08 — merge: jjtl-demand-cmp into alfonso-frontend-jjtl (P-2026-11-08-0901)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-08 — feat(jjtl): several source models of one metamodel, executor side (P-2026-11-08-0836)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-08 — merge: jjtl-multi-source into alfonso-frontend-jjtl (P-2026-11-08-0939)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-08 — fix(jjtl): a property read on a demand warns (P-2026-11-08-1025)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-08 — merge: jjtl-demand-read into alfonso-frontend-jjtl (P-2026-11-08-1041)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-08 — ticket: envLookup on an unbound name is null, so + "_w" succeeds` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-08 — feat(jjtl): several source models in the run dialog, closed with two visual fixes (P-2026-11-08-1120)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-08 — merge: jjtl-multi-source-app into alfonso-frontend-jjtl (P-2026-11-08-1147)` once (trunk).
4. `git merge --no-ff --no-commit 5173fe284`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: textual-c2f-labels into alfonso-frontend-jjtl (P-2026-11-08-1201)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `5173fe284` in `/Users/alfonso/jjodel-w-textc2f`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-textc2f`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 34a511ffb` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only 34a511ffb HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/codegen.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the textual-c2f-labels merge (P-2026-11-08-1201)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-textc2f`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
