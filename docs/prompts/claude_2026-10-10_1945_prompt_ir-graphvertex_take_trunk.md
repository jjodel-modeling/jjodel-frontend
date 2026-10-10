# Prompt: ir-graphvertex takes the trunk before its own merge

Prompt-ID: P-2026-10-10-1945
Chat: —
Lane: full (merge of the trunk into the branch; zero conflicts measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-w-graphvertex`, branch `ir-graphvertex`, a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-graphvertex`, branch `ir-graphvertex`, `git log -1` is the commit that adds this file (its parent `111c9d6e2`), `git status` empty apart from gitignored `frontend/scripts/smoke/_tmp_*`, `MERGE_HEAD` absent. Otherwise stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-10-1945 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

## COSA

RC-14: a branch resolves its conflicts with the trunk on the branch, before the trunk takes it. Bring the trunk `alfonso-frontend-jjtl` at the explicit sha `f753bf0d9` into `ir-graphvertex` with one merge commit, `--no-ff`, in the shape of `92ff4a6ad` (the last merge commit on `ir-graphvertex`; read its body first). Merge base `18d9dfb57`. The trunk brings, since the base, 181 commits:

- `f753bf0d9` docs: Status flip for the RC-45 tier draw lane (P-2026-10-10-1757)
- `b6fce902a` docs: Status flip and log entry for the lane-run-rc45-draw merge (P-2026-10-10-1937)
- `e93cc0d0b` merge: lane-run-rc45-draw into alfonso-frontend-jjtl (P-2026-10-10-1937)
- `cf8b1b1ca` docs: add prompt P-2026-10-10-1937, merge lane-run-rc45-draw into alfonso-frontend-jjtl
- `d63a4e8e6` docs: Status flip and log entry, lane-run-rc45-draw took the trunk (P-2026-10-10-1923)
- `2913eced0` merge: lane-run-rc45-draw takes alfonso-frontend-jjtl (P-2026-10-10-1923)
- `fc06723e8` docs: add prompt P-2026-10-10-1923, merge alfonso-frontend-jjtl into lane-run-rc45-draw
- `9d41d0bce` docs: Status flip and log entry for the board-kindof-merges merge (P-2026-10-10-1913)
- `2ad7460d0` merge: board-kindof-merges into alfonso-frontend-jjtl (P-2026-10-10-1913)
- `fb5ee3efe` docs: add prompt P-2026-10-10-1913, merge board-kindof-merges into alfonso-frontend-jjtl
- `f8d8c333d` docs: Status flip and log entry, board-kindof-merges took the trunk (P-2026-10-10-1851)
- `600eff1e1` docs: Status flip and log entry, lane-run-rc45-draw took the trunk (P-2026-10-10-1848)
- `e1eb53d43` docs: Status flip and log entry for the board-req-port-disc merge (P-2026-10-10-1852)
- `e388a90ee` docs: merge prompt P-2026-10-10-1754 superseded by P-2026-10-10-1802
- `74b52cd99` merge: board-req-port-disc into alfonso-frontend-jjtl (P-2026-10-10-1852)
- `43231854c` merge: board-kindof-merges takes alfonso-frontend-jjtl (P-2026-10-10-1851)
- `02b752d65` docs: add prompt P-2026-10-10-1852, merge board-req-port-disc into alfonso-frontend-jjtl
- `cc25ca8cd` docs: add prompt P-2026-10-10-1851, merge alfonso-frontend-jjtl into board-kindof-merges
- `995d7cb18` merge: lane-run-rc45-draw takes alfonso-frontend-jjtl (P-2026-10-10-1848)
- `c315460b0` docs: Status flip and log entry for the timeline-newest-first merge (P-2026-10-10-1843)
- `c97fe9b29` docs: add prompt P-2026-10-10-1848, merge alfonso-frontend-jjtl into lane-run-rc45-draw
- `31706d940` merge: timeline-newest-first into alfonso-frontend-jjtl (P-2026-10-10-1843)
- `06bd25bea` docs: Status flip and log entry for the stale-m1-edge merge (P-2026-10-10-1809)
- `0613c8c2b` docs: add prompt P-2026-10-10-1843, merge timeline-newest-first into alfonso-frontend-jjtl
- `b4f9ceb83` fix(harness): drawn view of the model card names the random tier (P-2026-10-10-1757)
- `5e218863b` docs: Status flip and log entry for the board-chat-links merge (P-2026-10-10-1836)
- `6abb5ea11` docs(decisions): RC-45 part 2 uses the check:docs sentinel for Corregge (P-2026-10-10-1757)
- `d77cd0c4e` merge: board-chat-links into alfonso-frontend-jjtl (P-2026-10-10-1836)
- `0a6081439` docs: add prompt P-2026-10-10-1836, merge board-chat-links into alfonso-frontend-jjtl
- `ffd37e8af` docs: Status flip and log entry for the lane-board-columns merge (P-2026-10-10-1823)
- `1ab2d5a49` docs: board README and log entry for the RC-45 draw (P-2026-10-10-1757)
- `8a1068660` feat(harness): lane-run draws the tier of eligible lanes (RC-45) (P-2026-10-10-1757)
- `345b14db7` docs: Status flip for the req-tab port discovery (P-2026-10-10-1806)
- `fd59eefaa` merge: lane-board-columns into alfonso-frontend-jjtl (P-2026-10-10-1823)
- `21d8dc2e7` docs: Status flip for the JjEL lexer own-key lane (P-2026-10-10-1756)
- `bda3f8820` docs: Status flip and log entry for the jjel-lexer-own-keys merge (P-2026-10-10-1817)
- `fe34f0936` docs: add prompt P-2026-10-10-1823, merge lane-board-columns into alfonso-frontend-jjtl
- `6ae97ac36` docs: Status flip for the lane board chat links lane (P-2026-10-10-1816)
- `f08ffade3` docs: log entry for the lane board chat links (P-2026-10-10-1816)
- `0d8180ebc` docs(discovery): what harness-req-tab still adds to the trunk board (P-2026-10-10-1806)
- and 141 more: `git log --oneline 18d9dfb57..f753bf0d9`

This branch brings, 33 commits:

- `111c9d6e2` docs: graphVertex S6 log entry (P-2026-10-10-0105)
- `b89000360` docs: graphVertex S6 Auto layout measurements (P-2026-10-10-0105)
- `f8934e929` chore(probe): S6 Auto layout scenes in the BPMN and statechart fixtures (P-2026-10-10-0105)
- `65dc0fe7e` feat(editor-v2): Auto layout across graphVertex containers, S6 (P-2026-10-10-0105)
- `92ff4a6ad` merge: ir-graphvertex-s4 into ir-graphvertex (P-2026-10-10-1716)
- `4b1013141` docs: add prompt P-2026-10-10-1716, merge ir-graphvertex-s4 into ir-graphvertex
- `6af346852` docs(prompts): Status flip, P-2026-10-10-1156 (aligned with ir-graphvertex-s4)
- `2adb2cd8e` docs(prompts): Status flip, P-2026-10-10-1156
- `ab8f512c3` docs: graphVertex S4 closure, screenshots and inbox entry (P-2026-10-10-1156)
- `0ead2cb30` docs: graphVertex S2b log entry and a ticket (P-2026-10-10-0105)
- `3858e8cf2` docs: graphVertex S2b spec section, R-GV-15 and measurements (P-2026-10-10-0105)
- `7b0aa3a46` chore(probe): statechart fixture, the S2b oracle (P-2026-10-10-0105)
- `d2f169781` feat(ir): graphVertex self-framing containers and dashed separators, S2b (P-2026-10-10-0105)
- `30a73a67c` docs(spec): channel edges no longer backed by a reference are removed, not hidden (P-2026-10-10-0105)
- `f4756a94b` docs: graphVertex S3 log entry and three tickets (P-2026-10-10-0105)
- `aa6d4b670` docs: graphVertex S3 measurements and LIR deviations (P-2026-10-10-0105)
- `d174cf607` chore(probe): BPMN fixture S3 scenes, the gestures oracle (P-2026-10-10-0105)
- `38e7a6006` feat(editor-v2): graphVertex membership drop, pool drag, lane resize (P-2026-10-10-0105)
- `ab22e962a` feat(ir): graphVertex drop planning and live gestures, S3 (P-2026-10-10-0105)
- `d08cf5665` docs(lir): graphVertex S3 gestures and membership (P-2026-10-10-0105)
- `55aa06faf` docs(spec): channel edges hide for every claim, lost ones included (P-2026-10-10-1156)
- `6dfb762c1` test(authoring): close the five survivors of the S4 mutation bench (P-2026-10-10-1156)
- `f1adba8ac` feat(authoring): graphVertex panel, containment section and D-a seed (P-2026-10-10-1156)
- `b48595776` merge: ir-graphvertex takes alfonso-frontend-jjtl (P-2026-10-10-1246)
- `bdaa0fece` docs: add prompt P-2026-10-10-1246, merge alfonso-frontend-jjtl into ir-graphvertex
- `c1a425988` docs(prompts): graphVertex S4 authoring panel and seed (P-2026-10-10-1156)
- `7d334c817` docs: graphVertex S2 measurements and log entry (P-2026-10-10-0105)
- `b7e061436` chore(probe): BPMN pools-and-lanes fixture, the S2 oracle (P-2026-10-10-0105)
- `6e22f4a9b` feat(ir): render graphVertex partitions, header bands, channel edges (P-2026-10-10-0105)
- `1f02e06f7` docs: log entry for graphVertex S0 and S1 (P-2026-10-10-0105)
- `c64b9bfaf` feat(ir): graphVertex channel, layout, membership keys and partitions (P-2026-10-10-0105)
- `b7d131729` docs(spec): graphVertex containment addendum and R-GV rows (P-2026-10-10-0105)
- `f17ca6da8` docs(discovery): graphVertex for OMG-faithful BPMN lanes (P-2026-10-10-0105)

Measured by `lane-run merge --trunk-into` at 2026-10-10 19:45, trunk at `f753bf0d9`:

- `git merge-tree --write-tree --name-only ir-graphvertex f753bf0d9`: zero conflicts.
- Files changed since the base: 108 on the branch side, 153 on the trunk side; on both sides: `docs/decisions.md`, `docs/prompts/claude_2026-10-10_1156_prompt_graphvertex_s4_authoring.md`.
- `git diff --name-only 18d9dfb57 111c9d6e2 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-10-10_1246_prompt_ir-graphvertex_take_trunk.md` (da eseguire), `claude_2026-10-10_1716_prompt_merge_ir-graphvertex-s4.md` (da eseguire).
- `git worktree list`: `ir-graphvertex` in `/Users/alfonso/jjodel-w-graphvertex`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** `lane-run merge --direct` fell back:

- branch prompts whose Status is not eseguito: `claude_2026-10-10_1246_prompt_ir-graphvertex_take_trunk.md` (da eseguire), `claude_2026-10-10_1716_prompt_merge_ir-graphvertex-s4.md` (da eseguire)

## COME

1. Preconditions above, plus: `f753bf0d9` is the tip of `alfonso-frontend-jjtl` (if a docs-only commit moved it, say so and merge `f753bf0d9` all the same); `git worktree list` shows `alfonso-frontend-jjtl` only in `/Users/alfonso/jjodel-release`.
2. Measure again: `git merge-tree --write-tree --name-only ir-graphvertex f753bf0d9` (measured above: zero conflicts). A conflict in any file outside `docs/decisions.md` and `docs/log-inbox/*.md`: **stop** with `Outcome: question` and the conflict hunks quoted; do not resolve code by hand in this lane.
3. `git merge --no-ff --no-commit f753bf0d9`.
4. Resolve `docs/decisions.md`, if it conflicts, by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block, each section heading once. Resolve every `docs/log-inbox/*.md` that conflicts by union: preamble, the trunk's entries, then the branch's entries, all verbatim, each heading once. Probes on the resolved tree, each counted with `grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-GV-1` (branch), `R-GV-2` (branch), `R-GV-3` (branch), `R-GV-4` (branch), `R-GV-5` (branch), `R-GV-6` (branch), `R-GV-7` (branch), `R-GV-8` (branch), `R-GV-9` (branch), `R-GV-10` (branch), `R-GV-11` (branch), `R-GV-12` (branch), `R-GV-13` (branch), `R-GV-14` (branch), `R-GV-15` (branch), `RC-44` (trunk), `RC-45` (trunk), `R-SIM-144` (trunk), `R-SIM-146` (trunk); control: `- **R-SIM-147**` none.
   - `docs/decisions.md`: the heading `## R-GV — graphVertex containment: channel, layout, membership (ratifiche 2026-10-10)` once (branch).
   - `docs/log-inbox/ir-graphvertex-s4.md`: the heading `## 2026-10-10 — feat(authoring): graphVertex authoring panel, containment section and D-a seed, S4 (P-2026-10-10-1156)` once (branch).
   - `docs/log-inbox/ir-graphvertex.md`: the heading `## 2026-10-10 — docs(discovery): graphVertex for OMG-faithful BPMN lanes (P-2026-10-10-0105)` once (branch).
   - `docs/log-inbox/ir-graphvertex.md`: the heading `## 2026-10-10 — feat(ir): graphVertex containment keys, spec addendum and R-GV rows, S0 and S1 (P-2026-10-10-0105)` once (branch).
   - `docs/log-inbox/ir-graphvertex.md`: the heading `## 2026-10-10 — feat(ir): graphVertex partitions, header bands and channel edges rendered, S2 (P-2026-10-10-0105)` once (branch).
   - `docs/log-inbox/ir-graphvertex.md`: the heading `## 2026-10-10 — feat(editor-v2): graphVertex gestures and membership, S3 (P-2026-10-10-0105)` once (branch).
   - `docs/log-inbox/ir-graphvertex.md`: the heading `## 2026-10-10 — ticket: useJjomSync keeps the RF edge of a deleted M1 reference edge` once (branch).
   - `docs/log-inbox/ir-graphvertex.md`: the heading `## 2026-10-10 — ticket: a state updater replayed by React loops the canvas to the update depth limit` once (branch).
   - `docs/log-inbox/ir-graphvertex.md`: the heading `## 2026-10-10 — ticket: under the pointer the target ghost handle covers the source ghost` once (branch).
   - `docs/log-inbox/ir-graphvertex.md`: the heading `## 2026-10-10 — feat(ir): graphVertex self-framing containers for UML statecharts, S2b (P-2026-10-10-0105)` once (branch).
   - `docs/log-inbox/ir-graphvertex.md`: the heading `## 2026-10-10 — ticket: an IR view cannot hide a reference edge, nor a predicate reach an object's owner` once (branch).
   - `docs/log-inbox/ir-graphvertex.md`: the heading `## 2026-10-10 — feat(editor-v2): graphVertex Auto layout across containers, S6 (P-2026-10-10-0105)` once (branch).
   - `docs/decisions.md`: the heading `### Decisions 2026-10-10: the attributes of the event that fired the step (R-SIM-144)` once (trunk).
   - `docs/decisions.md`: the heading `### Decisions 2026-10-10: the RC-26 points of 2026-10-06 (R-SIM-146)` once (trunk).
   - `docs/log-inbox/codegen-engine.md`: the heading `## 2026-10-10 — feat(codegen): template engine, Text with origin, block indentation, codec (P-2026-10-10-0945)` once (trunk).
   - `docs/log-inbox/codegen-engine.md`: the heading `## 2026-10-10 — merge: codegen-engine into alfonso-frontend-jjtl (P-2026-10-10-1747)` once (trunk).
   - `docs/log-inbox/codegen-runner.md`: the heading `## 2026-10-10 — feat(codegen): JavaScript target profile and sandboxed runner (P-2026-10-10-0950)` once (trunk).
   - `docs/log-inbox/codegen-runner.md`: the heading `## 2026-10-10 — merge: codegen-runner into alfonso-frontend-jjtl (P-2026-10-10-1802)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — feat(harness): chain forwards --request to its lanes (P-2026-10-10-1243)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — merge: chain-request into alfonso-frontend-jjtl (P-2026-10-10-1250)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — feat(harness): lane board shows when each lane started and ended (P-2026-10-10-1253)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — merge: lane-board-times into alfonso-frontend-jjtl (P-2026-10-10-1312)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — feat(harness): every prompt names its front, Check E (P-2026-10-10-1500)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — feat(harness): lane-run projects each lane onto its GitHub card (P-2026-10-10-1532)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — ticket: trunk prompts after FRONT_FROM lack Front:, Check E fails them at the merge` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — ticket: issue-discovery.md renders no Front:, start --auto will refuse auto-intake lanes` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — fix(harness): front cut-off to P-2026-10-11-0000, auto-intake renders Front (P-2026-10-10-1612)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — ticket: the moved cut-off leaves this lane's GitHub card open, In progress` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — ticket: issue-discovery.md renders no Depends: line (RC-42)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — feat(harness): lane board Insights, models, code areas, first-shot (P-2026-10-10-1520)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — merge: lane-board-model-insights takes alfonso-frontend-jjtl (P-2026-10-10-1635)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — merge: lane-board-model-insights into alfonso-frontend-jjtl (P-2026-10-10-1708)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — feat(harness): lane board shows the span beside the working time (P-2026-10-10-1717)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — merge: lane-tracking into alfonso-frontend-jjtl (P-2026-10-10-1648)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — ticket: merge-into-trunk.md misreads a governance go-ahead and counts check:docs as 4/4` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — merge: lane-board-span into alfonso-frontend-jjtl (P-2026-10-10-1731)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — ticket: `lane-run resume` cannot carry the critical-zone go-ahead` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — feat(harness): lane board tables with fixed column widths (P-2026-10-10-1742)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — merge: lane-board-columns into alfonso-frontend-jjtl (P-2026-10-10-1823)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — feat(harness): lane board links each lane to its chat (P-2026-10-10-1816)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — merge: board-chat-links into alfonso-frontend-jjtl (P-2026-10-10-1836)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — feat(harness): lane board timeline lists the newest lanes first (P-2026-10-10-1744)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — merge: timeline-newest-first into alfonso-frontend-jjtl (P-2026-10-10-1843)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — merge: board-req-port-disc into alfonso-frontend-jjtl (P-2026-10-10-1852)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — fix(harness): lane board counts a two-merge lane as a merge (P-2026-10-10-1803)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — merge: board-kindof-merges takes alfonso-frontend-jjtl (P-2026-10-10-1851)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — merge: board-kindof-merges into alfonso-frontend-jjtl (P-2026-10-10-1913)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — feat(harness): lane-run draws the tier of eligible lanes, RC-45 (P-2026-10-10-1757)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — merge: lane-run-rc45-draw takes alfonso-frontend-jjtl (P-2026-10-10-1848)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — merge: lane-run-rc45-draw takes alfonso-frontend-jjtl (P-2026-10-10-1923)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-10 — merge: lane-run-rc45-draw into alfonso-frontend-jjtl (P-2026-10-10-1937)` once (trunk).
   - `docs/log-inbox/jjel-lexer-own-keys.md`: the heading `## 2026-10-10 — fix: JjEL lexer looks up OCL messages and keywords by own key` once (trunk).
   - `docs/log-inbox/jjel-lexer-own-keys.md`: the heading `## 2026-10-10 — ticket: JjScript looks up tables and variable maps keyed by source text on plain objects` once (trunk).
   - `docs/log-inbox/jjel-lexer-own-keys.md`: the heading `## 2026-10-10 — merge: jjel-lexer-own-keys into alfonso-frontend-jjtl (P-2026-10-10-1817)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-10 — discovery: event attributes read by guards and actions (P-2026-10-10-1630)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-10 — merge: sim-event-attrs into alfonso-frontend-jjtl (P-2026-10-10-1718)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-10 — feat: board editor arrows move, Shift and an arrow select, old CSS removed (P-2026-10-10-1645)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-10 — merge: sim-board-keys into alfonso-frontend-jjtl (P-2026-10-10-1726)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-10 — feat: fixed-width Coverage switch, Clear sees the live marking (P-2026-10-10-1646)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-10 — merge: sim-coverage-polish into alfonso-frontend-jjtl (P-2026-10-10-1737)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-10 — feat: event reads checked at Reset, the unset warning, R-SIM-144 (P-2026-10-10-1630)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-10 — merge: sim-event-attrs into alfonso-frontend-jjtl (P-2026-10-10-1753)` once (trunk).
   - `docs/log-inbox/stale-m1-edge.md`: the heading `## 2026-10-10 — docs(discovery): stale M1 reference edge, root cause and fix plan (P-2026-10-10-1600)` once (trunk).
   - `docs/log-inbox/stale-m1-edge.md`: the heading `## 2026-10-10 — ticket: a bare DeleteElementAction leaves the edge id in its vertices' edgesOut and edgesIn` once (trunk).
   - `docs/log-inbox/stale-m1-edge.md`: the heading `## 2026-10-10 — fix(sync): a stale M1 reference edge leaves graph.subElements, F1 (P-2026-10-10-1600)` once (trunk).
   - `docs/log-inbox/stale-m1-edge.md`: the heading `## 2026-10-10 — merge: stale-m1-edge into alfonso-frontend-jjtl (P-2026-10-10-1809)` once (trunk).
5. On the resolved tree, before committing, read every file changed on both sides once from top to bottom (`docs/decisions.md`, `docs/prompts/claude_2026-10-10_1156_prompt_graphvertex_s4_authoring.md`); an auto-merge is a textual result, not a semantic one: no conflict marker, no duplicated declaration, hook or selector, one root per component.
6. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: ir-graphvertex takes alfonso-frontend-jjtl (P-2026-10-10-1945)`. Body: the two sides' shas, the merge-tree measurement, the union resolutions, the reading of step 5, `Model:` and `Co-Authored-By` trailers.
7. Gates on the merge commit, from `frontend/`: typecheck exit 2 with the §17 set (14); `typecheck:scripts` exit 0; vitest: state the expectation first as the trunk tip's count (measure it read-only in `/Users/alfonso/jjodel-release` with `npx vitest run --reporter=dot`; do not write there) plus the tests this branch added, 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 111c9d6e2` (this branch's own pre-merge tip; the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 8.
8. `Outcome: hard-stop`: the chat re-runs the visual probes of the branch on this tree and gives the GO. Do not start a server.
9. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane ir-graphvertex · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of the `docs/log-inbox/` file of this branch's front (the branch adds headings to `docs/log-inbox/ir-graphvertex-s4.md`, `docs/log-inbox/ir-graphvertex.md`), both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry, ir-graphvertex took the trunk (P-2026-10-10-1945)` (P16, RC-17). `Outcome: done`. The merge of `ir-graphvertex` into the trunk gets its own prompt (`lane-run merge ir-graphvertex --into alfonso-frontend-jjtl`).

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 7), `git checkout -- .`, `git clean`, `--no-verify`, a hand edit to a code file, editing any line inside a decision block or a log entry, rebase, squash, push, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-release`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge --trunk-into` from `frontend/scripts/lane-templates/trunk-into-branch.md`, in the shape of `claude_2026-09-27_0325_prompt_sim_profiles_take_trunk.md`.
