# Prompt: merge textual-t8c-dialog into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-08-0829
Chat: C-2026-11-03-1037
Request: https://claude.ai/code/session_01DQt9R5nh3m4Y234MPGL9kH (merge of textual-t8c-dialog launched by chat C-2026-11-03-1037)
Lane: full (merge; 1 conflict: `docs/log-inbox/codegen.md` measured)
Status: eseguito 2026-11-08 · lane merge · 41e635098 · verifica visiva passata 2026-11-08 (T8c crops 1-counts, 2-uncertain, 4-cancel in ~/.jjodel-lanes/P-2026-11-08-0739/ checked by the chat)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-08-0829 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `e8b279b0d`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `textual-t8c-dialog` into the trunk with one merge commit, `--no-ff`, of the explicit sha `948b1402b`, in the shape of `2f389051a` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `ce18b0c02`. The branch carries, on top of the base, 6 commits:

- `948b1402b` docs: Status flips and log entry for T8c (P-2026-11-08-0739, 0802)
- `c7a675654` docs: add prompt P-2026-11-08-0802, T8c continuation
- `acf1391ee` feat(codegen): T8c confirm panel, counts, ticks and Cancel (P-2026-11-08-0739)
- `66c612ab3` feat(codegen): T8c plan rows, scores and unticked pairings (P-2026-11-08-0739)
- `73af79b35` docs: renumber the T8c prompt to P-2026-11-08-0739 (0737 was taken by the multi-tab chat)
- `211340722` docs: add prompt P-2026-11-08-0737, T8c re-import dialog

The trunk carries, since the base, 26 commits:

- `e8b279b0d` docs: Status flip and log entry for the jjtl-envvalue merge (P-2026-11-08-0814)
- `f4dc218c3` docs: Status flip and log entry for the textual-d2d-suggest merge (P-2026-11-08-0803)
- `2f389051a` merge: jjtl-envvalue into alfonso-frontend-jjtl (P-2026-11-08-0814)
- `8925f8e6d` docs: add prompt P-2026-11-08-0814, merge jjtl-envvalue into alfonso-frontend-jjtl
- `f64bd6592` docs: prompt P-2026-11-08-0808, multi-tab L6 second tab on one model
- `faf11a4fe` merge: textual-d2d-suggest into alfonso-frontend-jjtl (P-2026-11-08-0803)
- `4650badba` docs: add prompt P-2026-11-08-0803, merge textual-d2d-suggest into alfonso-frontend-jjtl
- `c0fd90739` docs: Status flip and log entry for D2d (P-2026-11-08-0738)
- `bcd38ed2e` docs: Status flip and log entry for the multi-tab-l4 merge (P-2026-11-08-0737)
- `a9ac45e81` docs: Status flip of P-2026-11-08-0740, envValue and demand as value
- `017e6219d` docs: log entry for envValue and demand-as-value (P-2026-11-08-0740)
- `1f163a4d8` docs: R-JTG-23..29, the kernel-gaps recommendations (P-2026-11-08-0740)
- `0fbc6a015` docs(jjtl): SPEC §5.3.3 and §10, envValue and a demand as operand (P-2026-11-08-0740)
- `93cf9f04b` fix(jjtl): a demand used as an operand stops the run (P-2026-11-08-0740)
- `0d5044329` fix(codegen): D2d, suggest row inside the Text tab's widget (P-2026-11-08-0738)
- `a35b54454` fix(jjtl): envValue returns a bound value, not a demand (P-2026-11-08-0740)
- `0046f604a` merge: multi-tab-l4 into alfonso-frontend-jjtl (P-2026-11-08-0737)
- `59b8e47fa` docs: add prompt P-2026-11-08-0738, ticket D2d suggest row overflow
- `59138cafd` docs: add prompt P-2026-11-08-0737, merge multi-tab-l4 into alfonso-frontend-jjtl
- `2e8af9ab8` docs: add prompt P-2026-11-08-0740, envValue and a demand used as a value
- `d2b184780` docs: multi-tab L4 closure, app measurement and regressions (P-2026-11-08-0245)
- `b43fe7b9d` docs: prompt P-2026-11-08-0245, multi-tab L4 regressions and closure
- `1cc639636` docs: prompt P-2026-11-08-0150, multi-tab L4 check and closure
- `587aed3cf` fix(editor-v2): one populate owner per model, last instance clears (P-2026-11-08-0131)
- `634dceabf` test(editor-v2): one populate owner per model, red (P-2026-11-08-0131)
- `f888be09f` docs: Layer Impact Report for multi-tab L4, one populate owner per model (P-2026-11-08-0131)

