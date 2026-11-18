# Prompt: merge textual-d3c-rules into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-08-0004
Chat: C-2026-11-03-1037
Request: https://claude.ai/code/session_01DQt9R5nh3m4Y234MPGL9kH (merge of textual-d3c-rules launched by chat C-2026-11-03-1037)
Lane: full (merge; 1 conflict: `docs/log-inbox/codegen.md` measured)
Status: eseguito 2026-11-08 · lane merge · cae331a7c · verifica visiva passata 2026-11-08 (D3c crops 1-before-run, 2-after-run, 3-after-typing, 4-apply in ~/.jjodel-lanes/P-2026-11-07-1838/ checked by the chat)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-08-0004 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `efd40eb55`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `textual-d3c-rules` into the trunk with one merge commit, `--no-ff`, of the explicit sha `8e5e473f0`, in the shape of `6a2c07153` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `f5fc80aaf`. The branch carries, on top of the base, 4 commits:

- `8e5e473f0` docs: Status flip and log entry for D3c (P-2026-11-07-1838)
- `8cdb3ea8f` feat(codegen): D3c, validation-rule markers in the Text tab (P-2026-11-07-1838)
- `8d7605eef` feat(codegen): D3c, validation-rule problems mapped to the spans (P-2026-11-07-1838)
- `999841571` docs: add prompt P-2026-11-07-1838, D3c validation-rule markers

The trunk carries, since the base, 91 commits:

- `efd40eb55` docs: ticket #720, lane-run merge Prompt-ID collision
- `e91177c3b` docs: close the F1e merge by hand (P-2026-11-07-1834)
- `d9187549d` docs: fix Corregge and Causa of the 3.1.2 release entry (P-2026-11-07-1536)
- `58ffe3266` docs: Status flip and log entry for the dcn-l24 merge (P-2026-11-07-1953)
- `6a2c07153` merge: dcn-l24 into alfonso-frontend-jjtl (P-2026-11-07-1953)
- `6e92c6ebf` docs: add prompt P-2026-11-07-1953, merge dcn-l24 into alfonso-frontend-jjtl
- `fa3559653` docs(dcn): trunk-into-dcn-l24 log entry, Status flip (P-2026-11-07-1945)
- `ea08a0f8b` merge: alfonso-frontend-jjtl into dcn-l24 (P-2026-11-07-1945)
- `cca2171ca` docs(dcn): prompt to take the trunk into dcn-l24 (P-2026-11-07-1945)
- `63e44ede5` docs(dcn): L2.4 log entry, three tickets, Status flips (P-2026-11-07-1900)
- `eb96cbb10` feat(dcn): well-formedness W1..W4, W6 as node problems of kind dcn (P-2026-11-07-1900)
- `03bc50239` docs: session checkpoint, textual steps D, E, F (C-2026-11-03-1037)
- `d410d22a1` merge: title-probe into alfonso-frontend-jjtl (P-2026-11-07-1903)
- `5960f0aa3` docs: add prompt P-2026-11-07-1903, merge title-probe into alfonso-frontend-jjtl
- `3ad2d1eff` docs(harness): close session title hook probe
- `7533f14dd` docs(dcn): L2.4 continuation prompt (P-2026-11-07-1900)
- `e5add4d95` merge: oi-s3b into alfonso-frontend-jjtl (P-2026-11-07-1834)
- `adf6c9629` merge: textual-f1e-names into alfonso-frontend-jjtl (P-2026-11-07-1834)
- `94cec3edf` docs(harness): session title hook probe report and log entry (P-2026-11-07-1830)
- `02269f010` docs: 3.1.2 release check, Status and log entry (P-2026-11-07-1536)
- `02abdd3ff` docs: add prompt P-2026-11-07-1834, merge oi-s3b into alfonso-frontend-jjtl
- `8eda5e601` docs: add prompt P-2026-11-07-1834, merge textual-f1e-names into alfonso-frontend-jjtl
- `065a1c501` docs: flip Status of P-2026-11-06-2257 to eseguito
- `12019b986` docs(dcn): Layer Impact Report for L2.4 well-formedness (P-2026-11-07-1825)
- `08ef03176` docs: Status flip and log entry for F1e (P-2026-11-07-1736)
- `4f3f1b90f` docs(dcn): L2.4 prompt (P-2026-11-07-1825)
- `83d82e12a` feat(codegen): F1e, `self.<f>` name check in the islands (P-2026-11-07-1736)
- `7ceddb928` docs: S2, S3a, S3b probe results on the per-tab fix
- `79f7dbbc2` test(codegen): F1e, `self.<f>` name check in the islands, red (P-2026-11-07-1736)
- `0584f4d97` docs: add prompt P-2026-11-07-1736, F1e self name check
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
- and 51 more: `git log --oneline f5fc80aaf..efd40eb55`

