# Prompt: oi-s3b takes the trunk before its own merge

Prompt-ID: P-2026-11-07-1517
Chat: C-2026-10-25-2159
Request: none (rendered by lane-run, no chat URL known for C-2026-10-25-2159)
Lane: full (merge of the trunk into the branch; 1 conflict: `frontend/src/redux/reducer/__tests__/undoGroup.test.ts` measured)
Status: eseguito 2026-11-07 · lane full · merge cbc392c69 (undoGroup.test.ts union, gates green; check:addonly red, inherited from trunk 3f7f6f7f4, declared) · log entry in docs/log-inbox/instance-of.md with P-2026-11-07-1620

Worktree: `/Users/alfonso/jjodel-w-oi-s3b`, branch `oi-s3b`, a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-oi-s3b`, branch `oi-s3b`, `git log -1` is the commit that adds this file (its parent `e193ad04a`), `git status` empty apart from gitignored `frontend/scripts/smoke/_tmp_*`, `MERGE_HEAD` absent. Otherwise stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-07-1517 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

## COSA

RC-14: a branch resolves its conflicts with the trunk on the branch, before the trunk takes it. Bring the trunk `alfonso-frontend-jjtl` at the explicit sha `4834b0edb` into `oi-s3b` with one merge commit, `--no-ff`, in the shape of `f04faba02` (the last merge commit on `oi-s3b`; read its body first). Merge base `0fa6e4414`. The trunk brings, since the base, 329 commits:

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
- `945db7ab8` docs: close the textual-687-comment-enter merge by hand (P-2026-11-07-1330)
- `b33b17377` docs: prompt P-2026-11-07-1352, L3 app check and closure
- `c9d3ba4e2` merge: textual-687-comment-enter into alfonso-frontend-jjtl (P-2026-11-07-1330)
- `2f89a7aa3` docs: Status flip and log entry for the dcn-l42 merge (P-2026-11-07-1308)
- `0002f1ae4` feat(editor-v2): EditorV2 hands the tab viewpoint to useJjomSync (P-2026-11-07-1249)
- `b42fdf824` docs: Status flips and log entry for #656 L2 (P-2026-11-07-1230; P-2026-11-07-1003 dropped)
- `8ce739219` docs: add prompt P-2026-11-07-1330, merge textual-687-comment-enter into alfonso-frontend-jjtl
- `3f67f4e4c` docs: Status flip and log entry, textual-687-comment-enter took trunk (P-2026-11-07-1248)
- `1015af5e1` feat(editor-v2): the three canvas doors take the tab's layout key (P-2026-11-07-1249)
- `4678327cc` test(editor-v2): the three canvas doors under the tab's layout key, red (P-2026-11-07-1249)
- `75f973840` merge: dcn-l42 into alfonso-frontend-jjtl (P-2026-11-07-1308)
- `d9424764a` docs: Layer Impact Report for multi-tab L3, the tab's layout key (P-2026-11-07-1249)
- `0d3af6e1d` docs: add prompt P-2026-11-07-1308, merge dcn-l42 into alfonso-frontend-jjtl
- `178c1c837` merge: dcn-l34 into dcn-l42 (d0a81202d)
- `cfef82da2` fix(codegen): #656 CHECK 2 and XMI read a never-written name slot (P-2026-11-07-1230)
- `d0a81202d` docs(dcn): Status flip and log entry for the L3.4 slot writes (P-2026-11-07-1215)
- `5d86470c9` feat(jjel): slot writes `self.battery := e` in a DCN action mode (P-2026-11-07-1215)
- `9e36d009a` docs(dcn): L4.2 log entry and Status flip (P-2026-11-07-1216)
- `cc917a087` merge: textual-687-comment-enter takes alfonso-frontend-jjtl (P-2026-11-07-1248)
- `d2baf819c` test(codegen): #656 CHECK 2 and XMI read a never-written name slot, red (P-2026-11-07-1230)
- `9d3a79c22` docs: prompt P-2026-11-07-1249, multi-tab lane L3
- `6a3b1cfc3` docs: Status flip and log entry for E3 (P-2026-11-07-1208)
- `4ea6bc699` docs: add prompt P-2026-11-07-1248, merge alfonso-frontend-jjtl into textual-687-comment-enter
- `839affc1a` fix(sim): under the dcn shape the roles dialog shows the dcn group only (P-2026-11-07-1216)
- `a5bef0684` feat(sim): the DCN compiler, roles and model to a placeless net (P-2026-11-07-1216)
- and 289 more: `git log --oneline 0fa6e4414..4834b0edb`

This branch brings, 56 commits:

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
- `8b79e63ff` feat(onto): S3a slot problems in the registry and Sync slots (P-2026-10-21-1600)
- `78d91320b` docs(onto): S3a discovery, slot problems and Sync slots (P-2026-10-21-1405)
- `53834b0b2` docs: S2u closure entry, tickets (a) and (c) closed, shallow merge (P-2026-10-21-1219)
- `3d5b3fd8a` chore(probe): S2-3b1 comment, the pointedBy entry follows a pane click (P-2026-10-21-1219)
- `a38d2fc4e` docs(onto): S2u acceptance assets, run 3 of P-2026-10-21-1219
- `951feff3e` chore(probe): S2u undo presses without the pane click, store idle first (P-2026-10-21-1219)
- `765b9f94f` revert(core): drop the 450 ms merge into a closed group entry (P-2026-10-21-1219)
- and 16 more: `git log --oneline 0fa6e4414..e193ad04a`

Measured by `lane-run merge --trunk-into` at 2026-11-07 15:17, trunk at `4834b0edb`:

- `git merge-tree --write-tree --name-only oi-s3b 4834b0edb`: 1 conflict: `frontend/src/redux/reducer/__tests__/undoGroup.test.ts`.
- Files changed since the base: 51 on the branch side, 231 on the trunk side; on both sides: `docs/decisions.md`, `frontend/scripts/smoke/states.ts`, `frontend/src/components/editor-v2/EditorV2.tsx`, `frontend/src/components/editor-v2/problems/registry.ts`, `frontend/src/redux/reducer/__tests__/undoGroup.test.ts`, `frontend/src/redux/reducer/reducer.ts`.
- `git diff --name-only 0fa6e4414 e193ad04a -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-10-25_2205_prompt_onto_s3b_code_resume.md` (eseguito), `claude_2026-10-25_2220_prompt_onto_s3b_probe.md` (eseguito 2026-10-25 · lane full · probe cd69c6243, closing f6bf690b7 · Alfonso visual GO 2026-11-07 15:10 on :3005 (binding declared from the console, pages added from the console)), `claude_2026-11-06_2150_prompt_onto_undo_l1_merge.md` (eseguito 2026-11-06 · lane full · 197ae1fd1), `claude_2026-11-06_2225_prompt_onto_undo_l1b.md` (eseguito 2026-11-06 · lane full · 9baae8d88), `claude_2026-11-06_2257_prompt_onto_undo_l2_probes.md` (da eseguire), `claude_2026-11-06_2340_prompt_onto_undo_l3_s3a.md` (eseguito), `claude_2026-11-07_0005_prompt_onto_s3_4_diagnosis.md` (eseguito), `claude_2026-11-07_0040_prompt_onto_overlay_click_fix.md` (eseguito), `claude_2026-11-07_0110_prompt_onto_undo_l4_s3b.md` (eseguito), `claude_2026-11-07_0155_prompt_onto_undo_l5_close.md` (eseguito 2026-11-07 · lane full · probe 23e741a97, docs 5101a9ecb · Alfonso visual GO 2026-11-07 15:10 on :3005 (binding declared from the console, pages added from the console)), `claude_2026-11-07_1235_prompt_onto_pane_menu_right_button.md` (eseguito 2026-11-07 · lane full · fix af1230b5d, probe 5cba3621c, docs 892a962bb · Alfonso visual GO 2026-11-07 15:10 on :3005 (binding declared from the console, pages added from the console)).
- `git worktree list`: `oi-s3b` in `/Users/alfonso/jjodel-w-oi-s3b`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Findings.** `lane-run merge` refuses `--launch` on this measurement:

- a conflict the union rule does not cover: `frontend/src/redux/reducer/__tests__/undoGroup.test.ts`

## COME

1. Preconditions above, plus: `4834b0edb` is the tip of `alfonso-frontend-jjtl` (if a docs-only commit moved it, say so and merge `4834b0edb` all the same); `git worktree list` shows `alfonso-frontend-jjtl` only in `/Users/alfonso/jjodel-release`.
2. Measure again: `git merge-tree --write-tree --name-only oi-s3b 4834b0edb` (measured above: 1 conflict: `frontend/src/redux/reducer/__tests__/undoGroup.test.ts`). A conflict in any file outside `docs/decisions.md` and `docs/log-inbox/*.md`: **stop** with `Outcome: question` and the conflict hunks quoted; do not resolve code by hand in this lane.
3. `git merge --no-ff --no-commit 4834b0edb`.
4. Resolve `docs/decisions.md`, if it conflicts, by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block, each section heading once. Resolve every `docs/log-inbox/*.md` that conflicts by union: preamble, the trunk's entries, then the branch's entries, all verbatim, each heading once. Probes on the resolved tree, each counted with `grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-OI-17` (branch), `R-TXT-54` (trunk), `R-TXT-55` (trunk), `R-TXT-56` (trunk), `R-TXT-57` (trunk), `R-TXT-58` (trunk), `R-FA-13` (trunk), `R-FA-14` (trunk), `R-DCN-1` (trunk), `R-DCN-2` (trunk), `R-DCN-3` (trunk), `R-DCN-4` (trunk), `R-DCN-5` (trunk), `R-DCN-6` (trunk), `R-DCN-7` (trunk), `R-DCN-8` (trunk), `R-DCN-9` (trunk), `R-DCN-10` (trunk), `R-DCN-11` (trunk), `R-DCN-12` (trunk), `R-DCN-13` (trunk), `R-DCN-14` (trunk), `R-DCN-15` (trunk), `R-DCN-16` (trunk), `R-DCN-17` (trunk), `R-DCN-18` (trunk), `R-DCN-19` (trunk), `R-DCN-20` (trunk), `R-DCN-21` (trunk), `R-MT-1` (trunk), `R-MT-2` (trunk), `R-MT-3` (trunk), `R-MT-4` (trunk), `R-MT-5` (trunk), `R-MT-6` (trunk), `R-MT-7` (trunk), `R-MT-8` (trunk), `R-MT-9` (trunk), `R-MT-10` (trunk), `R-MT-11` (trunk), `R-MT-12` (trunk), `R-MT-13` (trunk), `R-MT-14` (trunk), `R-MT-15` (trunk), `R-MT-16` (trunk), `R-MT-17` (trunk), `R-MT-18` (trunk), `R-MT-19` (trunk), `R-MT-20` (trunk), `R-MT-21` (trunk), `R-MT-22` (trunk), `R-MT-23` (trunk); control: `- **R-MT-24**` none.
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
   - `docs/decisions.md`: the heading `## R-DCN: Dynamic Classification Notation, viewpoints of dynamic classes and their simulation (decisions 2026-11-06)` once (trunk).
   - `docs/decisions.md`: the heading `## R-MT: several tabs on models, each with its own viewpoint (decisions 2026-11-06)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-06 — feat(codegen): D2a, the expected set at a cursor (P-2026-11-06-2118)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-06 — feat(codegen): D2b, completion candidates in the language service (P-2026-11-06-2146)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-06 — feat(codegen): D2c, the completion provider of the Text tab (P-2026-11-06-2213)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-06 — merge: textual-d-writing-aids into alfonso-frontend-jjtl (P-2026-11-06-2243)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-06 — fix(editor-v2): C2e, a nameless reference target is labelled `: <Class>` on the IR form (P-2026-11-06-2041)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-06 — merge: textual-c2e-ir-chip into alfonso-frontend-jjtl (P-2026-11-06-2302)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-06 — feat(codegen): D1, commenting an object out asks first (P-2026-11-06-2301)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-06 — merge: textual-d1-comment-guard into alfonso-frontend-jjtl (P-2026-11-06-2326)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-06 — docs: step E discovery, T10 and synced selection (P-2026-11-06-2337)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — merge: textual-e-sync into alfonso-frontend-jjtl (P-2026-11-07-0017)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — docs: step F discovery, embedded JjEL and tracing (P-2026-11-06-2357)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — merge: textual-f-jjel-tracing into alfonso-frontend-jjtl (P-2026-11-07-0116)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-06 — feat(codegen): D3a, structured fixes on parse errors (P-2026-11-06-2328)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — merge: textual-d-writing-aids takes alfonso-frontend-jjtl (P-2026-11-07-0117)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — feat(codegen): D3b, quick fixes and conformance markers (P-2026-11-07-0157)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — ticket: Objects created on the canvas (and by the create command) leave the name slot empty` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — merge: textual-d-writing-aids into alfonso-frontend-jjtl (P-2026-11-07-0250)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — discovery: the empty raw name slot of an object created from text (P-2026-11-07-0253)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — fix(codegen): the textual layer writes the name slot of an object it creates (P-2026-11-07-0344)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — merge: textual-name-slot into alfonso-frontend-jjtl (P-2026-11-07-0443)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — feat(codegen): E1a, T10's splice keeps typed text (P-2026-11-07-0048)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — merge: textual-e1-reprint takes alfonso-frontend-jjtl (P-2026-11-07-0251)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — feat(codegen): E1b, T10 wired into the Text tab (P-2026-11-07-0510)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — merge: textual-e1-reprint takes alfonso-frontend-jjtl (P-2026-11-07-0607)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — merge: textual-e1-reprint into alfonso-frontend-jjtl (P-2026-11-07-0645)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — feat(codegen): D4, safe rename through the text (P-2026-11-07-0609)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — merge: textual-d4-rename into alfonso-frontend-jjtl (P-2026-11-07-0717)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — feat(codegen): E2a, text to canvas selection (P-2026-11-07-0746, P-2026-11-07-0840)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — merge: textual-e2a-select into alfonso-frontend-jjtl (P-2026-11-07-0927)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — ticket: A canvas create gets no undo step of its own (reducer.ts:1280 vertex merge)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — fix(codegen): Cmd+Z after a no-change edit undoes the text (P-2026-11-07-0912)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — merge: textual-undo-agreement into alfonso-frontend-jjtl (P-2026-11-07-1103)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — ticket: Text tab: Enter at the end of a comment accepts a completion (// end stateState)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — feat(codegen): D5, Format Document and Format Selection (P-2026-11-07-0747, P-2026-11-07-0841)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — merge: textual-d5-format into alfonso-frontend-jjtl (P-2026-11-07-1141)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — fix(codegen): #687, Enter at a comment's end breaks the line (P-2026-11-07-1145)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — merge: textual-687-comment-enter takes alfonso-frontend-jjtl (P-2026-11-07-1248)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — merge: textual-687-comment-enter into alfonso-frontend-jjtl (P-2026-11-07-1330)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — feat(codegen): E3, the Text tab opens beside its model's canvas (P-2026-11-07-1208)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — merge: textual-e3-beside into alfonso-frontend-jjtl (P-2026-11-07-1353)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — discovery: ticket #656, the identity slot of objects created by JjScript and on the canvas (P-2026-11-07-0720)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — fix(codegen): #656 lane L2, CHECK 2 and the XMI export read a never-written name slot (P-2026-11-07-1230)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — merge: slot-identity-656 into alfonso-frontend-jjtl (P-2026-11-07-1418)` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-06 — feat: featureSources in the ontological binding, dormant slots in the feature closure` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-07 — merge: dcn-l21 into alfonso-frontend-jjtl (P-2026-11-06-2351)` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-06 — chore: DCN drone fixture, the DCN metamodel and the drone class level on the UML fixture` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-07 — feat: parse `::` and `self.in(V::D)` into a ClassificationTest node` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-07 — refactor: a nucleus field on the simulator run, Petri as its default` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-07 — feat: the classification accessor on the JjEL evaluation context` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-07 — feat: the dcn role group and the system profile Dynamic classification` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-07 — merge: dcn into alfonso-frontend-jjtl (P-2026-11-07-1123)` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-07 — feat: the DCN compiler, resolved roles and model to a placeless net` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-07 — feat: slot writes `self.battery := e` in a DCN action mode` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-07 — merge: dcn-l42 into alfonso-frontend-jjtl (P-2026-11-07-1308)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-06 — fix(jjtl): a failing builtin names the rule and source element (P-2026-11-06-2305)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-07 — merge: jjtl-builtin-errors into alfonso-frontend-jjtl (P-2026-11-07-0011)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-07 — fix(jjtl): a failed run returns no target model (P-2026-11-07-1125)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-07 — docs: closure of the blocked jjtl-failed-run-no-target merge` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-07 — merge: multi-tab into alfonso-frontend-jjtl (P-2026-11-07-0041)` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-07 — fix: a model tab stops rewriting the viewpoint of the other open tabs` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-07 — merge: multi-tab-l1 into alfonso-frontend-jjtl (P-2026-11-07-0231)` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-07 — merge: multi-tab-l0b into alfonso-frontend-jjtl (P-2026-11-07-0351)` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-07 — fix: a viewpoint switch re-transforms every vertex once (R-MT-19)` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-07 — perf: a key-only layout switch skips the transformer (R-MT-19)` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-07 — merge: multi-tab-layout-key into alfonso-frontend-jjtl (P-2026-11-07-0748)` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-07 — fix: problem producers clear only on the last unmount of a model` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-07 — merge: multi-tab-l4b into alfonso-frontend-jjtl (P-2026-11-07-0853)` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-07 — feat: per-tab viewpoint plumbing, saved abstract syntax restored (multi-tab L2)` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-07 — fix: the viewpoint write on tab focus adds no undo entry (multi-tab L2)` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-07 — merge: multi-tab-l2 into alfonso-frontend-jjtl (P-2026-11-07-1210)` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-07 — feat: the three canvas doors take the tab's layout key (multi-tab L3)` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-07 — merge: multi-tab-l3 into alfonso-frontend-jjtl (P-2026-11-07-1438)` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-07 — demo: Smart building multi-tab project, built through the app, exported and delivered` once (trunk).
5. On the resolved tree, before committing, read every file changed on both sides once from top to bottom (`docs/decisions.md`, `frontend/scripts/smoke/states.ts`, `frontend/src/components/editor-v2/EditorV2.tsx`, `frontend/src/components/editor-v2/problems/registry.ts`, `frontend/src/redux/reducer/__tests__/undoGroup.test.ts`, `frontend/src/redux/reducer/reducer.ts`); an auto-merge is a textual result, not a semantic one: no conflict marker, no duplicated declaration, hook or selector, one root per component.
6. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: oi-s3b takes alfonso-frontend-jjtl (P-2026-11-07-1517)`. Body: the two sides' shas, the merge-tree measurement, the union resolutions, the reading of step 5, `Model:` and `Co-Authored-By` trailers.
7. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: state the expectation first as the trunk tip's count (measure it read-only in `/Users/alfonso/jjodel-release` with `node /Users/alfonso/jjodel-w-oi-s3b/frontend/scripts/run-quiet.mjs vitest-trunk -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-release`/frontend`, the runner's log goes to this tree's `.agent-logs/`; do not write there) plus the tests this branch added, 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard e193ad04a` (this branch's own pre-merge tip; the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 8.
8. `Outcome: hard-stop`: the chat re-runs the visual probes of the branch on this tree and gives the GO. Do not start a server.
9. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane oi-s3b · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/instance-of.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry, oi-s3b took the trunk (P-2026-11-07-1517)` (P16, RC-17). `Outcome: done`. The merge of `oi-s3b` into the trunk gets its own prompt (`lane-run merge oi-s3b --into alfonso-frontend-jjtl`).

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 7), `git checkout -- .`, `git clean`, `--no-verify`, a hand edit to a code file, editing any line inside a decision block or a log entry, rebase, squash, push, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-release`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge --trunk-into` from `frontend/scripts/lane-templates/trunk-into-branch.md`, in the shape of `claude_2026-09-27_0325_prompt_sim_profiles_take_trunk.md`.
