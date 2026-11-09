# Prompt: merge oi-s3b into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-07-1834
Chat: C-2026-10-25-2159
Request: none (rendered by lane-run, no chat URL known for C-2026-10-25-2159)
Lane: full (merge; zero conflicts measured)
Status: eseguito 2026-11-07 · lane merge · e5add4d95 · verifica visiva passata 2026-11-07 (Alfonso, GO 15:10)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-07-1834 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `f5fc80aaf`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `oi-s3b` into the trunk with one merge commit, `--no-ff`, of the explicit sha `065a1c501`, in the shape of `e13181617` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `4834b0edb`. The branch carries, on top of the base, 63 commits:

- `065a1c501` docs: flip Status of P-2026-11-06-2257 to eseguito
- `7ceddb928` docs: S2, S3a, S3b probe results on the per-tab fix
- `4b665664a` docs: instance-of entry and Status flips for 1517 and 1620 (P-2026-11-07-1620)
- `aad8e74bb` fix(editor-v2): instantiation per tab: producer mounts, tab layout (P-2026-11-07-1620)
- `a871ae84e` docs(prompts): instance-of on the multi-tab trunk (P-2026-11-07-1620)
- `cbc392c69` merge: oi-s3b takes alfonso-frontend-jjtl (P-2026-11-07-1517)
- `af83bdfe6` docs(prompts): oi-s3b takes the trunk at 3.2.0 (P-2026-11-07-1517)
- `e193ad04a` docs: visual GO on oi-s3b, Status flips
- `892a962bb` docs: R-OI-17 right button opens menus, lane entry (P-2026-11-07-1235)
- `5cba3621c` chore(probe): S2-1m, a right click that moves opens the pane menu (P-2026-11-07-1235)
- `af1230b5d` fix(editor-v2): the right button opens the pane menu, no pan (P-2026-11-07-1235)
- `5a167d4bd` docs(prompts): right button opens the pane menu (P-2026-11-07-1235)
- `5101a9ecb` docs: undo groups L5, R-OI-14/15 wording, chain closing entry (P-2026-11-07-0155)
- `23e741a97` chore(probe): bring dune into view before its DOM lookup (P-2026-11-07-0155)
- `7767a7f76` docs(prompts): undo groups L5, probe setup and docs (P-2026-11-07-0155)
- `f04faba02` merge: oi-s3a into oi-s3b, ghost values on the id-less groups (P-2026-11-07-0110)
- `89642dce7` docs(prompts): undo groups L4, oi-s3b on oi-s3a (P-2026-11-07-0110)
- `f7d46e0c9` docs(discovery): S3-4 extra undo entry, overlay click (P-2026-11-07-0040)
- `72ad1753d` fix(problems): overlay events stop before the node (P-2026-11-07-0040)
- `bfd8f29e1` docs(prompts): overlay click does not select the node (P-2026-11-07-0040)
- `ccb3abd2b` chore(probe): open the model tab when no enabled viewpoint trigger (P-2026-11-07-0005)
- `e5f27e460` docs(prompts): S3-4 extra undo entry diagnosis (P-2026-11-07-0005)
- `6b52b905d` merge: oi-s2u into oi-s3a, Sync slots on the id-less groups (P-2026-11-06-2340)
- `afef5e1f5` docs(prompts): undo groups L3, oi-s3a on oi-s2u (P-2026-11-06-2340)
- `84350015a` docs: undo groups L1..L2 closed, probes and inbox entry (P-2026-11-06-2257)
- `87cf9a392` docs(prompts): undo groups L2, regression probes (P-2026-11-06-2257)
- `9baae8d88` test(onto): Q1 starts the second call inside the first's group (P-2026-11-06-2225)
- `19abb1356` test(smoke): seed the 3.1.1 welcome key
- `809d85ce1` fix(onto): one deadline per instantiation, instantiations queued (P-2026-11-06-2225)
- `2b631803a` docs(prompts): undo groups L1b, deadline and queue (P-2026-11-06-2225)
- `197ae1fd1` merge: alfonso-frontend-jjtl into oi-s2u, undo groups (c) (P-2026-11-06-2150)
- `05393ac9a` docs(prompts): undo groups L1, trunk into oi-s2u (P-2026-11-06-2150)
- `f6bf690b7` docs(onto): S3b acceptance assets and closing entry (P-2026-10-25-2220)
- `cd69c6243` chore(probe): S3b ghost and orphan rows acceptance (P-2026-10-25-2220)
- `2a72213a4` docs(prompts): S3b lane B, probe and closure (P-2026-10-25-2220)
- `f454b12b7` feat(onto): S3b ghost and orphan rows (P-2026-10-25-2205)
- `6b17e7830` docs(prompts): S3b lane A continuation (P-2026-10-25-2205)
- `d6fa8ba7f` docs(onto): S3b discovery, ghost rows and orphan rows (P-2026-10-21-1910)
- `329bda77e` docs(onto): S3a acceptance assets and closing entry (P-2026-10-21-1636)
- `bb99637b4` chore(probe): S3a acceptance probe, slot problems and Sync slots (P-2026-10-21-1636)
- and 23 more: `git log --oneline 4834b0edb..065a1c501`

