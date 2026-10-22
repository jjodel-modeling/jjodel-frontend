# Prompt: merge sim-docs into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-22-1313
Chat: C-2026-10-22-1050
Request: https://claude.ai/code/session_018F8q1ZrKrECfKBBHqcxogb (merge of sim-docs launched by chat C-2026-10-22-1050)
Lane: full (merge; 1 conflict: `docs/log-inbox/simulation.md` measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-22-1313 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `48fa3567e`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `sim-docs` into the trunk with one merge commit, `--no-ff`, of the explicit sha `3970d3aef`, in the shape of `b636e7161` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `425187033`. The branch carries, on top of the base, 5 commits:

- `3970d3aef` docs: Status flip and log entry for sim docs (P-2026-10-20-0035)
- `45b575dcf` docs(sim): simulation guide, semantics reference, discovery (P-2026-10-20-0015)
- `f7d8cf72e` docs: add prompt P-2026-10-20-0035, simulation docs continuation
- `65cad6f72` docs: rename prompt to P-2026-10-20-0015 (ID collision)
- `4e6283ba2` docs: add prompt P-2026-10-20-0010, simulation docs

The trunk carries, since the base, 360 commits:

- `48fa3567e` docs(lane-board): the launchd agent needs ProcessType Interactive; Status of the board-timer merge (P-2026-10-22-1225)
- `959dcb120` test(lane-run): track --sync compares card lines only, not the live registry milestone lines
- `b636e7161` merge: board-timer into alfonso-frontend-jjtl (P-2026-10-22-1225)
- `156e6111f` docs: add prompt P-2026-10-22-1225, merge board-timer into alfonso-frontend-jjtl
- `3500c525c` docs(harness): log entry and Status flip for the board timer (P-2026-10-22-1210)
- `ab4824a83` fix(lane-board): git reads off the event loop, kill on child runtime (P-2026-10-22-1210)
- `bae3a2809` docs(templates): RC-23 passed for P-2026-10-22-1150
- `90f117a41` docs(harness): close the notation-library front on its 3.2 cut (R-LIB-23)
- `08446cfea` docs: Status flip and log entry for the tpl-mode merge (P-2026-10-22-1203)
- `2ba77d965` merge: tpl-mode into alfonso-frontend-jjtl (P-2026-10-22-1203)
- `612fb994c` docs: add prompt P-2026-10-22-1210, board status timer
- `abfa860e6` docs: add prompt P-2026-10-22-1203, merge tpl-mode into alfonso-frontend-jjtl
- `3c90455bd` docs: Status flip and log entry for the status-cache merge (P-2026-10-22-1147)
- `0764dcd90` merge: status-cache into alfonso-frontend-jjtl (P-2026-10-22-1147)
- `b10c3bada` docs: add prompt P-2026-10-22-1147, merge status-cache into alfonso-frontend-jjtl
- `ea6fc96fe` docs(harness): log entry and Status flip for status --all cache (P-2026-10-22-1140)
- `be184d551` perf(lane-run): cache the outcome of exited lanes in status --all (P-2026-10-22-1140)
- `6b1646b40` docs(templates): log entry and Status, Templates mode on entry (P-2026-10-22-1150)
- `a8f9b2115` fix(navbar): restore persisted Advanced after every state reset (P-2026-10-22-1150)
- `a9d439520` docs(library): R-LIB-22 header back to the parsable form, renumbering note in the body
- `412d4e8f5` docs: add prompt P-2026-10-22-1140, status --all outcome cache
- `949939e22` docs(library): R-LIB-23 splits the front, notation-seal opened; provisional R-LIB-11 renumbered R-LIB-22
- `b91c751ac` docs(library): RC-23 visual check of L-B1..L-E passed, prompt P-2026-10-22-1150 (Templates mode on entry)
- `b367ff16c` merge: a3-on-trunk into alfonso-frontend-jjtl (P-2026-10-21-2024)
- `38c40fbf8` docs: add prompt P-2026-10-21-2024, merge a3-on-trunk into alfonso-frontend-jjtl
- `a994b7d24` docs: A3 on the trunk, closure; R-VP-60 ratified (P-2026-10-21-1925)
- `2c2a20895` docs(lir): A3 on the 2026-10-21 trunk, addendum (P-2026-10-21-1925)
- `3c3c2874c` docs: S3b Phase 1 closed, R-OI-15..16, prompts P-2026-10-21-1955 and 1956
- `7ae59d306` merge: elk-handles-a3 into a3-on-trunk, A3 on the trunk (P-2026-10-21-1925)
- `cefa91df0` docs(tack): ticket, stale Outcome after a resumed run dies (found by P-2026-10-20-0030)
- `7ecaa5c45` docs(prompts): A3 on the current trunk (P-2026-10-21-1925)
- `992b457db` docs: visual GO on oi-s2u and oi-s3a, prompt P-2026-10-21-1910 (S3b)
- `59630dd1e` docs: Status of P-2026-10-21-1636, S3a closed on oi-s3a
- `328ccf79f` docs: renumber drag release prompt to P-2026-10-21-1830
- `de902341a` docs: add prompt P-2026-10-21-1820, discovery of the hitch at drag release
- `1c9076800` docs: session checkpoint 2026-10-21, harness model and large-model performance
- `08f443877` docs: Status flip and log entry for the perf-round3 merge (P-2026-10-21-1753)
- `460d77437` merge: perf-round3 into alfonso-frontend-jjtl (P-2026-10-21-1753)
- `79767908f` docs: add prompt P-2026-10-21-1753, merge perf-round3 into alfonso-frontend-jjtl
- `b0a5ec435` docs: Status of P-2026-10-21-1635, S3a gates and bench
- and 320 more: `git log --oneline 425187033..48fa3567e`

Measured by `lane-run merge` at 2026-10-22 13:13, trunk at `48fa3567e`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 3970d3aef`: 1 conflict: `docs/log-inbox/simulation.md`.
- Files changed since the base: 6 on the branch side, 388 on the trunk side; on both sides: `docs/log-inbox/simulation.md`.
- `git diff --name-only 425187033 3970d3aef -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-10-20_0015_prompt_sim_semantics_docs.md` (eseguito 2026-10-20 · lane sim-docs · 45b575dcf), `claude_2026-10-20_0035_prompt_sim_semantics_docs_continue.md` (eseguito 2026-10-20 · lane sim-docs · 45b575dcf).
- `git worktree list`: `sim-docs` in `/Users/alfonso/jjodel-w-simdocs`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-10-22-1313/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `3970d3aef` is the tip of `sim-docs`; the prompt files of the branch read `Status: eseguito` at `3970d3aef`; `git worktree list` shows `sim-docs` only in `/Users/alfonso/jjodel-w-simdocs`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 3970d3aef` (measured above: 1 conflict: `docs/log-inbox/simulation.md`). `git diff --name-only 425187033 3970d3aef -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 425187033 alfonso-frontend-jjtl` with `git diff --name-only 425187033 3970d3aef` (measured above: `docs/log-inbox/simulation.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-SIM-147` (trunk), `R-VP-60` (trunk), `R-GV-18` (trunk), `R-REL-2` (trunk), `R-REL-3` (trunk), `R-LIB-22` (trunk), `R-LIB-23` (trunk), `R-TACK-5` (trunk), `R-TACK-6` (trunk), `R-TACK-7` (trunk), `R-OI-1` (trunk), `R-OI-2` (trunk), `R-OI-3` (trunk), `R-OI-4` (trunk), `R-OI-5` (trunk), `R-OI-6` (trunk), `R-OI-7` (trunk), `R-OI-8` (trunk), `R-OI-9` (trunk), `R-OI-10` (trunk), `R-OI-11` (trunk), `R-OI-12` (trunk), `R-OI-13` (trunk), `R-OI-14` (trunk), `R-OI-15` (trunk), `R-OI-16` (trunk), `R-BV-1` (trunk), `R-BV-2` (trunk), `R-BV-3` (trunk), `R-BV-4` (trunk), `R-BV-5` (trunk), `R-BV-6` (trunk), `R-BV-7` (trunk), `R-BV-8` (trunk), `R-BV-10` (trunk), `R-BV-9` (trunk); control: `- **R-BV-11**` none.
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-20 — docs: simulation guide and semantics reference (P-2026-10-20-0015, P-2026-10-20-0035)` once (branch).
   - `docs/decisions.md`: the heading `### Decisions 2026-10-20: a trigger that fork or join fusion drops (R-SIM-147)` once (trunk).
   - `docs/decisions.md`: the heading `## R-OI — ontological instantiation in one model: UML class and object diagrams (decisions 2026-10-20)` once (trunk).
   - `docs/decisions.md`: the heading `## R-BV: fixed-width bit-vector values in JjEL (decisions 2026-10-20)` once (trunk).
   - `docs/log-inbox/graphvertex.md`: the heading `## 2026-10-20 — fix(editor-v2): graphVertex hides the edges a container encloses, R-GV-18 (P-2026-10-20-1420)` once (trunk).
   - `docs/log-inbox/graphvertex.md`: the heading `## 2026-10-20 — merge: gv-enclosed-edges into alfonso-frontend-jjtl (P-2026-10-20-1437)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-20 — fix(harness): lane-run status reads the Outcome of the latest run only (P-2026-10-20-0030)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-20 — merge: lane-status-stale into alfonso-frontend-jjtl (P-2026-10-20-0102)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-21 — ticket: traceMonitor test fails in merge gates while the dev server holds 3001` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-21 — fix(lane-monitor-app): external links in the Lane board window open in the browser (P-2026-10-21-1000)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-21 — merge: lanemon-links into alfonso-frontend-jjtl (P-2026-10-21-1008)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-21 — feat(lane-monitor-app): the tray title shows waiting and running counts (P-2026-10-21-1020)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-21 — ticket: Flaky vitest under load blocks direct merges (traceMonitor port-in-use and others)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-22 — perf(lane-run): status --all caches the outcome of exited lanes (P-2026-10-22-1140)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-22 — merge: status-cache into alfonso-frontend-jjtl (P-2026-10-22-1147)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-22 — fix(lane-board): git reads off the event loop, status kill on child runtime (P-2026-10-22-1210)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-10-21 — ticket: JjEL: 0xFF evaluates silently to 0 (lenient parse drops trailing tokens)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-10-21 — ticket: codegen: a Run result holding a bit-vector breaks JSON.stringify in CodePanel and checkView` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-10-21 — ticket: codegen: the example templates' inDomain has no word case` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-10-21 — ticket: Extend the codegen prelude parity test to the 4733-row oracle table` once (trunk).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-10-20 — docs: discovery, ontological instantiation in one model (P-2026-10-20-1835)` once (trunk).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-10-20 — feat: S1 binding codec, reader and check (P-2026-10-20-2010)` once (trunk).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-10-20 — chore: UML class and object fixture, run and commit (P-2026-10-20-2330)` once (trunk).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-10-20 — ticket: IR cannot express four UML notations` once (trunk).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-10-20 — ticket: isKind on a one-step path to a contained value never matches` once (trunk).
   - `docs/log-inbox/jjel-bitvector.md`: the heading `## 2026-10-21 — fix: code panel prints a bit-vector run result instead of throwing` once (trunk).
   - `docs/log-inbox/jjel-bitvector.md`: the heading `## 2026-10-21 — fix: JjEL keyword as member name after `.` and `?.`` once (trunk).
   - `docs/log-inbox/jjel-bitvector.md`: the heading `## 2026-10-20 — feat: JjEL bit-vector values, discovery and slice S1` once (trunk).
   - `docs/log-inbox/jjel-bitvector.md`: the heading `## 2026-10-21 — merge: jjel-bitvector into alfonso-frontend-jjtl (P-2026-10-21-0002)` once (trunk).
   - `docs/log-inbox/jjel-bitvector.md`: the heading `## 2026-10-21 — merge: jjel-keyword-member into alfonso-frontend-jjtl (P-2026-10-21-0025)` once (trunk).
   - `docs/log-inbox/jjel-bitvector.md`: the heading `## 2026-10-21 — feat: JjEL bit-vector slice S2, the simulator word domain` once (trunk).
   - `docs/log-inbox/jjel-bitvector.md`: the heading `## 2026-10-21 — merge: bv-sim into alfonso-frontend-jjtl (P-2026-10-21-0105)` once (trunk).
   - `docs/log-inbox/jjel-bitvector.md`: the heading `## 2026-10-21 — test: JjEL bit-vector operators against a Verilator oracle` once (trunk).
   - `docs/log-inbox/jjel-bitvector.md`: the heading `## 2026-10-21 — merge: bv-oracle into alfonso-frontend-jjtl (P-2026-10-21-0659)` once (trunk).
   - `docs/log-inbox/jjel-bitvector.md`: the heading `## 2026-10-21 — feat: JjEL bit-vector slice S3, code generation` once (trunk).
   - `docs/log-inbox/jjel-bitvector.md`: the heading `## 2026-10-21 — merge: bv-codegen into alfonso-frontend-jjtl (P-2026-10-21-0845)` once (trunk).
   - `docs/log-inbox/jjel-bitvector.md`: the heading `## 2026-10-21 — merge: bv-codepanel into alfonso-frontend-jjtl (P-2026-10-21-0855)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-10-20 — chore(jjscript): remove TEMP-DISCOVERY timing logs (P-2026-10-20-0032)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-10-20 — merge: jjscript-timing-logs into alfonso-frontend-jjtl (P-2026-10-20-0046)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-10-20 — fix(editor): build References target lists only when the section is open (P-2026-10-20-1955)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-10-20 — merge: perf-click-profile into alfonso-frontend-jjtl (P-2026-10-20-2020)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-10-21 — merge: perf-slow-round2 into alfonso-frontend-jjtl (P-2026-10-21-0013)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-10-21 — fix(model): LModel.name without the $name scan, duplicate names in O(n) (P-2026-10-21-0030)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-10-21 — merge: core-name-scans into alfonso-frontend-jjtl (P-2026-10-21-0149)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-10-21 — fix(editor-v2): useJjomSync re-transforms only changed vertices (P-2026-10-21-0335)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-10-21 — ticket: M2 attribute rename leaves M1 nodes stale under a viewpoint` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-10-21 — merge: jjomsync-incremental into alfonso-frontend-jjtl (P-2026-10-21-0416)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-10-21 — ticket: Layout autosave flush on pagehide cannot finish on large projects` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-10-21 — fix(editor-v2): fitViewOptions without a body style read per render (P-2026-10-21-1115)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-10-21 — merge: perf-round3 into alfonso-frontend-jjtl (P-2026-10-21-1232)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-10-21 — fix(editor-v2): intrinsic measure cache with inherited-CSS invalidation (P-2026-10-21-1535)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-10-21 — merge: perf-round3 into alfonso-frontend-jjtl (P-2026-10-21-1753)` once (trunk).
   - `docs/log-inbox/notation-library.md`: the heading `## 2026-10-18 — ticket: import loses the user-defined megamodel edges: registered under the file's project id` once (trunk).
   - `docs/log-inbox/notation-library.md`: the heading `## 2026-10-18 — feat: library gallery, five R-LIB-5 projects built and cloned from Templates (P-2026-10-18-1800)` once (trunk).
   - `docs/log-inbox/notation-library.md`: the heading `## 2026-10-18 — ticket: the app-bar mode control shows Basic after leaving All Projects, the stored mode is advanced` once (trunk).
   - `docs/log-inbox/notation-library.md`: the heading `## 2026-10-18 — feat: derived viewpoints in the five gallery projects, S1b (P-2026-10-18-2150)` once (trunk).
   - `docs/log-inbox/notation-library.md`: the heading `## 2026-10-18 — feat: gallery templates and examples, versioned, deep link, hand-written viewpoints (P-2026-10-18-2300)` once (trunk).
   - `docs/log-inbox/notation-library.md`: the heading `## 2026-10-18 — ticket: edges end about 5 px off the node border in every diagram` once (trunk).
   - `docs/log-inbox/notation-library.md`: the heading `## 2026-10-19 — feat: hand-written viewpoints for the two gallery examples (P-2026-10-19-0300)` once (trunk).
   - `docs/log-inbox/notation-library.md`: the heading `## 2026-10-19 — feat: IR predicate simActive, the Petri example's tokens hidden during a run (P-2026-10-19-0930)` once (trunk).
   - `docs/log-inbox/shell-ui.md`: the heading `## 2026-10-20 — feat: menus on shell tokens, 8px panels, 36/28px items (S5)` once (trunk).
   - `docs/log-inbox/shell-ui.md`: the heading `## 2026-10-20 — merge: shell-ui-s5 into alfonso-frontend-jjtl (P-2026-10-20-0039)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-20 — feat(sim): compile defect trigger-position for triggers dropped by fork or join fusion (P-2026-10-20-0031)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-20 — merge: sim-trigger-position into alfonso-frontend-jjtl (P-2026-10-20-0026)` once (trunk).
   - `docs/log-inbox/tack.md`: the heading `## 2026-10-19 — feat: Tack slice 8, the Lanes page (Phase 2)` once (trunk).
   - `docs/log-inbox/tack.md`: the heading `## 2026-10-20 — fix: Tack slice 8, the Lanes view registers and polls in a browser` once (trunk).
   - `docs/log-inbox/tack.md`: the heading `## 2026-10-20 — fix: Tack slice 8, lane closure by any commit mention and prompt Status, whole ids in the table` once (trunk).
   - `docs/log-inbox/tack.md`: the heading `## 2026-10-20 — merge: tack-s8 into alfonso-frontend-jjtl (P-2026-10-20-0052)` once (trunk).
   - `docs/log-inbox/tack.md`: the heading `## 2026-10-21 — merge: tack-spec into alfonso-frontend-jjtl (P-2026-10-21-1023)` once (trunk).
   - `docs/log-inbox/tack.md`: the heading `## 2026-10-21 — feat: Tack stops, breakpoint, ceiling and hard-stop classes, auto pill` once (trunk).
   - `docs/log-inbox/tack.md`: the heading `## 2026-10-21 — feat: Tack slice 9, waiting cards, /api/attention, distinct stop events` once (trunk).
   - `docs/log-inbox/tack.md`: the heading `## 2026-10-21 — merge: tack-s9 into alfonso-frontend-jjtl (P-2026-10-21-1141)` once (trunk).
   - `docs/log-inbox/tack.md`: the heading `## 2026-10-21 — feat: Tack S1, trace-source boundary around lane-run` once (trunk).
   - `docs/log-inbox/tack.md`: the heading `## 2026-10-21 — merge: tack-s1a into alfonso-frontend-jjtl (P-2026-10-21-1246)` once (trunk).
   - `docs/log-inbox/tack.md`: the heading `## 2026-10-21 — feat: Tack v0 closure, v0.1.0, bounded repos output, first run on two foreign repositories` once (trunk).
   - `docs/log-inbox/tack.md`: the heading `## 2026-10-21 — merge: tack-v0 into alfonso-frontend-jjtl (P-2026-10-21-1438)` once (trunk).
   - `docs/log-inbox/tack.md`: the heading `## 2026-10-21 — fix: Tack v0b, preselect the start work tree when it has no session` once (trunk).
   - `docs/log-inbox/tack.md`: the heading `## 2026-10-21 — merge: tack-v0b into alfonso-frontend-jjtl (P-2026-10-21-1558)` once (trunk).
   - `docs/log-inbox/tack.md`: the heading `## 2026-10-21 — ticket: Tack collector shows a stale Outcome after a resumed run dies` once (trunk).
   - `docs/log-inbox/templates-ui.md`: the heading `## 2026-10-19 — fix: template previews cropped to the root class, lane L-C2 (P-2026-10-19-1651)` once (trunk).
   - `docs/log-inbox/templates-ui.md`: the heading `## 2026-10-19 — feat: File › New in the 3.2 structure, lane L-E (P-2026-10-19-1650)` once (trunk).
   - `docs/log-inbox/templates-ui.md`: the heading `## 2026-10-19 — feat: New model dialog, metamodel tab only, lane L-D (P-2026-10-19-1618)` once (trunk).
   - `docs/log-inbox/templates-ui.md`: the heading `## 2026-10-19 — feat: gallery preview snapshots, lane L-C (P-2026-10-19-1617)` once (trunk).
   - `docs/log-inbox/templates-ui.md`: the heading `## 2026-10-19 — feat: dashboard sidebar and quick tip on Templates, lane L-B2 (P-2026-10-19-1616)` once (trunk).
   - `docs/log-inbox/templates-ui.md`: the heading `## 2026-10-19 — feat: templates page, catalog fields and filters, lane L-B1 (P-2026-10-19-1615)` once (trunk).
   - `docs/log-inbox/templates-ui.md`: the heading `## 2026-10-22 — fix: Templates page keeps the persisted Advanced mode on entry (P-2026-10-22-1150)` once (trunk).
   - `docs/log-inbox/templates-ui.md`: the heading `## 2026-10-22 — merge: tpl-mode into alfonso-frontend-jjtl (P-2026-10-22-1203)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-21 — merge: elk-handles-a3 onto the 2026-10-21 trunk, A3 re-measured (P-2026-10-21-1925)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-10 — revert(editor-v2): A3 back, handles of an ELK-routed edge on its drawn ends (P-2026-10-10-0915)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-10 — ticket: a Petri net (classic) derived viewpoint loops on a node drag («Maximum update depth»)` once (trunk).
4. `git merge --no-ff --no-commit 3970d3aef`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: sim-docs into alfonso-frontend-jjtl (P-2026-10-22-1313)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `3970d3aef` in `/Users/alfonso/jjodel-w-simdocs`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-simdocs`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 48fa3567e` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only 48fa3567e HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/simulation.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the sim-docs merge (P-2026-10-22-1313)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-simdocs`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
