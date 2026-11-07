# Prompt: merge multi-tab-l3 into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-07-1438
Chat: —
Request: none (rendered by lane-run, no chat URL known for no --chat)
Lane: full (merge; zero conflicts measured)
Status: eseguito 2026-11-07 · lane merge · 9c75afa97 · verifica visiva passata 2026-11-07 (chat, unattended; Alfonso in the morning digest)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-07-1438 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `c529f5dfe`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `multi-tab-l3` into the trunk with one merge commit, `--no-ff`, of the explicit sha `17e21bac6`, in the shape of `c529f5dfe` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `9d3a79c22`. The branch carries, on top of the base, 6 commits:

- `17e21bac6` docs: multi-tab L3 app check, LIR addendum and closure (P-2026-11-07-1352)
- `b33b17377` docs: prompt P-2026-11-07-1352, L3 app check and closure
- `0002f1ae4` feat(editor-v2): EditorV2 hands the tab viewpoint to useJjomSync (P-2026-11-07-1249)
- `1015af5e1` feat(editor-v2): the three canvas doors take the tab's layout key (P-2026-11-07-1249)
- `4678327cc` test(editor-v2): the three canvas doors under the tab's layout key, red (P-2026-11-07-1249)
- `d9424764a` docs: Layer Impact Report for multi-tab L3, the tab's layout key (P-2026-11-07-1249)

The trunk carries, since the base, 46 commits:

- `c529f5dfe` merge: slot-identity-656 into alfonso-frontend-jjtl (P-2026-11-07-1418)
- `6c74b940f` docs: add prompt P-2026-11-07-1418, merge slot-identity-656 into alfonso-frontend-jjtl
- `4c948d6e9` docs: Status of P-2026-11-07-1003 in the eseguito form (dropped by R-TXT-58)
- `083b273e4` docs: prompt P-2026-11-07-1417, multi-tab demo project
- `85f3a67ca` docs: Status flip and log entry for the textual-e3-beside merge (P-2026-11-07-1353)
- `687294cff` merge: textual-e3-beside into alfonso-frontend-jjtl (P-2026-11-07-1353)
- `fb1a4b7e8` docs: add prompt P-2026-11-07-1353, merge textual-e3-beside into alfonso-frontend-jjtl
- `945db7ab8` docs: close the textual-687-comment-enter merge by hand (P-2026-11-07-1330)
- `c9d3ba4e2` merge: textual-687-comment-enter into alfonso-frontend-jjtl (P-2026-11-07-1330)
- `2f89a7aa3` docs: Status flip and log entry for the dcn-l42 merge (P-2026-11-07-1308)
- `b42fdf824` docs: Status flips and log entry for #656 L2 (P-2026-11-07-1230; P-2026-11-07-1003 dropped)
- `8ce739219` docs: add prompt P-2026-11-07-1330, merge textual-687-comment-enter into alfonso-frontend-jjtl
- `3f67f4e4c` docs: Status flip and log entry, textual-687-comment-enter took trunk (P-2026-11-07-1248)
- `75f973840` merge: dcn-l42 into alfonso-frontend-jjtl (P-2026-11-07-1308)
- `0d3af6e1d` docs: add prompt P-2026-11-07-1308, merge dcn-l42 into alfonso-frontend-jjtl
- `178c1c837` merge: dcn-l34 into dcn-l42 (d0a81202d)
- `cfef82da2` fix(codegen): #656 CHECK 2 and XMI read a never-written name slot (P-2026-11-07-1230)
- `d0a81202d` docs(dcn): Status flip and log entry for the L3.4 slot writes (P-2026-11-07-1215)
- `5d86470c9` feat(jjel): slot writes `self.battery := e` in a DCN action mode (P-2026-11-07-1215)
- `9e36d009a` docs(dcn): L4.2 log entry and Status flip (P-2026-11-07-1216)
- `cc917a087` merge: textual-687-comment-enter takes alfonso-frontend-jjtl (P-2026-11-07-1248)
- `d2baf819c` test(codegen): #656 CHECK 2 and XMI read a never-written name slot, red (P-2026-11-07-1230)
- `6a3b1cfc3` docs: Status flip and log entry for E3 (P-2026-11-07-1208)
- `4ea6bc699` docs: add prompt P-2026-11-07-1248, merge alfonso-frontend-jjtl into textual-687-comment-enter
- `839affc1a` fix(sim): under the dcn shape the roles dialog shows the dcn group only (P-2026-11-07-1216)
- `a5bef0684` feat(sim): the DCN compiler, roles and model to a placeless net (P-2026-11-07-1216)
- `0781ed96e` docs: Status flip and log entry for ticket #687 (P-2026-11-07-1145)
- `a84429514` docs: add prompt P-2026-11-07-1230, #656 lane L2 read fallback
- `3863ac081` docs: R-TXT-58, #656 option (a): L1 dropped, L2 only (Alfonso 12:27)
- `c9c34c610` fix(codegen): #687, Text tab editor turns word-based suggestions off (P-2026-11-07-1145)
- `5dcf50283` feat(codegen): E3, the Text tab opens beside its model's canvas (P-2026-11-07-1208)
- `0d689a2e6` docs(dcn): l42 prompt (P-2026-11-07-1216)
- `a08d9588b` docs(dcn): l34 prompt (P-2026-11-07-1215)
- `5b13ac57a` test(codegen): E3, Text tab placement beside the canvas, red (P-2026-11-07-1208)
- `866d3fdc8` docs: add prompt P-2026-11-07-1208, E3 Text tab beside the canvas
- `0ff891055` test(codegen): #687, the Text tab turns word-based suggestions off, red (P-2026-11-07-1145)
- `6822a9f21` fix(codegen): #687, no completion in a comment or a string (P-2026-11-07-1145)
- `77eb3b725` test(codegen): #687, no completion inside a comment or a string, red (P-2026-11-07-1145)
- `bf21c57a3` docs: add prompt P-2026-11-07-1145, ticket #687
- `c1236d46b` docs: add prompt P-2026-11-07-1003, #656 lane L1 executor
- and 6 more: `git log --oneline 9d3a79c22..c529f5dfe`