The trunk carries, since the base, 62 commits:

- `f5fc80aaf` docs(prompts): session title hook probe
- `c3d0663ed` docs: Status flip and log entry for the textual-e2b-highlight merge (P-2026-11-07-1821)
- `e13181617` merge: textual-e2b-highlight into alfonso-frontend-jjtl (P-2026-11-07-1821)
- `821feadd0` docs: add prompt P-2026-11-07-1821, merge textual-e2b-highlight into alfonso-frontend-jjtl
- `63b99779b` docs: Status flip and log entry for the dcn-l44b merge (P-2026-11-07-1756)
- `ced5a3d13` merge: dcn-l44b into alfonso-frontend-jjtl (P-2026-11-07-1756)
- `44ecca1f1` docs: Status flip and log entry for the textual-f1d-complete merge (P-2026-11-07-1733)
- `0ab98c2d9` docs: add prompt P-2026-11-07-1756, merge dcn-l44b into alfonso-frontend-jjtl
- `2cb5cca14` docs(dcn): Status flip and log entry for L4.4b (P-2026-11-07-1650)
- `99657324e` merge: textual-f1d-complete into alfonso-frontend-jjtl (P-2026-11-07-1733)
- `2b28fc242` feat(dcn): an invocation is one step under Interleave too (P-2026-11-07-1650)
- `7cfb24ed6` docs: add prompt P-2026-11-07-1733, merge textual-f1d-complete into alfonso-frontend-jjtl
- `62f8ca670` docs: Status flip and log entry for E2b (P-2026-11-07-1635)
- `a8b7c4b57` docs: Status flip and log entry for F1d (P-2026-11-07-1622)
- `9d80bf810` docs: Status flip and log entry for the jjtl-helper-param-shadow merge (P-2026-11-07-1643)
- `ff4450aaa` merge: jjtl-helper-param-shadow into alfonso-frontend-jjtl (P-2026-11-07-1643)
- `dae6ba6c1` feat(codegen): E2b, canvas selection highlighted in the Text tab (P-2026-11-07-1635)
- `ac1c92a9f` docs(dcn): L4.4b prompt (P-2026-11-07-1650)
- `d49d0245b` docs(dcn): R-DCN-22 atomic invocation, R-DCN-23 write ownership (W6)
- `03ce6a2d9` docs: add prompt P-2026-11-07-1643, merge jjtl-helper-param-shadow into alfonso-frontend-jjtl
- `2666906fa` feat(codegen): F1d, `.` triggers completion in a JjEL island (P-2026-11-07-1622)
- `d20872c26` test(codegen): F1d, `.` triggers completion in an island only, red (P-2026-11-07-1622)
- `c933ffbcf` feat(codegen): F1d, completion inside a JjEL island (P-2026-11-07-1622)
- `8f4fd2338` feat(codegen): E2b, canvas selection to text spans (P-2026-11-07-1635)
- `eb1bbfb10` test(codegen): F1d, completion inside a JjEL island, red (P-2026-11-07-1622)
- `ce9f23b59` docs: add prompt P-2026-11-07-1635, E2b canvas selection in the Text tab
- `c0ee2cc00` docs: Status flip and log entry for the textual-f1c-check merge (P-2026-11-07-1617)
- `0dcc8fd80` docs: Status flip and log entry for helper parameter shadowing (P-2026-11-06-2226)
- `9410651fd` docs(jjtl): SPEC §3.4, helper parameters shadow helpers (P-2026-11-06-2226)
- `db2c1be10` fix(jjtl): a helper parameter shadows a helper of the same name (P-2026-11-06-2226)
- `e59d6025e` merge: textual-f1c-check into alfonso-frontend-jjtl (P-2026-11-07-1617)
- `0bc3c4099` docs: add prompt P-2026-11-07-1622, F1d completion in an island
- `202444347` docs: add prompt P-2026-11-07-1617, merge textual-f1c-check into alfonso-frontend-jjtl
- `24dd48824` docs: prompt for JjTL helper parameter shadowing (P-2026-11-06-2226)
- `d7fc4aa7e` docs: Status flip and log entry for the dcn-l44 merge (P-2026-11-07-1545)
- `601b46ceb` merge: dcn-l44 into alfonso-frontend-jjtl (P-2026-11-07-1545)
- `e8d4c0f39` docs: Status flip and log entry for F1c (P-2026-11-07-1522)
- `4af0df2c6` docs: add prompt P-2026-11-07-1545, merge dcn-l44 into alfonso-frontend-jjtl
- `d817420e8` docs: close the F1a merge by hand (P-2026-11-07-1519)
- `247d6775e` docs: R-MT-24, Open beside from the model context menu (C-2026-11-07-1340)
- and 22 more: `git log --oneline 4834b0edb..f5fc80aaf`