Measured by `lane-run merge` at 2026-11-08 00:04, trunk at `efd40eb55`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 8e5e473f0`: 1 conflict: `docs/log-inbox/codegen.md`.
- Files changed since the base: 5 on the branch side, 77 on the trunk side; on both sides: `docs/log-inbox/codegen.md`.
- `git diff --name-only f5fc80aaf 8e5e473f0 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-07_1838_prompt_textual_d3c_rules.md` (eseguito 2026-11-07 · lane full · 8d7605eef (pure, red first), 8cdb3ea8f · gates green (vitest: 3 import reds baseline) · app check 15/15 ALL PASS, crops in ~/.jjodel-lanes/P-2026-11-07-1838/ · log entry in docs/log-inbox/codegen.md).
- `git worktree list`: `textual-d3c-rules` in `/Users/alfonso/jjodel-w-textd3c`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-11-08-0004/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `8e5e473f0` is the tip of `textual-d3c-rules`; the prompt files of the branch read `Status: eseguito` at `8e5e473f0`; `git worktree list` shows `textual-d3c-rules` only in `/Users/alfonso/jjodel-w-textd3c`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 8e5e473f0` (measured above: 1 conflict: `docs/log-inbox/codegen.md`). `git diff --name-only f5fc80aaf 8e5e473f0 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only f5fc80aaf alfonso-frontend-jjtl` with `git diff --name-only f5fc80aaf 8e5e473f0` (measured above: `docs/log-inbox/codegen.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-OI-17` (trunk); control: `- **R-OI-18**` none.
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — feat(codegen): D3c, validation-rule markers in the Text tab (P-2026-11-07-1838)` once (branch).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — feat(codegen): F1e, `self.<f>` name check in the islands (P-2026-11-07-1736)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — merge: textual-f1e-names into alfonso-frontend-jjtl (P-2026-11-07-1834)` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-07 — feat: DCN well-formedness W1..W4, W6 as node problems of kind dcn` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-07 — ticket: the conformance validator parses DCN bodies outside the DCN action mode` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-07 — ticket: a W1 guard on a class of the same viewpoint always raises a W2 self-loop` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-07 — ticket: W1 on the Alert invariants of the drone export, association ends not reachable from self` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-07 — merge: alfonso-frontend-jjtl into dcn-l24 (P-2026-11-07-1945)` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-07 — merge: dcn-l24 into alfonso-frontend-jjtl (P-2026-11-07-1953)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-11-07 — probe: a hook sets the session title (P-2026-11-07-1830)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-11-08 — ticket: lane-run merge gives the same Prompt-ID to two chats in the same minute` once (trunk).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-10-21 — fix: S2 closure, cascade clamp, acceptance probe and assets (P-2026-10-21-0635)` once (trunk).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-10-21 — ticket: a new instance's node is clipped, name and type unreadable` once (trunk).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-10-21 — ticket: place a new instance at the click without breaking undo` once (trunk).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-10-21 — fix: size a new instance's node from its rows, ticket (b) closed (P-2026-10-21-0725)` once (trunk).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-10-21 — ticket: a new instance made from the class diagram keeps 280x60 in the object diagram` once (trunk).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-10-21 — fix: S2u one undo entry per instantiation, tickets (a) and (c) closed (P-2026-10-21-1219)` once (trunk).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-10-21 — ticket: undo outside a group merges shallow and leaves idlookup orphans` once (trunk).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-10-21 — fix: S3a acceptance probe, regression, assets, closing (P-2026-10-21-1636)` once (trunk).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-10-21 — ticket: an orphan slot's row shows its value with no feature name` once (trunk).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-10-21 — ticket: an undo entry with nothing created after a problem-dot click` once (trunk).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-10-25 — fix: S3b ghost and orphan rows, probe, regression, assets (P-2026-10-25-2220)` once (trunk).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-10-25 — ticket: opening a ghost row's editor adds an undo entry with nothing created` once (trunk).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-10-25 — ticket: a ghost row's feature name is cut while its value is typed` once (trunk).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-11-06 — fix: undo groups reconciled with option (c), L1..L2 closed (P-2026-11-06-2257)` once (trunk).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-11-07 — fix: undo groups L3..L5 on oi-s3a and oi-s3b, chain closed (P-2026-11-07-0155)` once (trunk).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-11-07 — fix: the right button opens the pane menu, no pan (P-2026-11-07-1235)` once (trunk).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-11-07 — fix: instance-of on the multi-tab trunk, per-tab producer and placement (P-2026-11-07-1620)` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-07 — release: 3.1.2, the layout-key fix on the 3.1.1 base (P-2026-11-07-1536)` once (trunk).
4. `git merge --no-ff --no-commit 8e5e473f0`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: textual-d3c-rules into alfonso-frontend-jjtl (P-2026-11-08-0004)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `8e5e473f0` in `/Users/alfonso/jjodel-w-textd3c`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-textd3c`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard efd40eb55` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only efd40eb55 HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/codegen.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the textual-d3c-rules merge (P-2026-11-08-0004)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-textd3c`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