Measured by `lane-run merge` at 2026-11-07 14:38, trunk at `c529f5dfe`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 17e21bac6`: zero conflicts.
- Files changed since the base: 20 on the branch side, 36 on the trunk side; on both sides: none.
- `git diff --name-only 9d3a79c22 17e21bac6 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-07_1352_prompt_multi_tab_l3_app_check.md` (eseguito 2026-11-07 · lane full · no source change · single tab 3/3 every step x3, container 0 failures, two tabs L3 32/32 reads per pane at the tab's own key x4, drag in B under W only, 0457 V1/V2/V3/R-MT-18 unchanged · LIR §6 · hard-stop: visual check due · non fuso).
- `git worktree list`: `multi-tab-l3` in `/Users/alfonso/jjodel-w-mtl3`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `17e21bac6` is the tip of `multi-tab-l3`; the prompt files of the branch read `Status: eseguito` at `17e21bac6`; `git worktree list` shows `multi-tab-l3` only in `/Users/alfonso/jjodel-w-mtl3`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 17e21bac6` (measured above: zero conflicts). `git diff --name-only 9d3a79c22 17e21bac6 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 9d3a79c22 alfonso-frontend-jjtl` with `git diff --name-only 9d3a79c22 17e21bac6` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-TXT-57` (trunk), `R-TXT-58` (trunk); control: `- **R-TXT-59**` none.
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-07 — feat: the three canvas doors take the tab's layout key (multi-tab L3)` once (branch).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — fix(codegen): #687, Enter at a comment's end breaks the line (P-2026-11-07-1145)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — merge: textual-687-comment-enter takes alfonso-frontend-jjtl (P-2026-11-07-1248)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — merge: textual-687-comment-enter into alfonso-frontend-jjtl (P-2026-11-07-1330)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — feat(codegen): E3, the Text tab opens beside its model's canvas (P-2026-11-07-1208)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — merge: textual-e3-beside into alfonso-frontend-jjtl (P-2026-11-07-1353)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — discovery: ticket #656, the identity slot of objects created by JjScript and on the canvas (P-2026-11-07-0720)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — fix(codegen): #656 lane L2, CHECK 2 and the XMI export read a never-written name slot (P-2026-11-07-1230)` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-07 — feat: the DCN compiler, resolved roles and model to a placeless net` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-07 — feat: slot writes `self.battery := e` in a DCN action mode` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-07 — merge: dcn-l42 into alfonso-frontend-jjtl (P-2026-11-07-1308)` once (trunk).
4. `git merge --no-ff --no-commit 17e21bac6`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: multi-tab-l3 into alfonso-frontend-jjtl (P-2026-11-07-1438)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `17e21bac6` in `/Users/alfonso/jjodel-w-mtl3`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-mtl3`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard c529f5dfe` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only c529f5dfe HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/multi-tab.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the multi-tab-l3 merge (P-2026-11-07-1438)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-mtl3`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