Measured by `lane-run merge` at 2026-11-07 18:34, trunk at `f5fc80aaf`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 065a1c501`: zero conflicts.
- Files changed since the base: 53 on the branch side, 50 on the trunk side; on both sides: `docs/decisions.md`.
- `git diff --name-only 4834b0edb 065a1c501 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-10-25_2205_prompt_onto_s3b_code_resume.md` (eseguito), `claude_2026-10-25_2220_prompt_onto_s3b_probe.md` (eseguito 2026-10-25 · lane full · probe cd69c6243, closing f6bf690b7 · Alfonso visual GO 2026-11-07 15:10 on :3005 (binding declared from the console, pages added from the console)), `claude_2026-11-06_2150_prompt_onto_undo_l1_merge.md` (eseguito 2026-11-06 · lane full · 197ae1fd1), `claude_2026-11-06_2225_prompt_onto_undo_l1b.md` (eseguito 2026-11-06 · lane full · 9baae8d88), `claude_2026-11-06_2257_prompt_onto_undo_l2_probes.md` (eseguito), `claude_2026-11-06_2340_prompt_onto_undo_l3_s3a.md` (eseguito), `claude_2026-11-07_0005_prompt_onto_s3_4_diagnosis.md` (eseguito), `claude_2026-11-07_0040_prompt_onto_overlay_click_fix.md` (eseguito), `claude_2026-11-07_0110_prompt_onto_undo_l4_s3b.md` (eseguito), `claude_2026-11-07_0155_prompt_onto_undo_l5_close.md` (eseguito 2026-11-07 · lane full · probe 23e741a97, docs 5101a9ecb · Alfonso visual GO 2026-11-07 15:10 on :3005 (binding declared from the console, pages added from the console)), `claude_2026-11-07_1235_prompt_onto_pane_menu_right_button.md` (eseguito 2026-11-07 · lane full · fix af1230b5d, probe 5cba3621c, docs 892a962bb · Alfonso visual GO 2026-11-07 15:10 on :3005 (binding declared from the console, pages added from the console)), `claude_2026-11-07_1517_prompt_oi-s3b_take_trunk.md` (eseguito 2026-11-07 · lane full · merge cbc392c69 (undoGroup.test.ts union, gates green; check:addonly red, inherited from trunk 3f7f6f7f4, declared) · log entry in docs/log-inbox/instance-of.md with P-2026-11-07-1620), `claude_2026-11-07_1620_prompt_onto_multitab_gaps.md` (eseguito 2026-11-07 · lane full · code aad8e74bb (option (A), RC-21: instantiate.ts and its test added to DOVE) · unit tests only, two tabs on one model before L6 not reachable · log entry in docs/log-inbox/instance-of.md).
- `git worktree list`: `oi-s3b` in `/Users/alfonso/jjodel-w-oi-s3b`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-11-07-1834/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `065a1c501` is the tip of `oi-s3b`; the prompt files of the branch read `Status: eseguito` at `065a1c501`; `git worktree list` shows `oi-s3b` only in `/Users/alfonso/jjodel-w-oi-s3b`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 065a1c501` (measured above: zero conflicts). `git diff --name-only 4834b0edb 065a1c501 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 4834b0edb alfonso-frontend-jjtl` with `git diff --name-only 4834b0edb 065a1c501` (measured above: `docs/decisions.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-OI-17` (branch), `R-DCN-22` (trunk), `R-DCN-23` (trunk), `R-MT-24` (trunk); control: `- **R-MT-25**` none.
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-10-21 — fix: S2 closure, cascade clamp, acceptance probe and assets (P-2026-10-21-0635)` once (branch).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-10-21 — ticket: a new instance's node is clipped, name and type unreadable` once (branch).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-10-21 — ticket: place a new instance at the click without breaking undo` once (branch).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-10-21 — fix: size a new instance's node from its rows, ticket (b) closed (P-2026-10-21-0725)` once (branch).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-10-21 — ticket: a new instance made from the class diagram keeps 280x60 in the object diagram` once (branch).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-10-21 — fix: S2u one undo entry per instantiation, tickets (a) and (c) closed (P-2026-10-21-1219)` once (branch).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-10-21 — ticket: undo outside a group merges shallow and leaves idlookup orphans` once (branch).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-10-21 — fix: S3a acceptance probe, regression, assets, closing (P-2026-10-21-1636)` once (branch).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-10-21 — ticket: an orphan slot's row shows its value with no feature name` once (branch).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-10-21 — ticket: an undo entry with nothing created after a problem-dot click` once (branch).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-10-25 — fix: S3b ghost and orphan rows, probe, regression, assets (P-2026-10-25-2220)` once (branch).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-10-25 — ticket: opening a ghost row's editor adds an undo entry with nothing created` once (branch).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-10-25 — ticket: a ghost row's feature name is cut while its value is typed` once (branch).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-11-06 — fix: undo groups reconciled with option (c), L1..L2 closed (P-2026-11-06-2257)` once (branch).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-11-07 — fix: undo groups L3..L5 on oi-s3a and oi-s3b, chain closed (P-2026-11-07-0155)` once (branch).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-11-07 — fix: the right button opens the pane menu, no pan (P-2026-11-07-1235)` once (branch).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-11-07 — fix: instance-of on the multi-tab trunk, per-tab producer and placement (P-2026-11-07-1620)` once (branch).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — feat(codegen): F1a, JjEL islands and TextAttribute.jjel (P-2026-11-07-1356)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — merge: textual-f1a-islands into alfonso-frontend-jjtl (P-2026-11-07-1519)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — feat(codegen): F1b, JjEL highlighted inside its islands (P-2026-11-07-1444)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — feat(codegen): F1c, JjEL syntax check inside the islands (P-2026-11-07-1522)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — merge: textual-f1c-check into alfonso-frontend-jjtl (P-2026-11-07-1617)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — feat(codegen): F1d, completion inside a JjEL island (P-2026-11-07-1622)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — merge: textual-f1d-complete into alfonso-frontend-jjtl (P-2026-11-07-1733)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — feat(codegen): E2b, canvas selection highlighted in the Text tab (P-2026-11-07-1635)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — merge: textual-e2b-highlight into alfonso-frontend-jjtl (P-2026-11-07-1821)` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-07 — feat: σ-backed handles for DCN instances, the classification accessor bound` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-07 — feat: the DCN step, a SimNucleus over the placeless net` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-07 — merge: dcn-l44 into alfonso-frontend-jjtl (P-2026-11-07-1545)` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-07 — feat: an invocation is one step under Interleave too (R-DCN-22)` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-07 — merge: dcn-l44b into alfonso-frontend-jjtl (P-2026-11-07-1756)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-07 — fix(jjtl): a helper parameter shadows a helper of the same name (P-2026-11-06-2226)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-07 — merge: jjtl-helper-param-shadow into alfonso-frontend-jjtl (P-2026-11-07-1643)` once (trunk).
4. `git merge --no-ff --no-commit 065a1c501`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: oi-s3b into alfonso-frontend-jjtl (P-2026-11-07-1834)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `065a1c501` in `/Users/alfonso/jjodel-w-oi-s3b`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-oi-s3b`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard f5fc80aaf` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only f5fc80aaf HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/instance-of.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the oi-s3b merge (P-2026-11-07-1834)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-oi-s3b`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
