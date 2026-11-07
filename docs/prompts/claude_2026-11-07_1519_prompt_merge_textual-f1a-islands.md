# Prompt: merge textual-f1a-islands into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-07-1519
Chat: C-2026-11-03-1037
Request: https://claude.ai/code/session_01DQt9R5nh3m4Y234MPGL9kH (merge of textual-f1a-islands launched by chat C-2026-11-03-1037)
Lane: full (merge; 1 conflict: `docs/log-inbox/codegen.md` measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-07-1519 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `4834b0edb`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `textual-f1a-islands` into the trunk with one merge commit, `--no-ff`, of the explicit sha `6ce76bca7`, in the shape of `9c75afa97` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `945db7ab8`. The branch carries, on top of the base, 4 commits:

- `6ce76bca7` docs: Status flip and log entry for F1a (P-2026-11-07-1356)
- `2bd20c384` feat(codegen): F1a, jjelIslands with the value-to-text map (P-2026-11-07-1356)
- `d592aa7c2` feat(codegen): F1a, TextAttribute.jjel from the primitive's id (P-2026-11-07-1356)
- `5a337ab50` docs: add prompt P-2026-11-07-1356, F1a JjEL islands

The trunk carries, since the base, 36 commits:

- `4834b0edb` docs: prompt P-2026-11-07-1516, multi-tab lane L5
- `50d8a9a77` docs: Status flips and log entry for the multi-tab demo project (P-2026-11-07-1439)
- `687713a35` docs: prompt P-2026-11-07-1439, demo project continuation
- `3bdbb3c7d` docs: Status flip and log entry for the multi-tab-l3 merge (P-2026-11-07-1438)
- `9c75afa97` merge: multi-tab-l3 into alfonso-frontend-jjtl (P-2026-11-07-1438)
- `df5788565` docs: Status flip and log entry for the slot-identity-656 merge (P-2026-11-07-1418)
- `a4a899398` docs: add prompt P-2026-11-07-1438, merge multi-tab-l3 into alfonso-frontend-jjtl
- `17e21bac6` docs: multi-tab L3 app check, LIR addendum and closure (P-2026-11-07-1352)
- `c529f5dfe` merge: slot-identity-656 into alfonso-frontend-jjtl (P-2026-11-07-1418)
- `6c74b940f` docs: add prompt P-2026-11-07-1418, merge slot-identity-656 into alfonso-frontend-jjtl
- `4c948d6e9` docs: Status of P-2026-11-07-1003 in the eseguito form (dropped by R-TXT-58)
- `083b273e4` docs: prompt P-2026-11-07-1417, multi-tab demo project
- `85f3a67ca` docs: Status flip and log entry for the textual-e3-beside merge (P-2026-11-07-1353)
- `687294cff` merge: textual-e3-beside into alfonso-frontend-jjtl (P-2026-11-07-1353)
- `fb1a4b7e8` docs: add prompt P-2026-11-07-1353, merge textual-e3-beside into alfonso-frontend-jjtl
- `b33b17377` docs: prompt P-2026-11-07-1352, L3 app check and closure
- `0002f1ae4` feat(editor-v2): EditorV2 hands the tab viewpoint to useJjomSync (P-2026-11-07-1249)
- `b42fdf824` docs: Status flips and log entry for #656 L2 (P-2026-11-07-1230; P-2026-11-07-1003 dropped)
- `1015af5e1` feat(editor-v2): the three canvas doors take the tab's layout key (P-2026-11-07-1249)
- `4678327cc` test(editor-v2): the three canvas doors under the tab's layout key, red (P-2026-11-07-1249)
- `d9424764a` docs: Layer Impact Report for multi-tab L3, the tab's layout key (P-2026-11-07-1249)
- `cfef82da2` fix(codegen): #656 CHECK 2 and XMI read a never-written name slot (P-2026-11-07-1230)
- `d2baf819c` test(codegen): #656 CHECK 2 and XMI read a never-written name slot, red (P-2026-11-07-1230)
- `6a3b1cfc3` docs: Status flip and log entry for E3 (P-2026-11-07-1208)
- `a84429514` docs: add prompt P-2026-11-07-1230, #656 lane L2 read fallback
- `3863ac081` docs: R-TXT-58, #656 option (a): L1 dropped, L2 only (Alfonso 12:27)
- `5dcf50283` feat(codegen): E3, the Text tab opens beside its model's canvas (P-2026-11-07-1208)
- `5b13ac57a` test(codegen): E3, Text tab placement beside the canvas, red (P-2026-11-07-1208)
- `866d3fdc8` docs: add prompt P-2026-11-07-1208, E3 Text tab beside the canvas
- `c1236d46b` docs: add prompt P-2026-11-07-1003, #656 lane L1 executor
- `8d605903c` docs: R-TXT-57 header in the register format
- `8be0ab38c` docs: R-TXT-57, the answers to the #656 discovery (Alfonso 09:53)
- `b775f192b` docs: Status flips for the #656 discovery (P-2026-11-07-0654, P-2026-11-07-0720)
- `1f52e243c` docs: #656 discovery report, slot identity, and log entry (P-2026-11-07-0720)
- `22cea3e4b` docs: add prompt P-2026-11-07-0720, ticket #656 discovery continuation
- `8df0859f2` docs: add prompt P-2026-11-07-0654, ticket #656 discovery

Measured by `lane-run merge` at 2026-11-07 15:19, trunk at `4834b0edb`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 6ce76bca7`: 1 conflict: `docs/log-inbox/codegen.md`.
- Files changed since the base: 6 on the branch side, 40 on the trunk side; on both sides: `docs/log-inbox/codegen.md`.
- `git diff --name-only 945db7ab8 6ce76bca7 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-07_1356_prompt_textual_f1a_islands.md` (eseguito 2026-11-07 · lane full · d592aa7c2, 2bd20c384 · gates green (vitest: 3 import reds baseline, laneRun.test.ts load red green alone) · R1 probe in the app, no crops · log entry in docs/log-inbox/codegen.md).
- `git worktree list`: `textual-f1a-islands` in `/Users/alfonso/jjodel-w-textf1a`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-11-07-1519/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `6ce76bca7` is the tip of `textual-f1a-islands`; the prompt files of the branch read `Status: eseguito` at `6ce76bca7`; `git worktree list` shows `textual-f1a-islands` only in `/Users/alfonso/jjodel-w-textf1a`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 6ce76bca7` (measured above: 1 conflict: `docs/log-inbox/codegen.md`). `git diff --name-only 945db7ab8 6ce76bca7 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 945db7ab8 alfonso-frontend-jjtl` with `git diff --name-only 945db7ab8 6ce76bca7` (measured above: `docs/log-inbox/codegen.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-TXT-57` (trunk), `R-TXT-58` (trunk); control: `- **R-TXT-59**` none.
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — feat(codegen): F1a, JjEL islands and TextAttribute.jjel (P-2026-11-07-1356)` once (branch).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — feat(codegen): E3, the Text tab opens beside its model's canvas (P-2026-11-07-1208)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — merge: textual-e3-beside into alfonso-frontend-jjtl (P-2026-11-07-1353)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — discovery: ticket #656, the identity slot of objects created by JjScript and on the canvas (P-2026-11-07-0720)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — fix(codegen): #656 lane L2, CHECK 2 and the XMI export read a never-written name slot (P-2026-11-07-1230)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — merge: slot-identity-656 into alfonso-frontend-jjtl (P-2026-11-07-1418)` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-07 — feat: the three canvas doors take the tab's layout key (multi-tab L3)` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-07 — merge: multi-tab-l3 into alfonso-frontend-jjtl (P-2026-11-07-1438)` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-07 — demo: Smart building multi-tab project, built through the app, exported and delivered` once (trunk).
4. `git merge --no-ff --no-commit 6ce76bca7`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: textual-f1a-islands into alfonso-frontend-jjtl (P-2026-11-07-1519)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `6ce76bca7` in `/Users/alfonso/jjodel-w-textf1a`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-textf1a`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 4834b0edb` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only 4834b0edb HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/codegen.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the textual-f1a-islands merge (P-2026-11-07-1519)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-textf1a`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