Measured by `lane-run merge` at 2026-11-08 08:29, trunk at `e8b279b0d`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 948b1402b`: 1 conflict: `docs/log-inbox/codegen.md`.
- Files changed since the base: 8 on the branch side, 23 on the trunk side; on both sides: `docs/log-inbox/codegen.md`.
- `git diff --name-only ce18b0c02 948b1402b -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-08_0739_prompt_textual_t8c_dialog.md` (eseguito 2026-11-08 · lane full · 66c612ab3 (red first, bench 8/8), acf1391ee (red first, bench 6/6) · continued in P-2026-11-08-0802 after the context ceiling · gates green (vitest: 3 import reds baseline) · app check ALL PASS, crops in ~/.jjodel-lanes/P-2026-11-08-0739/ · log entry in docs/log-inbox/codegen.md, uncommitted (RC-17)), `claude_2026-11-08_0802_prompt_textual_t8c_continuation.md` (eseguito 2026-11-08 · lane full · no code (probe line fixed, no defect) · probe t8c-probe2 ALL PASS, crops 1-4 in ~/.jjodel-lanes/P-2026-11-08-0739/ · gates green (vitest: 3 import reds baseline, 2 load reds green alone) · log entry in docs/log-inbox/codegen.md, uncommitted (RC-17)).
- `git worktree list`: `textual-t8c-dialog` in `/Users/alfonso/jjodel-w-textt8c`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-11-08-0829/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `948b1402b` is the tip of `textual-t8c-dialog`; the prompt files of the branch read `Status: eseguito` at `948b1402b`; `git worktree list` shows `textual-t8c-dialog` only in `/Users/alfonso/jjodel-w-textt8c`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 948b1402b` (measured above: 1 conflict: `docs/log-inbox/codegen.md`). `git diff --name-only ce18b0c02 948b1402b -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only ce18b0c02 alfonso-frontend-jjtl` with `git diff --name-only ce18b0c02 948b1402b` (measured above: `docs/log-inbox/codegen.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-JTG-23` (trunk), `R-JTG-24` (trunk), `R-JTG-25` (trunk), `R-JTG-26` (trunk), `R-JTG-27` (trunk), `R-JTG-28` (trunk), `R-JTG-29` (trunk); control: `- **R-JTG-30**` none.
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — feat(codegen): T8c, the re-import dialog in the confirm panel (P-2026-11-08-0739)` once (branch).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — fix(codegen): D2d, suggest row inside the Text tab's widget (P-2026-11-08-0738)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — merge: textual-d2d-suggest into alfonso-frontend-jjtl (P-2026-11-08-0803)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-08 — fix(jjtl): envValue, and a demand used as an operand stops the run (P-2026-11-08-0740)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-08 — merge: jjtl-envvalue into alfonso-frontend-jjtl (P-2026-11-08-0814)` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-08 — fix: one populate owner per model, the last instance clears (multi-tab L4)` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-08 — ticket: sync registries have no model key, the last tab of model N clears model M` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-08 — merge: multi-tab-l4 into alfonso-frontend-jjtl (P-2026-11-08-0737)` once (trunk).
4. `git merge --no-ff --no-commit 948b1402b`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: textual-t8c-dialog into alfonso-frontend-jjtl (P-2026-11-08-0829)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `948b1402b` in `/Users/alfonso/jjodel-w-textt8c`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-textt8c`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard e8b279b0d` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only e8b279b0d HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/codegen.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the textual-t8c-dialog merge (P-2026-11-08-0829)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-textt8c`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
